import { useState, useEffect, useMemo } from 'react'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar, 
  LineChart, Line
} from 'recharts'
import { analyticsApi } from '../api/analyticsApi'
import { useAuth } from '../context/AuthContext'
import Spinner from '../components/Spinner'
import AlertMessage from '../components/AlertMessage'

const STATUS_COLOURS = {
  PENDING: '#F59E0B',
  IN_PROGRESS: '#3B82F6',
  RESOLVED: '#10B981',
  CLOSED: '#6366F1',
  REOPENED: '#EF4444'
}

export default function AdminAnalytics() {
  const { user, isAdmin } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dailyRange, setDailyRange] = useState(7) // 7/30/90

  useEffect(() => {
    const fetch = isAdmin ? analyticsApi.getAdmin : analyticsApi.getRegional
    setLoading(true)
    fetch()
      .then(res => setData(res.data.data))
      .catch(() => setError('Failed to aggregate district analytics.'))
      .finally(() => setLoading(false))
  }, [isAdmin])

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `district-analytics-${new Date().toISOString().split('T')[0]}.json`
    a.click()
  }

  const downloadCSV = () => {
    if (!data) return
    const headers = ['Metric', 'Value']
    const kpiRows = [
      ['Total Issues', data.totalIssues],
      ['Open Issues', data.openIssues],
      ['Closed Issues', data.closedIssues],
      ['Avg Resolution Days', data.avgResolutionDays],
      ['SLA Breaches', data.slaBreaches],
      ['This Month', data.issuesThisMonth]
    ]
    let csv = headers.join(',') + '\n'
    kpiRows.forEach(row => csv += row.join(',') + '\n')
    
    csv += '\nZone Summary\n'
    csv += 'Zone,Admin,Total,Open,Closed,Avg Days,Breaches\n'
    data.zoneStats.forEach(z => {
      csv += `${z.zone},${z.adminName},${z.total},${z.open},${z.closed},${z.avgDays},${z.breaches}\n`
    })

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `district-analytics-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-6 animate-pulse">
      <Spinner size="lg" />
      <p className="text-[11px] font-black text-light-muted dark:text-dark-muted uppercase tracking-[0.3em]">Harvesting District Data...</p>
    </div>
  )

  if (error || !data) return <div className="max-w-4xl mx-auto p-12"><AlertMessage type="error" message={error || 'System unavailable'} /></div>

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-8 py-8 lg:py-12 animate-fade">
      
      {/* ── Governance Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 pb-8 border-b border-light-border dark:border-dark-border">
         <div>
            <div className="flex items-center gap-3 text-brand-blue dark:text-blue-400 font-extrabold text-[11px] uppercase tracking-[0.25em] mb-4">
               <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
               District Intelligence Center
            </div>
            <h1 className="text-4xl lg:text-5xl font-display font-black text-light-primary dark:text-dark-primary tracking-tighter leading-none">
               {isAdmin ? 'Super Admin Monitor' : 'Regional Performance Insight'}
            </h1>
            <p className="text-light-muted dark:text-dark-muted mt-3 font-medium text-[15px] max-w-2xl leading-relaxed">
               Comprehensive audit of civic infrastructure health, SLA compliance, and resolution throughput for the {isAdmin ? 'entire district' : 'assigned zone'}.
            </p>
         </div>

         <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => window.print()} className="btn btn-secondary flex items-center gap-2 h-11 px-5 text-[11px] font-bold uppercase tracking-widest border-2">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
               Print PDF
            </button>
            <button onClick={downloadCSV} className="btn btn-secondary flex items-center gap-2 h-11 px-5 text-[11px] font-bold uppercase tracking-widest border-2">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
               CSV Export
            </button>
            <button onClick={downloadJSON} className="btn btn-secondary flex items-center gap-2 h-11 px-5 text-[11px] font-bold uppercase tracking-widest border-2 hover:bg-light-primary hover:text-white dark:hover:bg-dark-primary transition-all">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
               Raw JSON
            </button>
         </div>
      </div>

      {/* ── KPI Grid (6 Cards) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-16">
         {[
            { label: 'Total Issues',      value: data.totalIssues,      icon: '📊', color: 'brand-blue' },
            { label: 'Open Issues',       value: data.openIssues,       icon: '📁', color: 'brand-saffron' },
            { label: 'Closed Cases',      value: data.closedIssues,     icon: '✅', color: 'gov-success' },
            { label: 'Avg Resolution',    value: `${data.avgResolutionDays}d`, icon: '⏱️', color: 'gov-info' },
            { label: 'SLA Breaches',      value: data.slaBreaches,      icon: '🚨', color: 'gov-danger' },
            { label: 'New This Month',    value: data.issuesThisMonth,  icon: '📅', color: 'brand-blue' },
         ].map((kpi, i) => (
            <div key={i} className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-[2rem] p-6 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all cursor-default relative overflow-hidden group">
               <div className={`absolute top-0 right-0 w-24 h-24 bg-${kpi.color}/5 rounded-bl-[4rem] flex items-center justify-center translate-x-4 -translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform`}>
                  <span className="text-3xl opacity-20 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all">{kpi.icon}</span>
               </div>
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-light-muted dark:text-dark-muted mb-2">{kpi.label}</p>
               <h3 className="text-3xl font-display font-black text-light-primary dark:text-dark-primary tracking-tighter">{kpi.value}</h3>
               <div className={`w-12 h-1 bg-${kpi.color} mt-4 rounded-full opacity-40`} />
            </div>
         ))}
      </div>

      {/* ── Charts Matrix ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-16">
         
         {/* 1. Daily Submission vs Resolution (Area) */}
         <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-[2.5rem] p-8 shadow-sm xl:col-span-2">
            <div className="flex items-center justify-between mb-8">
               <div>
                  <h3 className="text-xl font-display font-black text-light-primary dark:text-dark-primary tracking-tight">Resolution Velocity</h3>
                  <p className="text-[11px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-widest mt-1">Daily trend of incoming vs completed filings</p>
               </div>
               <div className="flex gap-1 bg-light-bg dark:bg-dark-bg p-1 rounded-xl border border-light-border dark:border-dark-border">
                  {[7, 14].map(r => (
                     <button key={r} onClick={() => setDailyRange(r)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${dailyRange === r ? 'bg-light-surface dark:bg-dark-surface text-brand-blue shadow-sm' : 'text-light-muted hover:text-light-primary'}`}>
                        {r}D
                     </button>
                  ))}
               </div>
            </div>
            <div className="h-[350px]">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.dailyTrends.slice(-dailyRange)}>
                     <defs>
                        <linearGradient id="colorSub" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/><stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/></linearGradient>
                        <linearGradient id="colorRes" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/><stop offset="95%" stopColor="#10B981" stopOpacity={0}/></linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
                     <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#6B7280'}} dy={10} />
                     <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#6B7280'}} />
                     <Tooltip content={<CustomTooltip />} />
                     <Legend verticalAlign="top" height={36} iconType="circle" />
                     <Area type="monotone" name="Submitted" dataKey="submitted" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorSub)" />
                     <Area type="monotone" name="Resolved" dataKey="resolved" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorRes)" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* 2. Status Breakdown (Donut) */}
         <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-[2.5rem] p-8 shadow-sm">
            <h3 className="text-xl font-display font-black text-light-primary dark:text-dark-primary tracking-tight mb-1">Status Composition</h3>
            <p className="text-[11px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-widest mb-8">Registry breakdown by lifecycle stage</p>
            <div className="h-[350px]">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie data={data.statusBreakdown} innerRadius={80} outerRadius={110} paddingAngle={8} dataKey="count" nameKey="status">
                        {data.statusBreakdown.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={STATUS_COLOURS[entry.status] || '#CBD5E1'} stroke="none" />
                        ))}
                     </Pie>
                     <Tooltip content={<CustomTooltip />} />
                     <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{paddingTop: '20px', fontSize: '10px', fontWeight: 800}} />
                  </PieChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* 3. Grouped Bar: Issues by Zone */}
         <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-[2.5rem] p-8 shadow-sm">
            <h3 className="text-xl font-display font-black text-light-primary dark:text-dark-primary tracking-tight mb-1">Zonal Volume</h3>
            <p className="text-[11px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-widest mb-8">Workload distribution per municipality</p>
            <div className="h-[350px]">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.zoneStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                     <XAxis dataKey="zone" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                     <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                     <Tooltip content={<CustomTooltip />} />
                     <Bar dataKey="total" name="Total" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={12} />
                     <Bar dataKey="open" name="Open" fill="#F59E0B" radius={[4, 4, 0, 0]} barSize={12} />
                     <Bar dataKey="closed" name="Closed" fill="#10B981" radius={[4, 4, 0, 0]} barSize={12} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* 4. Top Categories (Horizontal Bar) */}
         <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-[2.5rem] p-8 shadow-sm xl:col-span-1">
            <h3 className="text-xl font-display font-black text-light-primary dark:text-dark-primary tracking-tight mb-1">Primary Pain Points</h3>
            <p className="text-[11px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-widest mb-8">Leading categories of civic distress</p>
            <div className="h-[350px]">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.topCategories} layout="vertical" margin={{ left: 40 }}>
                     <XAxis type="number" hide />
                     <YAxis dataKey="category" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: '#374151'}} />
                     <Tooltip content={<CustomTooltip />} />
                     <Bar dataKey="count" fill="#6366F1" radius={[0, 4, 4, 0]} barSize={15} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* 5. Resolution Efficiency by Zone */}
         <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-[2.5rem] p-8 shadow-sm">
            <h3 className="text-xl font-display font-black text-light-primary dark:text-dark-primary tracking-tight mb-1">Resolution TAT</h3>
            <p className="text-[11px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-widest mb-8">Average Turnaround Time (Days) per Zone</p>
            <div className="h-[350px]">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.zoneStats}>
                     <XAxis dataKey="zone" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800}} />
                     <YAxis hide domain={[0, 'dataMax + 2']} />
                     <Tooltip content={<CustomTooltip />} />
                     <Bar dataKey="avgDays" name="Avg Days">
                        {data.zoneStats.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.avgDays > 10 ? '#EF4444' : entry.avgDays > 5 ? '#F59E0B' : '#10B981'} radius={[10, 10, 0, 0]} />
                        ))}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* 6. Monthly Trend (Line) */}
         <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-[2.5rem] p-8 shadow-sm">
            <h3 className="text-xl font-display font-black text-light-primary dark:text-dark-primary tracking-tight mb-1">Growth Audit</h3>
            <p className="text-[11px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-widest mb-8">Monthly submission volume vs throughput</p>
            <div className="h-[350px]">
               <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.monthlyTrends}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                     <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800}} />
                     <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800}} />
                     <Tooltip content={<CustomTooltip />} />
                     <Legend verticalAlign="top" align="right" />
                     <Line type="monotone" name="Submitted" dataKey="submitted" stroke="#3B82F6" strokeWidth={4} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 8}} />
                     <Line type="monotone" name="Resolved" dataKey="resolved" stroke="#10B981" strokeWidth={4} strokeDasharray="4 4" dot={{r: 4}} />
                  </LineChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>

      {/* ── Zone Summary Table ── */}
      <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-[2.5rem] overflow-hidden shadow-lg animate-fade">
         <div className="p-8 lg:p-10 border-b border-light-border dark:border-dark-border flex items-center justify-between bg-light-bg/20 dark:bg-dark-bg/20">
            <div>
               <h3 className="text-2xl font-display font-black text-light-primary dark:text-dark-primary tracking-tight">Municipal Audit Registry</h3>
               <p className="text-[11px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-widest mt-1">Detailed performance audit per district zone</p>
            </div>
            <div className="flex items-center gap-2 bg-gov-danger/10 text-gov-danger px-4 py-2 rounded-xl border border-gov-danger/20 text-[11px] font-black uppercase tracking-widest">
               <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
               Critical Breaches: {data.slaBreaches}
            </div>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-light-bg/40 dark:bg-dark-bg/40">
                     <th className="p-6 text-[11px] font-black uppercase tracking-[0.2em] text-light-muted">Territory</th>
                     <th className="p-6 text-[11px] font-black uppercase tracking-[0.2em] text-light-muted">Officer-In-Charge</th>
                     <th className="p-6 text-[11px] font-black uppercase tracking-[0.2em] text-light-muted text-center">Total Cases</th>
                     <th className="p-6 text-[11px] font-black uppercase tracking-[0.2em] text-light-muted text-center">Active (Open)</th>
                     <th className="p-6 text-[11px] font-black uppercase tracking-[0.2em] text-light-muted text-center">Fulfilled</th>
                     <th className="p-6 text-[11px] font-black uppercase tracking-[0.2em] text-light-muted text-center">Resolution TAT</th>
                     <th className="p-6 text-[11px] font-black uppercase tracking-[0.2em] text-light-muted text-center">SLA Breaches</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-light-border dark:divide-dark-border text-[14px] font-bold">
                  {data.zoneStats.map((z, i) => (
                     <tr key={i} className="hover:bg-light-bg/20 dark:hover:bg-dark-bg/20 transition-colors">
                        <td className="p-6">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-brand-blue/10 text-brand-blue flex items-center justify-center text-[10px] font-black uppercase">{z.zone.charAt(0)}</div>
                              <span className="text-light-primary dark:text-dark-primary">{z.zone}</span>
                           </div>
                        </td>
                        <td className="p-6 text-light-muted dark:text-dark-muted">{z.adminName}</td>
                        <td className="p-6 text-center">{z.total}</td>
                        <td className="p-6 text-center text-brand-saffron">{z.open}</td>
                        <td className="p-6 text-center text-gov-success">{z.closed}</td>
                        <td className="p-6 text-center">
                           <span className={`px-3 py-1 rounded-full text-[12px] ${z.avgDays > 10 ? 'bg-gov-danger/10 text-gov-danger' : 'bg-gov-success/10 text-gov-success'}`}>
                              {z.avgDays} days
                           </span>
                        </td>
                        <td className="p-6 text-center">
                           <span className={`font-mono ${z.breaches > 0 ? 'text-gov-danger animate-pulse' : 'text-light-muted opacity-40'}`}>
                              {z.breaches}
                           </span>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  )
}

function CustomTooltip({ active, payload, label }) {
   if (active && payload && payload.length) {
      return (
         <div className="bg-white dark:bg-[#1a1a1a] p-4 border border-light-border dark:border-dark-border rounded-2xl shadow-2xl backdrop-blur-md">
            <p className="text-[10px] font-black text-light-muted uppercase tracking-widest mb-3 border-b pb-2">{label}</p>
            <div className="space-y-2">
               {payload.map((p, i) => (
                  <div key={i} className="flex items-center justify-between gap-6">
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
                        <span className="text-[12px] font-bold text-light-primary dark:text-dark-primary">{p.name}</span>
                     </div>
                     <span className="text-[12px] font-black text-brand-blue">{p.value}</span>
                  </div>
               ))}
            </div>
         </div>
      )
   }
   return null
}
