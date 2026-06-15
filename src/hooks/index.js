import { useQuery } from '@tanstack/react-query'
import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { fetchGroups, fetchTeams } from '../services/apiClient'
import { normalizeFixtures } from './useMatches'
import { TTL } from '../config/constants'

// ── Groups / Standings ────────────────────────────────────

export function useGroups() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['groups'],
    queryFn: fetchGroups,
    staleTime: TTL.STANDINGS,
  })

  // worldcup26.ir returns array of groups directly or wrapped
  const groups = Array.isArray(data)
    ? data
    : Array.isArray(data?.groups)
    ? data.groups
    : []

  return { groups, isLoading, isError, error, refetch }
}

// ── Knockout — derived from fixtures ─────────────────────

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

export function useKnockout(allFixtures = []) {
  const rounds = {}

  for (const f of allFixtures) {
    const raw = f.round || f.stage || f.league?.round || ''
    // find matching canonical label
    const canonical = Object.entries(KNOCKOUT_LABELS).find(([k]) =>
      raw.toLowerCase().includes(k.toLowerCase())
    )?.[1]

    if (!canonical) continue
    if (!rounds[canonical]) rounds[canonical] = []
    rounds[canonical].push(f)
  }

  return { rounds }
}

// ── Teams ─────────────────────────────────────────────────

export function useTeams() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['teams'],
    queryFn: fetchTeams,
    staleTime: TTL.SQUAD,
  })

  const teams = Array.isArray(data) ? data : data?.teams ?? []
  return { teams, isLoading, isError }
}

export function useTeam(id) {
  const { teams, isLoading, isError } = useTeams()
  const team = teams.find((t) => String(t.id) === String(id)) ?? null

  // players are embedded inside team object from worldcup26.ir
  return {
    team,
    players: team?.players ?? team?.squad ?? [],
    isLoading,
    isError,
  }
}

// ── Top Scorers — derived from fixtures ───────────────────

export function useTopScorers(allFixtures = []) {
  const scorerMap = {}

  for (const f of allFixtures) {
    const events = f.events ?? []
    for (const ev of events) {
      if (ev.type !== 'Goal' && ev.detail !== 'Goal') continue
      if (ev.detail === 'Own Goal') continue
      const key = ev.player?.id || ev.player?.name
      if (!key) continue
      if (!scorerMap[key]) {
        scorerMap[key] = {
          player: ev.player,
          team: ev.team,
          goals: 0,
          penalties: 0,
        }
      }
      scorerMap[key].goals++
      if (ev.detail === 'Penalty') scorerMap[key].penalties++
    }
  }

  return Object.values(scorerMap).sort((a, b) => b.goals - a.goals)
}

// ── Favourite Teams ───────────────────────────────────────

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

// ── Online Status ─────────────────────────────────────────

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

// ── Language ──────────────────────────────────────────────

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
