import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'

const EVENT_ICONS = {
  Goal: '⚽',
  'Own Goal': '🥅',
  Penalty: '🎯',
  'Missed Penalty': '❌',
  Card: null,
  subst: '🔄',
}

function CardIcon({ detail }) {
  if (detail?.includes('Yellow')) return <span className="text-amber text-xl">🟨</span>
  if (detail?.includes('Red'))    return <span className="text-red text-xl">🟥</span>
  return <span>📋</span>
}

function EventRow({ event, isHome, index }) {
  const { t } = useTranslation()
  const { time, team, player, assist, type, detail } = event

  const icon = type === 'Card'
    ? <CardIcon detail={detail} />
    : <span className="text-xl">{EVENT_ICONS[type] ?? EVENT_ICONS[detail] ?? '•'}</span>

  const label = type === 'subst'
    ? `${player?.name} → ${assist?.name}`
    : player?.name

  const sublabel = type === 'Goal' && detail === 'Penalty'
    ? `(${t('match.penalty')})`
    : type === 'Goal' && detail === 'Own Goal'
    ? `(${t('match.ownGoal')})`
    : type === 'subst' ? null
    : assist?.name ? `↳ ${assist.name}`
    : null

  return (
    <motion.div
      initial={{ opacity: 0, x: isHome ? -10 : 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`flex items-center gap-3 py-4 ${isHome ? 'flex-row' : 'flex-row-reverse'}`}
    >
      <span className="text-sm text-muted min-w-[36px] text-center font-mono font-medium">
        {time?.elapsed}'
      </span>

      <div className="flex-shrink-0">{icon}</div>

      <div className={`flex flex-col ${isHome ? 'text-start' : 'text-end'} flex-1 min-w-0`}>
        <span className="text-base font-semibold leading-tight">{label}</span>
        {sublabel && <span className="text-sm text-muted mt-0.5">{sublabel}</span>}
      </div>
    </motion.div>
  )
}

export function MatchTimeline({ events, homeTeamId }) {
  const { t } = useTranslation()

  if (!events?.length) {
    return <p className="text-center text-muted text-base py-12">{t('match.noEvents')}</p>
  }

  return (
    <div className="divide-y divide-border">
      {events.map((ev, i) => (
        <EventRow
          key={i}
          event={ev}
          isHome={ev.team?.id === homeTeamId}
          index={i}
        />
      ))}
    </div>
  )
}
