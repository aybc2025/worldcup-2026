import { useQuery } from '@tanstack/react-query'
import { fetchAllFixtures, fetchOpenFootballSchedule } from '../services/apiClient'
import { TTL, POLL } from '../config/constants'

// Live statuses per worldcup26.ir API
const LIVE_STATUSES = new Set(['1H', 'HT', '2H', 'ET', 'P', 'BT', 'LIVE'])

function hasLiveMatch(data) {
  const fixtures = normalizeFixtures(data)
  return fixtures.some((f) => {
    const s = f?.status || f?.fixture?.status?.short
    return LIVE_STATUSES.has(s)
  })
}

// worldcup26.ir may return array directly or wrapped object — normalise both
export function normalizeFixtures(data) {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (Array.isArray(data.games)) return data.games
  if (Array.isArray(data.matches)) return data.matches
  if (Array.isArray(data.response)) return data.response
  return []
}

export function useAllFixtures() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['fixtures', 'all'],
    queryFn: fetchAllFixtures,
    staleTime: TTL.FIXTURES_ALL,
    refetchInterval: (query) =>
      hasLiveMatch(query.state.data) ? POLL.LIVE : POLL.IDLE,
    refetchIntervalInBackground: false,
    // Fallback to openfootball if main API fails
    retry: 2,
  })

  // Fallback query — only runs if main query errored
  const fallback = useQuery({
    queryKey: ['fixtures', 'fallback'],
    queryFn: fetchOpenFootballSchedule,
    staleTime: TTL.FIXTURES_ALL,
    enabled: isError,
    retry: 1,
  })

  const fixtures = isError
    ? normalizeFixtures(fallback.data)
    : normalizeFixtures(data)

  return {
    fixtures,
    isLoading: isLoading && !isError,
    isError: isError && fallback.isError,
    error,
    refetch,
    isFallback: isError && !fallback.isError,
  }
}
