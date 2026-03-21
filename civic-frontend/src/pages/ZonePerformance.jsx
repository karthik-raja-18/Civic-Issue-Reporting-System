import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../api/axiosConfig'

const ZONE_COLORS = {
  NORTH:   { bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   text: 'text-blue-500',   bar: '#3B82F6' },
  SOUTH:   { bg: 'bg-amber-500/10',  border: 'border-amber-500/30',  text: 'text-amber-500',  bar: '#F59E0B' },
  EAST:    { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-500', bar: '#8B5CF6' },
  WEST:    { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-500', bar: '#F97316' },
  CENTRAL: { bg: 'bg-teal-500/10',   border: 'border-teal-500/30',   text: 'text-teal-500',   bar: '#14B8A6' },
}

const SLA_DAYS = 7 // breach threshold

function getPerformanceLabel(avgDays, t) {
  if (avgDays === null) return { label: '—', color: 'text-[#8B949E]', bg: 'bg-[#8B949E]/10' }
  if (avgDays <= 3)  return { label: t('zonePerformance.excellent'), color: 'text-[#2D7A3A]', bg: 'bg-[#2D7A3A]/10' }
  if (avgDays <= 5)  return { label: t('zonePerformance.good'),      color: 'text-[#2980B9]', bg: 'bg-[#2980B9]/10' }
  if (avgDays <= 7)  return { label: t('zonePerformance.warning'),   color: 'text-[#D97706]', bg: 'bg-[#D97706]/10' }
  return               { label: t('zonePerformance.critical'),  color: 'text-[#C0392B]', bg: 'bg-[#C0392B]/10' }
}

export default function ZonePerformance() {
  const { t }           = useTranslation()
  const [data,  setData]  = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,  setError]  = useState(null)
  const [selectedZone, setSelectedZone] = useState('ALL')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/api/admin/zone-performance')
      setData(res.data.data)
    } catch {
      setError('Failed to load zone performance data.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#D0D7DE] dark:border-[#30363D]
                        border-t-[#1B3A6B] animate-spin" />
        <p className="text-[#57606A] dark:text-[#8B949E] text-sm">Loading zone data…</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="rounded-lg border border-red-200 dark:border-red-900/50
                      bg-red-50 dark:bg-red-900/10 p-6 text-center">
        <p className="text-red-600 dark:text-red-400 text-sm mb-3">{error}</p>
        <button onClick={fetchData}
          className="text-sm font-medium text-[#1B3A6B] dark:text-[#4A90D9] hover:underline">
          {t('common.retry')}
        </button>
      </div>
    </div>
  )

  const zones       = data?.zones || []
  const slaBreaches = data?.slaBreaches || []
  const totals      = data?.totals || {}

  const filteredZones = selectedZone === 'ALL'
    ? zones
    : zones.filter(z => z.zone === selectedZone)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-[#1B3A6B]/10 dark:bg-[#1B3A6B]/20
                          flex items-center justify-center">
            <ChartIcon className="w-4 h-4 text-[#1B3A6B] dark:text-[#4A90D9]" />
          </div>
          <h1 className="text-2xl font-display font-bold text-[#1C2526] dark:text-[#E6EDF3]">
            {t('zonePerformance.title')}
          </h1>
        </div>
        <p className="text-[#57606A] dark:text-[#8B949E] text-sm">
          {t('zonePerformance.subtitle')}
        </p>
      </div>

      {/* ── SLA Breach Alerts ── */}
      {slaBreaches.length > 0 ? (
        <div className="mb-6 rounded-lg border border-red-200 dark:border-red-900/50
                        bg-red-50 dark:bg-red-900/10 overflow-hidden">
          <div className="px-4 py-3 border-b border-red-200 dark:border-red-900/50
                          flex items-center gap-2">
            <AlertIcon className="w-4 h-4 text-[#C0392B]" />
            <span className="text-[#C0392B] font-semibold text-sm">
              {t('zonePerformance.slaBreachAlert')} — {slaBreaches.length} {t('zonePerformance.slaBreachDesc')}
            </span>
          </div>
          <div className="divide-y divide-red-100 dark:divide-red-900/30">
            {slaBreaches.slice(0, 5).map((breach) => (
              <div key={breach.issueId}
                className="px-4 py-3 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-[#1C2526] dark:text-[#E6EDF3] text-sm font-medium truncate">
                    #{breach.issueId} — {breach.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs font-mono font-bold ${ZONE_COLORS[breach.zone]?.text || 'text-[#8B949E]'}`}>
                      {breach.zone}
                    </span>
                    <span className="text-[#8C959F] text-xs">·</span>
                    <span className="text-[#57606A] dark:text-[#8B949E] text-xs">{breach.category}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-[#C0392B] font-bold text-sm">{breach.daysPending}d</p>
                    <p className="text-[#8C959F] text-xs">pending</p>
                  </div>
                  <a href={`/issues/${breach.issueId}`}
                    className="text-xs text-[#1B3A6B] dark:text-[#4A90D9] font-medium
                               hover:underline transition-colors">
                    View →
                  </a>
                </div>
              </div>
            ))}
            {slaBreaches.length > 5 && (
              <div className="px-4 py-2 text-xs text-[#57606A] dark:text-[#8B949E]">
                +{slaBreaches.length - 5} more SLA breaches
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mb-6 rounded-lg border border-[#2D7A3A]/30 bg-[#2D7A3A]/5
                        px-4 py-3 flex items-center gap-2">
          <span className="text-[#2D7A3A]">✅</span>
          <p className="text-[#2D7A3A] text-sm font-medium">{t('zonePerformance.noBreaches')}</p>
        </div>
      )}

      {/* ── Overall KPI Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: t('admin.totalIssues'),   value: totals.total || 0,       icon: '📋', color: 'text-[#1B3A6B] dark:text-[#4A90D9]' },
          { label: t('admin.openIssues'),    value: totals.open || 0,        icon: '🔓', color: 'text-[#D97706]' },
          { label: t('admin.resolvedMonth'), value: totals.resolvedMonth || 0, icon: '✅', color: 'text-[#2D7A3A]' },
          { label: t('admin.avgDays'),       value: totals.avgResolutionDays
              ? `${totals.avgResolutionDays}d`
              : '—',                                                           icon: '⏱', color: 'text-[#7C3AED]' },
        ].map(({ label, value, icon, color }) => (
          <div key={label}
            className="bg-white dark:bg-[#161B22] border border-[#D0D7DE] dark:border-[#30363D]
                       rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#8C959F] text-xs font-medium uppercase tracking-wide">{label}</span>
              <span className="text-lg">{icon}</span>
            </div>
            <p className={`text-2xl font-display font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Zone filter tabs ── */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {['ALL', 'NORTH', 'SOUTH', 'EAST', 'WEST', 'CENTRAL'].map(zone => (
          <button
            key={zone}
            onClick={() => setSelectedZone(zone)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all border ${
              selectedZone === zone
                ? 'bg-[#1B3A6B] text-white border-[#1B3A6B]'
                : 'bg-transparent border-[#D0D7DE] dark:border-[#30363D] text-[#57606A] dark:text-[#8B949E] hover:border-[#1B3A6B] dark:hover:border-[#4A90D9]'
            }`}
          >
            {zone === 'ALL' ? t('common.all') : t(`zones.${zone}`)}
          </button>
        ))}
      </div>

      {/* ── Zone Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
        {filteredZones.map((zone) => {
          const colors  = ZONE_COLORS[zone.zone] || {}
          const perf    = getPerformanceLabel(zone.avgResolutionDays, t)
          const breachCount = slaBreaches.filter(b => b.zone === zone.zone).length
          const totalForBar = Math.max(zone.total, 1)

          return (
            <div key={zone.zone}
              className={`bg-white dark:bg-[#161B22] border ${colors.border || 'border-[#D0D7DE] dark:border-[#30363D]'}
                          rounded-lg overflow-hidden`}>

              {/* Zone header */}
              <div className={`px-4 py-3 ${colors.bg} border-b ${colors.border}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-display font-bold text-base ${colors.text}`}>
                      {t(`zones.${zone.zone}`)}
                    </p>
                    {zone.adminName && (
                      <p className="text-[#57606A] dark:text-[#8B949E] text-xs mt-0.5">
                        {t('zonePerformance.zoneAdmin')}: {zone.adminName}
                      </p>
                    )}
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-md ${perf.bg} ${perf.color}`}>
                    {perf.label}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="px-4 py-4 space-y-3">

                {/* SLA breach warning */}
                {breachCount > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-md
                                  bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30">
                    <AlertIcon className="w-3.5 h-3.5 text-[#C0392B] flex-shrink-0" />
                    <p className="text-[#C0392B] text-xs font-medium">
                      {breachCount} SLA breach{breachCount > 1 ? 'es' : ''}
                    </p>
                  </div>
                )}

                {/* Metrics grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: t('zonePerformance.openIssues'),       value: zone.open,               color: 'text-[#D97706]' },
                    { label: t('zonePerformance.resolvedThisMonth'), value: zone.resolvedMonth,      color: 'text-[#2D7A3A]' },
                    { label: t('zonePerformance.avgResolution'),     value: zone.avgResolutionDays
                        ? `${zone.avgResolutionDays}d`
                        : '—',                                                                       color: 'text-[#7C3AED]' },
                    { label: t('zonePerformance.slaBreaches'),       value: breachCount,             color: breachCount > 0 ? 'text-[#C0392B]' : 'text-[#2D7A3A]' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-[#F5F7FA] dark:bg-[#0D1117] rounded-md p-2.5">
                      <p className="text-[#8C959F] text-xs mb-1">{label}</p>
                      <p className={`font-display font-bold text-lg ${color}`}>{value ?? 0}</p>
                    </div>
                  ))}
                </div>

                {/* Status bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-[#8C959F]">
                    <span>Issue breakdown</span>
                    <span>{zone.total} total</span>
                  </div>
                  <div className="flex h-2 rounded-full overflow-hidden bg-[#F5F7FA] dark:bg-[#0D1117] gap-0.5">
                    {[
                      { val: zone.pending,    color: '#F59E0B' },
                      { val: zone.inProgress, color: '#1B3A6B' },
                      { val: zone.resolved,   color: '#7C3AED' },
                      { val: zone.closed,     color: '#2D7A3A' },
                    ].map(({ val, color }, i) => (
                      <div key={i}
                        style={{ width: `${(val / totalForBar) * 100}%`, background: color }}
                        className="h-full first:rounded-l-full last:rounded-r-full transition-all" />
                    ))}
                  </div>
                  <div className="flex gap-3 text-xs text-[#8C959F] flex-wrap">
                    {[
                      { label: 'Pending',     val: zone.pending,    color: '#F59E0B' },
                      { label: 'In Progress', val: zone.inProgress, color: '#1B3A6B' },
                      { label: 'Resolved',    val: zone.resolved,   color: '#7C3AED' },
                      { label: 'Closed',      val: zone.closed,     color: '#2D7A3A' },
                    ].map(({ label, val, color }) => (
                      <div key={label} className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                        <span>{label} ({val})</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Avg resolution meter */}
                {zone.avgResolutionDays !== null && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#8C959F]">Avg resolution time</span>
                      <span className={perf.color + ' font-semibold'}>{zone.avgResolutionDays} days</span>
                    </div>
                    <div className="h-1.5 bg-[#F5F7FA] dark:bg-[#0D1117] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min((zone.avgResolutionDays / 14) * 100, 100)}%`,
                          background: zone.avgResolutionDays <= 3 ? '#2D7A3A'
                                    : zone.avgResolutionDays <= 5 ? '#2980B9'
                                    : zone.avgResolutionDays <= 7 ? '#D97706'
                                    : '#C0392B'
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-[#8C959F]">
                      <span>0d</span>
                      <span className="text-[#2D7A3A]">SLA: 7d</span>
                      <span>14d</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Top Categories breakdown ── */}
      {data?.topCategories && (
        <div className="bg-white dark:bg-[#161B22] border border-[#D0D7DE] dark:border-[#30363D]
                        rounded-lg p-6 mb-6">
          <h2 className="font-display font-bold text-[#1C2526] dark:text-[#E6EDF3] text-base mb-4">
            {t('zonePerformance.topCategories')}
          </h2>
          <div className="space-y-3">
            {data.topCategories.slice(0, 8).map(({ category, count, total }) => (
              <div key={category} className="flex items-center gap-3">
                <span className="text-[#57606A] dark:text-[#8B949E] text-sm w-32 flex-shrink-0 truncate">
                  {t(`categories.${category}`, category)}
                </span>
                <div className="flex-1 h-2 bg-[#F5F7FA] dark:bg-[#0D1117] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#1B3A6B] transition-all"
                    style={{ width: `${(count / (data.topCategories[0]?.count || 1)) * 100}%` }}
                  />
                </div>
                <span className="text-[#57606A] dark:text-[#8B949E] text-sm w-8 text-right flex-shrink-0">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Refresh button */}
      <div className="text-center">
        <button onClick={fetchData}
          className="inline-flex items-center gap-2 text-sm text-[#57606A] dark:text-[#8B949E]
                     hover:text-[#1C2526] dark:hover:text-[#E6EDF3] transition-colors">
          <RefreshIcon className="w-4 h-4" />
          Refresh data
        </button>
      </div>
    </div>
  )
}

// ── Icons ──
const ChartIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
)
const AlertIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)
const RefreshIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
  </svg>
)
