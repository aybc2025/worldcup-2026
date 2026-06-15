import { useQuery } from '@tanstack/react-query'
import { fetchAllFixtures } from '../services/apiClient'
import { normalizeFixtures } from './useMatches'
import { TTL, POLL } from '../config/constants'

const LIVE_STATUSES = new Set(['1H', 'HT', '2H', 'ET', 'P', 'BT', 'LIVE'])

export function useMatch(id) {
  // worldcup26.ir doesn't have a single-match endpoint,
  // so we fetch all fixtures and filter — they're cached by React Query anyway
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['fixtures', 'all'],
    queryFn: fetchAllFixtures,
    staleTime: TTL.LIVE_MATCH,
    refetchInterval: (query) => {
      const fixtures = normalizeFixtures(query.state.data)
      const match = fixtures.find((f) => String(f.id || f.fixture?.id) === String(id))
      const status = match?.status || match?.fixture?.status?.short
      return LIVE_STATUSES.has(status) ? POLL.LIVE : false
    },
    refetchIntervalInBackground: false,
    enabled: !!id,
  })

  const fixtures = normalizeFixtures(data)
  const fixture = fixtures.find((f) => String(f.id || f.fixture?.id) === String(id)) ?? null

  const status = fixture?.status || fixture?.fixture?.status?.short
  const isLive = LIVE_STATUSES.has(status)

  // Normalise to a consistent shape regardless of API source
  const normalised = fixture ? normaliseMatch(fixture) : null

  return {
    fixture: normalised,
    isLive,
    isLoading,
    isError,
    error,
    // worldcup26.ir embeds events/lineups/stats inside the match object
    events: normalised?.events ?? [],
    lineups: normalised?.lineups ?? [],
    stats: normalised?.statistics ?? [],
  }
}

/**
 * worldcup26.ir returns a different shape than api-football.
 * Normalise to a consistent internal format our components expect.
 */
function normaliseMatch(f) {
  // Already in api-football shape
  if (f.fixture && f.teams && f.goals !== undefined) return f

  // worldcup26.ir shape
  return {
    fixture: {
      id: f.id,
      date: f.kickoff_utc || f.date,
      status: { short: f.status || f.phase, elapsed: f.minute },
      venue: { name: f.stadium?.name || f.stadium, city: f.stadium?.city },
    },
    teams: {
      home: { id: f.home_team?.id, name: f.home_team?.name || f.home_team },
      away: { id: f.away_team?.id, name: f.away_team?.name || f.away_team },
    },
    goals: {
      home: f.home_score ?? f.score_home ?? null,
      away: f.away_score ?? f.score_away ?? null,
    },
    league: { round: f.round || f.stage || f.group_name },
    events: f.events ?? [],
    lineups: f.lineups ?? [],
    statistics: f.statistics ?? [],
  }
}
