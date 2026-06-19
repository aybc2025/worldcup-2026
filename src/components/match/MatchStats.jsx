import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'

function StatBar({ label, home, away }) {
  const homeVal = parseInt(home) || 0
  const awayVal = parseInt(away) || 0
  const total = homeVal + awayVal || 1
  const homePct = Math.round((homeVal / total) * 100)
  const awayPct = 100 - homePct

  return (
    <div className="py-4">
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-base font-bold text-text w-10">{home ?? '0'}</span>
        <span className="text-xs text-muted tracking-wide uppercase text-center flex-1">{label}</span>
        <span className="text-base font-bold text-text w-10 text-end">{away ?? '0'}</span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden bg-border gap-px">
        <motion.div
          className="bg-teal rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${homePct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
        <motion.div
          className="bg-pitch rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${awayPct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
        />
      </div>
    </div>
  )
}

const STAT_KEYS = [
  { api: 'Ball Possession', i18nKey: 'match.possession' },
  { api: 'Total Shots',     i18nKey: 'match.shots' },
  { api: 'Shots on Goal',   i18nKey: 'match.shotsOnTarget' },
  { api: 'Corner Kicks',    i18nKey: 'match.corners' },
  { api: 'Fouls',           i18nKey: 'match.fouls' },
  { api: 'Yellow Cards',    i18nKey: 'match.yellowCards' },
  { api: 'Red Cards',       i18nKey: 'match.redCards' },
]

export function MatchStats({ stats }) {
  const { t } = useTranslation()
  const [home, away] = stats ?? []
  if (!home || !away) return null

  const homeMap = Object.fromEntries(
    (home.statistics ?? []).map((s) => [s.type, s.value])
  )
  const awayMap = Object.fromEntries(
    (away.statistics ?? []).map((s) => [s.type, s.value])
  )

  return (
    <div className="divide-y divide-border">
      {STAT_KEYS.map(({ api, i18nKey }) => (
        <StatBar
          key={api}
          label={t(i18nKey)}
          home={homeMap[api]}
          away={awayMap[api]}
        />
      ))}
    </div>
  )
}
