import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { useAllFixtures } from '../hooks/useMatches'
import { MatchCard } from '../components/match/MatchCard'
import { LoadingSpinner, ErrorState, EmptyState } from '../components/common/index'

const LIVE = new Set(['1H', '2H', 'HT', 'ET', 'P', 'BT', 'LIVE'])
const DONE = new Set(['FT', 'AET', 'PEN', 'FT_PEN', 'AWD', 'WO'])

const FILTERS = ['all', 'live', 'upcoming', 'finished']

function getStatus(f) {
  return f.status || f.phase || f.fixture?.status?.short || ''
}

function getDate(f) {
  // localDate is the calendar date in the host city (YYYY-MM-DD), so late-night games
  // (e.g. 21:00 UTC-5 on June 18) don't shift to the next UTC day.
  return f.fixture?.localDate || f.kickoff_utc?.slice(0, 10) || f.fixture?.date?.slice(0, 10) || ''
}

export default function HomePage() {
  const { t } = useTranslation()
  const { fixtures, isLoading, isError, refetch, isFallback } = useAllFixtures()
  const [filter, setFilter] = useState('all')

  const liveCount = fixtures.filter((f) => LIVE.has(getStatus(f))).length

  const grouped = useMemo(() => {
    const filtered = fixtures.filter((f) => {
      const s = getStatus(f)
      if (filter === 'live') return LIVE.has(s)
      if (filter === 'finished') return DONE.has(s)
      if (filter === 'upcoming') return !LIVE.has(s) && !DONE.has(s)
      return true
    })
    return filtered.reduce((acc, f) => {
      const d = getDate(f) || 'TBD'
      if (!acc[d]) acc[d] = []
      acc[d].push(f)
      return acc
    }, {})
  }, [fixtures, filter])

  if (isLoading) return <LoadingSpinner size="lg" />
  if (isError) return <ErrorState onRetry={refetch} />

  return (
    <div className="pb-32">
      {/* Fallback notice */}
      {isFallback && (
        <div className="mx-4 mt-3 mb-1 text-[11px] text-amber bg-amber/10 border border-amber/20 rounded-lg px-3 py-2">
          Showing schedule data (live scores temporarily unavailable)
        </div>
      )}

      {/* Live badge */}
      {liveCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-3 mb-1 flex items-center gap-2 bg-red/10 border border-red/20 rounded-lg px-3 py-2"
        >
          <span className="w-2 h-2 rounded-full bg-red animate-pulse-dot" />
          <span className="text-red text-xs font-semibold">
            {liveCount} {t('home.live')}
          </span>
        </motion.div>
      )}

      {/* Filter tabs — full-width grid */}
      <div className="grid grid-cols-4 gap-2 px-3 py-4">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`py-4 rounded-xl text-sm font-bold transition-all ${
              filter === f
                ? 'bg-teal/20 text-teal border border-teal/40'
                : 'bg-surface text-muted border border-border'
            }`}
          >
            {t(`home.${f}`)}
          </button>
        ))}
      </div>

      {/* Match groups by date */}
      <AnimatePresence mode="wait">
        {Object.keys(grouped).length === 0 ? (
          <EmptyState />
        ) : (
          <div className="px-4 space-y-6">
            {Object.entries(grouped)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([date, matches]) => (
                <div key={date}>
                  <h2 className="text-sm font-bold text-muted tracking-widest uppercase mb-3 px-1">
                    {date === 'TBD' ? 'TBD' : new Date(date + 'T00:00:00Z').toLocaleDateString(undefined, {
  weekday: 'long', month: 'long', day: 'numeric',
  timeZone: 'UTC',
})}
                  </h2>
                  <div className="space-y-3">
                    {[...matches]
                      .sort((a, b) => new Date(a.fixture?.date ?? a.kickoff_utc ?? 0) - new Date(b.fixture?.date ?? b.kickoff_utc ?? 0))
                      .map((f, i) => (
                        <MatchCard
                          key={f.id || f.fixture?.id || i}
                          fixture={f}
                          animDelay={i * 0.04}
                        />
                      ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
