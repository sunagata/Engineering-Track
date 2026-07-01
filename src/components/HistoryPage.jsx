import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { CATEGORIES } from '../lib/categories'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default function HistoryPage({ session }) {
  const yesterday = addDays(todayStr(), -1)
  const [selectedDate, setSelectedDate] = useState(yesterday)
  const [activities, setActivities] = useState([])
  const [reflection, setReflection] = useState(null)
  const [targets, setTargets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDay(selectedDate)
  }, [selectedDate])

  async function fetchDay(date) {
    setLoading(true)
    const [activitiesRes, reflectionRes, targetsRes] = await Promise.all([
      supabase.from('activities').select('*').eq('log_date', date).order('start_time'),
      supabase.from('daily_reflections').select('*').eq('log_date', date).maybeSingle(),
      supabase.from('targets').select('*').eq('target_date', date).order('created_at'),
    ])
    setActivities(activitiesRes.data || [])
    setReflection(reflectionRes.data || null)
    setTargets(targetsRes.data || [])
    setLoading(false)
  }

  function goPrev() { setSelectedDate((d) => addDays(d, -1)) }
  function goNext() {
    const next = addDays(selectedDate, 1)
    if (next < todayStr()) setSelectedDate(next)
  }

  const totalHours = activities.reduce((sum, a) => sum + Number(a.duration_hours || 0), 0)
  const done = activities.filter((a) => a.done).length
  const hasData = activities.length > 0 || reflection

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-28">
      {/* Date navigation */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <button
          onClick={goPrev}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-line text-ink-soft hover:text-ink text-xl leading-none"
        >
          ‹
        </button>
        <div className="flex-1 text-center">
          <p className="text-sm font-medium text-ink">{formatDate(selectedDate)}</p>
          <input
            type="date"
            value={selectedDate}
            max={yesterday}
            onChange={(e) => {
              if (e.target.value && e.target.value < todayStr()) setSelectedDate(e.target.value)
            }}
            className="text-xs text-primary mt-0.5 bg-transparent border-none cursor-pointer"
          />
        </div>
        <button
          onClick={goNext}
          disabled={addDays(selectedDate, 1) >= todayStr()}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-line text-ink-soft hover:text-ink text-xl leading-none disabled:opacity-30"
        >
          ›
        </button>
      </div>

      {loading ? (
        <p className="text-center text-ink-soft text-sm py-12">Memuat data...</p>
      ) : !hasData ? (
        <div className="text-center py-16">
          <p className="text-3xl mb-3">📭</p>
          <p className="text-ink-soft text-sm">Tidak ada data untuk tanggal ini.</p>
          <p className="text-ink-muted text-xs mt-1">Coba pilih tanggal lain di atas.</p>
        </div>
      ) : (
        <>
          {/* Summary strip */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-surface-soft rounded-xl p-3">
              <p className="text-xs text-ink-soft mb-1">Aktivitas</p>
              <p className="text-xl font-semibold text-ink">{activities.length}</p>
            </div>
            <div className="bg-surface-soft rounded-xl p-3">
              <p className="text-xs text-ink-soft mb-1">Selesai</p>
              <p className="text-xl font-semibold text-ink">{done}</p>
            </div>
            <div className="bg-surface-soft rounded-xl p-3">
              <p className="text-xs text-ink-soft mb-1">Total jam</p>
              <p className="text-xl font-semibold font-mono text-ink">{totalHours.toFixed(1)}</p>
            </div>
          </div>

          {/* Activities */}
          {activities.length > 0 && (
            <section className="mb-6">
              <h2 className="text-base font-medium text-ink mb-3">Aktivitas</h2>
              <div className="bg-surface border border-line rounded-xl divide-y divide-line">
                {activities.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span
                      className={`block w-4 h-4 rounded-full border-2 shrink-0 ${
                        a.done ? 'bg-success border-success' : 'border-line'
                      }`}
                    />
                    {a.start_time && (
                      <span className="font-mono text-xs text-ink-muted w-16 shrink-0">
                        {a.start_time.slice(0, 5)}
                      </span>
                    )}
                    <span className="flex-1 text-sm text-ink">{a.title}</span>
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: CATEGORIES[a.category]?.dot || '#5C6B85' }}
                    />
                    <span className="font-mono text-xs text-ink-soft w-10 text-right shrink-0">
                      {a.duration_hours}j
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Targets for that day */}
          {targets.length > 0 && (
            <section className="mb-6">
              <h2 className="text-base font-medium text-ink mb-3">Target hari ini</h2>
              <div className="bg-surface border border-line rounded-xl divide-y divide-line">
                {targets.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span
                      className={`block w-4 h-4 rounded border-2 shrink-0 ${
                        t.done ? 'bg-primary border-primary' : 'border-line'
                      }`}
                    />
                    <span className="flex-1 text-sm text-ink">{t.title}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Reflection */}
          {reflection && (
            <>
              {reflection.achievements?.length > 0 && (
                <section className="mb-4">
                  <h2 className="text-base font-medium text-ink mb-3">Pencapaian</h2>
                  <div className="bg-success-soft border border-success/20 rounded-xl p-4 flex flex-col gap-1.5">
                    {reflection.achievements.map((item, i) => (
                      <p key={i} className="text-sm text-ink">{item}</p>
                    ))}
                  </div>
                </section>
              )}
              {reflection.obstacles?.length > 0 && (
                <section className="mb-4">
                  <h2 className="text-base font-medium text-ink mb-3">Kendala</h2>
                  <div className="bg-danger-soft border border-danger/20 rounded-xl p-4 flex flex-col gap-1.5">
                    {reflection.obstacles.map((item, i) => (
                      <p key={i} className="text-sm text-ink">{item}</p>
                    ))}
                  </div>
                </section>
              )}
              {reflection.personal_notes && (
                <section className="mb-4">
                  <h2 className="text-base font-medium text-ink mb-3">Catatan pribadi</h2>
                  <div className="bg-warning-soft border border-warning/20 rounded-xl p-4">
                    <p className="text-sm text-ink whitespace-pre-line">{reflection.personal_notes}</p>
                  </div>
                </section>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
