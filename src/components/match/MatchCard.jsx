import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { FLAG_URL, COUNTRY_CODES } from '../../config/constants'

const LIVE_STATUSES     = new Set(['1H', 'HT', '2H', 'ET', 'P', 'BT', 'LIVE'])
const FINISHED_STATUSES = new Set(['FT', 'AET', 'PEN', 'FT_PEN', 'AWD', 'WO'])

function normalise(fixture) {
  if (fixture.fixture && fixture.teams) {
    return {
      id:        fixture.fixture.id,
      date:      fixture.fixture.date,
      status:    fixture.fixture.status?.short,
      elapsed:   fixture.fixture.status?.elapsed,
      homeName:  fixture.teams.home?.name,
      awayName:  fixture.teams.away?.name,
      homeGoals: fixture.goals?.home,
      awayGoals: fixture.goals?.away,
      round:     fixture.league?.round,
    }
  }
  return {
    id:        fixture.id,
    date:      fixture.kickoff_utc || fixture.date,
    status:    fixture.status || fixture.phase,
    elapsed:   fixture.minute,
    homeName:  fixture.home_team?.name || fixture.home_team,
    awayName:  fixture.away_team?.name || fixture.away_team,
    homeGoals: fixture.home_score ?? fixture.score_home ?? null,
    awayGoals: fixture.away_score ?? fixture.score_away ?? null,
    round:     fixture.round || fixture.stage || fixture.group_name,
  }
}

function TeamFlag({ name }) {
  const cc = COUNTRY_CODES[name]
  if (!cc) return <span className="w-9 h-6 inline-block" />
  return (
    <img
      src={FLAG_URL(cc)}
      alt={name}
      loading="lazy"
      className="w-10 h-7 object-cover rounded flex-shrink-0"
    />
  )
}

export function LiveScoreBadge({ elapsed, status }) {
  const label = status === 'HT' ? 'HT' : status === 'ET' ? 'ET' : elapsed ? `${elapsed}'` : '●'
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-red bg-red/10 border border-red/30 rounded-full px-2 py-0.5 font-medium">
      <span className="w-1.5 h-1.5 rounded-full bg-red animate-pulse-dot" />
      {label}
    </span>
  )
}

export function MatchCard({ fixture, animDelay = 0 }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  if (!fixture) return null

  const m = normalise(fixture)
  const isLive     = LIVE_STATUSES.has(m.status)
  const isFinished = FINISHED_STATUSES.has(m.status)
  const isPending  = !isLive && !isFinished

  const kickoff = m.date ? new Date(m.date) : null
  const timeStr = kickoff?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) ?? ''

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animDelay, duration: 0.25 }}
      onClick={() => navigate(`/match/${m.id}`)}
      className={`w-full text-start bg-surface rounded-xl border transition-all duration-200 hover:border-teal/40 active:scale-[0.99] ${
        isLive ? 'border-teal/30 shadow-[0_0_16px_rgba(0,206,201,0.08)]' : 'border-border'
      }`}
    >
      {/* Round label */}
      {m.round && (
        <div className="px-4 pt-3 pb-0 text-[11px] text-muted">{m.round}</div>
      )}

      {/* Main row: [flag name] [score] [name flag] */}
      <div className="grid px-4 py-3.5" style={{ gridTemplateColumns: '1fr auto 1fr', gap: '10px', alignItems: 'center' }}>

        {/* Home */}
        <div className="flex items-center gap-2.5 min-w-0">
          <TeamFlag name={m.homeName} />
          <span className="text-base font-semibold leading-tight line-clamp-2">{m.homeName}</span>
        </div>

        {/* Score / time */}
        <div className="flex flex-col items-center gap-1 px-2">
          {(isLive || isFinished) ? (
            <>
              <div className="flex items-center gap-2">
                <span className={`font-display text-3xl font-bold leading-none ${isLive ? 'text-teal' : 'text-text'}`}>
                  {m.homeGoals ?? 0}
                </span>
                <span className="text-muted text-xl">–</span>
                <span className={`font-display text-3xl font-bold leading-none ${isLive ? 'text-teal' : 'text-text'}`}>
                  {m.awayGoals ?? 0}
                </span>
              </div>
              {isLive
                ? <LiveScoreBadge elapsed={m.elapsed} status={m.status} />
                : <span className="text-[11px] text-muted">{t('match.fulltime')}</span>
              }
            </>
          ) : (
            <>
              <span className="font-display text-lg font-semibold text-teal whitespace-nowrap">{timeStr}</span>
              <span className="text-[11px] text-muted">{t('common.vs')}</span>
            </>
          )}
        </div>

        {/* Away */}
        <div className="flex items-center gap-2.5 justify-end min-w-0">
          <span className="text-base font-semibold leading-tight line-clamp-2 text-end">{m.awayName}</span>
          <TeamFlag name={m.awayName} />
        </div>

      </div>
    </motion.button>
  )
}
