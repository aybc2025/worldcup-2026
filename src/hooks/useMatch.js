import { useQuery } from '@tanstack/react-query'
import { fetchAllFixtures, fetchMatchDetail } from '../services/apiClient'
import { normalizeFixtures } from './useMatches'
import { TTL, POLL } from '../config/constants'

const LIVE_STATUSES = new Set(['1H', 'HT', '2H', 'ET', 'P', 'BT', 'LIVE'])

// Our match JSON stores events as { minute, team (string), player (string), type, detail }.
// MatchTimeline expects { time: { elapsed }, team: { id, name }, player: { name }, type, detail }.
function normalizeDetailEvents(events, homeId, awayId, homeName) {
  if (!events?.length) return []
  return events.map((ev) => ({
    time: { elapsed: ev.minute },
    team: {
      id: ev.team === homeName ? homeId : awayId,
      name: ev.team,
    },
    player: { name: ev.player },
    type: ev.type,
    detail: ev.detail,
  }))
}

// Our match JSON uses "Possession"; MatchStats expects "Ball Possession".
function normalizeDetailStats(stats) {
  if (!stats?.length) return []
  return stats.map((side) => ({
    ...side,
    statistics: (side.statistics ?? []).map((s) => ({
      ...s,
      type: s.type === 'Possession' ? 'Ball Possession' : s.type,
    })),
  }))
}

export function useMatch(id) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['fixtures', 'all'],
    queryFn: fetchAllFixtures,
    staleTime: TTL.LIVE_MATCH,
    refetchInterval: (query) => {
      const fixtures = normalizeFixtures(query.state.data)
      const match = fixtures.find((f) => String(f.fixture?.id) === String(id))
      const status = match?.fixture?.status?.short
      return LIVE_STATUSES.has(status) ? POLL.LIVE : false
    },
    refetchIntervalInBackground: false,
    enabled: !!id,
  })

  const fixtures = normalizeFixtures(data)
  const fixture = fixtures.find((f) => String(f.fixture?.id) === String(id)) ?? null
  const isLive = LIVE_STATUSES.has(fixture?.fixture?.status?.short)

  const homeName = fixture?.teams?.home?.name
  const awayName = fixture?.teams?.away?.name
  const homeId   = fixture?.teams?.home?.id
  const awayId   = fixture?.teams?.away?.id

  const { data: detail } = useQuery({
    queryKey: ['match-detail', homeName, awayName],
    queryFn: () => fetchMatchDetail(homeName, awayName),
    staleTime: TTL.SQUAD,  // 24 h — completed match data never changes
    enabled: !!(homeName && awayName),
  })

  return {
    fixture,
    isLive,
    isLoading,
    isError,
    error,
    events: detail
      ? normalizeDetailEvents(detail.events, homeId, awayId, homeName)
      : (fixture?.events ?? []),
    lineups: detail?.lineups ?? [],
    stats:   normalizeDetailStats(detail?.stats),
  }
}
