import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useGroups } from '../hooks/index'
import { LoadingSpinner, ErrorState } from '../components/common/index'
import { FLAG_URL, COUNTRY_CODES } from '../config/constants'

function QualDot({ rank }) {
  if (rank <= 2) return <span className="w-1.5 h-1.5 rounded-full bg-teal flex-shrink-0" />
  if (rank === 3) return <span className="w-1.5 h-1.5 rounded-full bg-amber flex-shrink-0" />
  return <span className="w-1.5 h-1.5 rounded-full bg-border flex-shrink-0" />
}

function GroupTable({ group, delay = 0 }) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  // worldcup26.ir: { name, teams: [{team:{name,id}, played, w, d, l, gf, ga, gd, points}] }
  const letter = group.name || group.group || group.id || '?'
  const rows = group.teams || group.standings || group.table || []

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="bg-surface border border-border rounded-xl overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-2.5 bg-surface2 border-b border-border">
        <span className="text-xs font-bold text-teal tracking-widest uppercase">
          {t('common.group')} {letter}
        </span>
        <div className="flex gap-3 text-[10px] text-muted font-medium">
          <span className="w-4 text-center">{t('groups.played')}</span>
          <span className="w-4 text-center">{t('groups.won')}</span>
          <span className="w-4 text-center">{t('groups.drawn')}</span>
          <span className="w-4 text-center">{t('groups.lost')}</span>
          <span className="w-6 text-center">{t('groups.gd')}</span>
          <span className="w-6 text-center font-bold">{t('groups.points')}</span>
        </div>
      </div>

      {rows.map((entry, i) => {
        const name = entry.team?.name || entry.name || entry.team || '?'
        const cc = COUNTRY_CODES[name]
        const played = entry.played ?? entry.all?.played ?? 0
        const won = entry.w ?? entry.won ?? entry.all?.win ?? 0
        const drawn = entry.d ?? entry.drawn ?? entry.all?.draw ?? 0
        const lost = entry.l ?? entry.lost ?? entry.all?.lose ?? 0
        const gd = entry.gd ?? entry.goalsDiff ?? (entry.gf - entry.ga) ?? 0
        const pts = entry.points ?? entry.pts ?? 0
        const teamId = entry.team?.id || entry.id

        return (
          <button
            key={i}
            onClick={() => teamId && navigate(`/team/${teamId}`)}
            className="w-full flex items-center gap-2 px-4 py-2.5 border-b border-border/50 last:border-0 hover:bg-surface2 transition-colors text-sm"
          >
            <QualDot rank={i + 1} />
            <span className="w-4 text-[11px] text-muted text-center">{i + 1}</span>
            {cc && <img src={FLAG_URL(cc)} alt={name} className="w-6 h-4 object-cover rounded-sm flex-shrink-0" loading="lazy" />}
            <span className="flex-1 text-start text-xs font-medium truncate">{name}</span>
            <div className="flex gap-3 text-[11px] text-muted">
              <span className="w-4 text-center">{played}</span>
              <span className="w-4 text-center">{won}</span>
              <span className="w-4 text-center">{drawn}</span>
              <span className="w-4 text-center">{lost}</span>
              <span className="w-6 text-center">{gd >= 0 ? '+' : ''}{gd}</span>
              <span className="w-6 text-center font-bold text-text">{pts}</span>
            </div>
          </button>
        )
      })}
    </motion.div>
  )
}

export default function GroupsPage() {
  const { t } = useTranslation()
  const { groups, isLoading, isError, refetch } = useGroups()
  const [activeIdx, setActiveIdx] = useState(0)

  if (isLoading) return <LoadingSpinner size="lg" />
  if (isError) return <ErrorState onRetry={refetch} />

  const activeGroup = groups[activeIdx]

  return (
    <div className="pb-24">
      <div className="px-4 pt-4 mb-4">
        <h1 className="text-lg font-bold text-teal">{t('groups.title')}</h1>
      </div>

      {/* Group selector */}
      <div className="flex gap-1.5 px-4 mb-4 overflow-x-auto pb-1">
        {groups.map((g, i) => {
          const letter = g.name || g.group || g.id || String.fromCharCode(65 + i)
          return (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={`flex-shrink-0 w-9 h-9 rounded-lg text-sm font-bold transition-all ${
                activeIdx === i
                  ? 'bg-teal/20 text-teal border border-teal/50'
                  : 'bg-surface text-muted border border-border hover:border-teal/20'
              }`}
            >
              {letter}
            </button>
          )
        })}
      </div>

      <div className="px-4">
        {activeGroup && <GroupTable group={activeGroup} />}
      </div>

      <div className="flex gap-4 px-5 mt-4 text-[11px] text-muted">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-teal" /> {t('groups.qualified')}</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber" /> Best 3rd</span>
      </div>
    </div>
  )
}
