import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { supabase } from '../lib/supabaseClient'
import { CATEGORIES } from '../lib/categories'

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export default function AnalyticsPage({ session }) {
  const [weekData, setWeekData] = useState([])
  const [categoryData, setCategoryData] = useState([])
  const [stats, setStats] = useState({ totalHours: 0, totalActivities: 0, done: 0, completion: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  async function fetchAnalytics() {
    setLoading(true)

    const today = todayStr()
    const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6))
    const startDate = days[0]

    const { data: activities } = await supabase
      .from('activities')
      .select('*')
      .gte('log_date', startDate)
      .lte('log_date', today)
      .order('log_date')

    if (activities) {
      // Daily bar chart data
      const daily = days.map((date) => {
        const dayActs = activities.filter((a) => a.log_date === date)
        const hours = dayActs.reduce((sum, a) => sum + Number(a.duration_hours || 0), 0)
        const d = new Date(date + 'T00:00:00')
        const label = d.toLocaleDateString('id-ID', { weekday: 'short' }) + ' ' + d.getDate()
        return {
          date,
          label,
          hours: Number(hours.toFixed(2)),
          count: dayActs.length,
          done: dayActs.filter((a) => a.done).length,
        }
      })
      setWeekData(daily)

      // Category donut data
      const catMap = {}
      activities.forEach((a) => {
        catMap[a.category] = (catMap[a.category] || 0) + Number(a.duration_hours || 0)
      })
      const cats = Object.entries(catMap)
        .map(([cat, hours]) => ({
          name: CATEGORIES[cat]?.label || cat,
          value: Number(hours.toFixed(2)),
          color: CATEGORIES[cat]?.dot || '#5C6B85',
        }))
        .sort((a, b) => b.value - a.value)
      setCategoryData(cats)

      // Summary stats
      const totalHours = activities.reduce((sum, a) => sum + Number(a.duration_hours || 0), 0)
      const doneCount = activities.filter((a) => a.done).length
      setStats({
        totalHours: totalHours.toFixed(1),
        totalActivities: activities.length,
        done: doneCount,
        completion: activities.length ? Math.round((doneCount / activities.length) * 100) : 0,
      })
    }

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-ink-soft text-sm">
        Memuat analitik...
      </div>
    )
  }

  const totalCatHours = categoryData.reduce((s, c) => s + c.value, 0)

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-28">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-ink">Analitik</h1>
        <p className="text-sm text-ink-soft">7 hari terakhir</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div className="bg-surface-soft rounded-xl p-3">
          <p className="text-xs text-ink-soft mb-1">Total jam</p>
          <p className="text-xl font-semibold font-mono text-ink">{stats.totalHours}</p>
        </div>
        <div className="bg-surface-soft rounded-xl p-3">
          <p className="text-xs text-ink-soft mb-1">Aktivitas</p>
          <p className="text-xl font-semibold text-ink">{stats.totalActivities}</p>
        </div>
        <div className="bg-surface-soft rounded-xl p-3">
          <p className="text-xs text-ink-soft mb-1">Selesai</p>
          <p className="text-xl font-semibold text-ink">{stats.done}</p>
        </div>
        <div className="bg-surface-soft rounded-xl p-3">
          <p className="text-xs text-ink-soft mb-1">Completion</p>
          <p className="text-xl font-semibold text-ink">{stats.completion}%</p>
        </div>
      </div>

      {/* Bar chart: daily hours */}
      <section className="mb-8">
        <h2 className="text-base font-medium text-ink mb-3">Jam kerja per hari</h2>
        <div className="bg-surface border border-line rounded-xl p-4">
          {weekData.every((d) => d.hours === 0) ? (
            <p className="text-sm text-ink-muted text-center py-6">Belum ada data minggu ini.</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weekData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F4" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94A1B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A1B8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: '#F1F4FA' }}
                  contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #E2E8F4', boxShadow: 'none' }}
                  formatter={(v) => [`${v} jam`, 'Jam kerja']}
                />
                <Bar dataKey="hours" fill="#2454D9" radius={[5, 5, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* Donut: category breakdown */}
      <section className="mb-8">
        <h2 className="text-base font-medium text-ink mb-3">Breakdown kategori</h2>
        <div className="bg-surface border border-line rounded-xl p-4">
          {categoryData.length === 0 ? (
            <p className="text-sm text-ink-muted text-center py-6">Belum ada data kategori minggu ini.</p>
          ) : (
            <div className="flex flex-col items-center gap-6">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {categoryData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #E2E8F4', boxShadow: 'none' }}
                    formatter={(v) => [`${v} jam`]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-full flex flex-col gap-2.5">
                {categoryData.map((cat, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cat.color }} />
                    <span className="flex-1 text-sm text-ink">{cat.name}</span>
                    <div className="w-24 h-1.5 rounded-full bg-surface-soft overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${totalCatHours ? Math.round((cat.value / totalCatHours) * 100) : 0}%`,
                          background: cat.color,
                        }}
                      />
                    </div>
                    <span className="font-mono text-xs text-ink-soft w-12 text-right">
                      {cat.value}j · {totalCatHours ? Math.round((cat.value / totalCatHours) * 100) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Daily detail list */}
      <section>
        <h2 className="text-base font-medium text-ink mb-3">Detail per hari</h2>
        <div className="flex flex-col gap-2">
          {weekData
            .filter((d) => d.count > 0)
            .reverse()
            .map((d) => (
              <div
                key={d.date}
                className="bg-surface border border-line rounded-xl px-4 py-3 flex items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink">{d.label}</p>
                  <p className="text-xs text-ink-soft">
                    {d.count} aktivitas · {d.done} selesai
                  </p>
                </div>
                <span className="font-mono text-sm font-semibold text-ink shrink-0">{d.hours}j</span>
                <div className="w-14 shrink-0">
                  <div className="h-1.5 rounded-full bg-surface-soft overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.min(100, (d.hours / 8) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-ink-muted text-right mt-0.5">
                    {Math.round((d.hours / 8) * 100)}% target
                  </p>
                </div>
              </div>
            ))}
          {weekData.every((d) => d.count === 0) && (
            <p className="text-sm text-ink-muted text-center py-6">
              Belum ada aktivitas yang tercatat minggu ini.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
