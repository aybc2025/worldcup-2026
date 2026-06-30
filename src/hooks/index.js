import { useQuery } from '@tanstack/react-query'
import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { fetchTeamsData } from '../services/apiClient'
import { useAllFixtures } from './useMatches'
import { TTL } from '../config/constants'
import { FLAG_URL, COUNTRY_CODES, SQUAD_CODE, SQUAD_RAW_URL } from '../config/constants'

// Groups / Standings - computed from fixtures

export function useGroups() {
  const { fixtures, isLoading, isError, error, refetch } = useAllFixtures()

  const groupMap = {}

  for (const f of fixtures) {
    if (!f._group) continue
    const g = f._group
    if (!groupMap[g]) groupMap[g] = {}

    for (const side of ['home', 'away']) {
      const team = f.teams[side]
      if (team.id && !groupMap[g][team.id]) {
        groupMap[g][team.id] = {
          team,
          played: 0, w: 0, d: 0, l: 0,
          gf: 0, ga: 0, gd: 0, points: 0,
        }
      }
    }

    const hg = f.goals.home
    const ag = f.goals.away
    if (hg === null || ag === null) continue

    const hs = groupMap[g][f.teams.home.id]
    const as_ = groupMap[g][f.teams.away.id]
    hs.played++; as_.played++
    hs.gf += hg; hs.ga += ag; hs.gd = hs.gf - hs.ga
    as_.gf += ag; as_.ga += hg; as_.gd = as_.gf - as_.ga

    if (hg > ag)      { hs.w++;  hs.points += 3; as_.l++ }
    else if (hg < ag) { as_.w++; as_.points += 3; hs.l++ }
    else              { hs.d++;  hs.points++;     as_.d++; as_.points++ }
  }

  const groups = Object.entries(groupMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, teams]) => ({
      name,
      teams: Object.values(teams).sort(
        (a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf
      ),
    }))

  return { groups, isLoading, isError, error, refetch }
}

// Knockout - derived from fixtures, with self-resolved winners

const KNOCKOUT_LABELS = {
  'Round of 32': 'Round of 32',
  'Round of 16': 'Round of 16',
  'Quarter-final': 'Quarter-finals',
  'Quarter-finals': 'Quarter-finals',
  'Semi-final': 'Semi-finals',
  'Semi-finals': 'Semi-finals',
  '3rd Place': '3rd Place Play-off',
  'Third Place': '3rd Place Play-off',
  'Final': 'Final',
}

const BRACKET_ORDER = {
  'Round of 32':    [73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88],
  'Round of 16':    [89, 90, 91, 92, 93, 94, 95, 96],
  'Quarter-finals': [97, 98, 99, 100],
  'Semi-finals':    [101, 102],
}

const FEEDS_FROM = {
  89: [74, 77],  90: [73, 75],  91: [76, 78],  92: [79, 80],
  93: [83, 84],  94: [81, 82],  95: [86, 88],  96: [85, 87],
  97: [89, 90],  98: [93, 94],  99: [91, 92],  100: [95, 96],
  101: [97, 98], 102: [99, 100],
  103: [101, 102],
  104: [101, 102],
}

function bracketSort(fixtures, round) {
  const order = BRACKET_ORDER[round]
  if (!order) return fixtures.sort((a, b) => (a.fixture.id ?? 0) - (b.fixture.id ?? 0))
  return fixtures.sort((a, b) => {
    const ai = order.indexOf(a.fixture.id)
    const bi = order.indexOf(b.fixture.id)
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
  })
}

function isDecided(f) {
  return ['FT', 'AET', 'PEN', 'AWD', 'WO'].includes(f?.fixture?.status?.short)
}

function resolveTeam(byId, fixtureId, wantLoser) {
  const f = byId.get(fixtureId)
  if (!f || !isDecided(f)) return null

  const wentToPens = f.score?.penalties?.home != null && f.score?.penalties?.away != null
  const homeScore = wentToPens ? f.score.penalties.home : (f.goals?.home ?? 0)
  const awayScore = wentToPens ? f.score.penalties.away : (f.goals?.away ?? 0)
  if (homeScore === awayScore) return null

  const homeWon = homeScore > awayScore
  if (wantLoser) return homeWon ? f.teams.away : f.teams.home
  return homeWon ? f.teams.home : f.teams.away
}

function isPlaceholder(name) {
  return /^[WL][0-9]+$/.test(name ?? '')
}

export function useKnockout(allFixtures = []) {
  const rounds = {}
  const byId = new Map()

  for (const f of allFixtures) {
    const raw = f.league?.round ?? ''
    const canonical = Object.entries(KNOCKOUT_LABELS).find(([k]) =>
      raw.toLowerCase().includes(k.toLowerCase())
    )?.[1]

    if (!canonical) continue
    if (!rounds[canonical]) rounds[canonical] = []
    rounds[canonical].push(f)
    byId.set(f.fixture.id, f)
  }

  for (const key of Object.keys(rounds)) {
    bracketSort(rounds[key], key)
  }

  for (const fixtures of Object.values(rounds)) {
    for (const f of fixtures) {
      const feeds = FEEDS_FROM[f.fixture.id]
      if (!feeds) continue
      const wantLoser = f.fixture.id === 103
      const feedHomeId = feeds[0]
      const feedAwayId = feeds[1]

      if (isPlaceholder(f.teams.home.name)) {
        const resolved = resolveTeam(byId, feedHomeId, wantLoser)
        if (resolved) f.teams.home = resolved
      }
      if (isPlaceholder(f.teams.away.name)) {
        const resolved = resolveTeam(byId, feedAwayId, wantLoser)
        if (resolved) f.teams.away = resolved
      }
    }
  }

  return { rounds }
}

// Teams - extracted from group stage fixtures only

export function useTeams() {
  const { fixtures, isLoading, isError } = useAllFixtures()

  const teamsMap = {}
  for (const f of fixtures) {
    if (!f._group) continue
    for (const side of ['home', 'away']) {
      const t = f.teams[side]
      if (t.id && !teamsMap[t.id]) teamsMap[t.id] = t
    }
  }

  return { teams: Object.values(teamsMap), isLoading, isError }
}

export function useTeam(id) {
  const { teams, isLoading: teamsLoading, isError: teamsError } = useTeams()
  const team = teams.find((t) => String(t.id) === String(id)) ?? null
  const code = team ? SQUAD_CODE[team.name] : null

  const { data: squadData, isLoading: squadLoading } = useQuery({
    queryKey: ['squad', code],
    queryFn: async () => {
      const res = await fetch(SQUAD_RAW_URL(code))
      if (!res.ok) throw new Error('squad fetch failed')
      return res.json()
    },
    enabled: !!code,
    staleTime: TTL.SQUAD,
  })

  return {
    team,
    players: squadData?.squad ?? [],
    isLoading: teamsLoading || (!!code && squadLoading),
    isError: teamsError,
  }
}

export function useTeamFixtures(teamId) {
  const { fixtures, isLoading, isError } = useAllFixtures()

  const teamFixtures = fixtures
    .filter((f) => f.teams.home.id === teamId || f.teams.away.id === teamId)
    .sort((a, b) => new Date(a.fixture.date) - new Date(b.fixture.date))

  const now = Date.now()
  const results = teamFixtures.filter((f) => f.fixture.status.short === 'FT' || new Date(f.fixture.date) < now)
  const upcoming = teamFixtures.filter((f) => f.fixture.status.short !== 'FT' && new Date(f.fixture.date) >= now)

  return { results, upcoming, isLoading, isError }
}

// Top Scorers - derived from fixture goal events

export function useTopScorers(allFixtures = []) {
  const scorerMap = {}

  for (const f of allFixtures) {
    for (const ev of (f.events ?? [])) {
      if (ev.type !== 'Goal') continue
      if (ev.detail === 'Own Goal') continue
      const key = ev.player?.name
      if (!key) continue
      if (!scorerMap[key]) {
        scorerMap[key] = { player: ev.player, team: ev.team, goals: 0, penalties: 0 }
      }
      scorerMap[key].goals++
      if (ev.detail === 'Penalty') scorerMap[key].penalties++
    }
  }

  return Object.values(scorerMap).sort((a, b) => b.goals - a.goals)
}

// Favourite Teams

const FAV_KEY = 'wc2026_favorites'

export function useFavoriteTeams() {
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem(FAV_KEY) ?? '[]') }
    catch { return [] }
  })

  const toggle = useCallback((teamId) => {
    setFavorites((prev) => {
      const next = prev.includes(teamId)
        ? prev.filter((id) => id !== teamId)
        : [...prev, teamId]
      localStorage.setItem(FAV_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const isFavorite = useCallback((teamId) => favorites.includes(teamId), [favorites])
  return { favorites, toggle, isFavorite }
}

// Online Status

export function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])
  return online
}

// Language

export function useLanguage() {
  const { i18n } = useTranslation()
  const isHebrew = i18n.language?.startsWith('he')

  const toggle = useCallback(() => {
    const next = isHebrew ? 'en' : 'he'
    i18n.changeLanguage(next)
    document.documentElement.setAttribute('dir', next === 'he' ? 'rtl' : 'ltr')
    document.documentElement.setAttribute('lang', next)
  }, [i18n, isHebrew])

  return { language: i18n.language, isHebrew, toggle }
}
