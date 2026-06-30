import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { CATEGORIES, PRIORITY_STYLES, STATUS_STYLES, todayISO } from '../lib/categories'

const today = todayISO()
const tomorrow = todayISO(1)

export default function Dashboard({ session }) {
  const userId = session.user.id

  const [projects, setProjects] = useState([])
  const [activities, setActivities] = useState([])
  const [targets, setTargets] = useState([])
  const [reflection, setReflection] = useState({ mood: '', achievements: [], obstacles: [], personal_notes: '' })
  const [loading, setLoading] = useState(true)

  const [showActivityForm, setShowActivityForm] = useState(false)
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [showTargetForm, setShowTargetForm] = useState(false)
  const [showReflectionForm, setShowReflectionForm] = useState(false)

  async function fetchAll() {
    setLoading(true)
    const [projectsRes, activitiesRes, targetsRes, reflectionRes] = await Promise.all([
      supabase.from('projects').select('*').order('created_at'),
      supabase.from('activities').select('*').eq('log_date', today).order('start_time'),
      supabase.from('targets').select('*').eq('target_date', tomorrow).order('created_at'),
      supabase.from('daily_reflections').select('*').eq('log_date', today).maybeSingle(),
    ])
    setProjects(projectsRes.data || [])
    setActivities(activitiesRes.data || [])
    setTargets(targetsRes.data || [])
    if (reflectionRes.data) setReflection(reflectionRes.data)
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const stats = useMemo(() => {
    const total = activities.length
    const done = activities.filter((a) => a.done).length
    const totalHours = activities.reduce((sum, a) => sum + Number(a.duration_hours || 0), 0)
    const byCategory = {}
    activities.forEach((a) => {
      byCategory[a.category] = (byCategory[a.category] || 0) + Number(a.duration_hours || 0)
    })
    return { total, done, pending: total - done, totalHours, byCategory }
  }, [activities])

  const conicGradient = useMemo(() => {
    const entries = Object.entries(stats.byCategory)
    if (!entries.length || stats.totalHours === 0) return 'conic-gradient(var(--color-surface-soft) 0deg 360deg)'
    let acc = 0
    const stops = entries.map(([cat, hours]) => {
      const start = acc
      acc += (hours / stats.totalHours) * 360
      return `${CATEGORIES[cat]?.dot || '#5C6B85'} ${start}deg ${acc}deg`
    })
    return `conic-gradient(${stops.join(', ')})`
  }, [stats])

  async function toggleActivityDone(activity) {
    await supabase.from('activities').update({ done: !activity.done }).eq('id', activity.id)
    fetchAll()
  }

  async function toggleTargetDone(target) {
    await supabase.from('targets').update({ done: !target.done }).eq('id', target.id)
    fetchAll()
  }

  async function addActivity(form) {
    await supabase.from('activities').insert({ ...form, user_id: userId, log_date: today })
    setShowActivityForm(false)
    fetchAll()
  }

  async function addProject(form) {
    await supabase.from('projects').insert({ ...form, user_id: userId })
    setShowProjectForm(false)
    fetchAll()
  }

  async function addTarget(form) {
    await supabase.from('targets').insert({ ...form, user_id: userId, target_date: tomorrow })
    setShowTargetForm(false)
    fetchAll()
  }

  async function saveReflection(form) {
    await supabase.from('daily_reflections').upsert(
      { ...form, user_id: userId, log_date: today },
      { onConflict: 'user_id,log_date' }
    )
    setReflection(form)
    setShowReflectionForm(false)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-ink-soft text-sm">Memuat data...</div>

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <header className="flex items-start justify-between gap-4 mb-8">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center shrink-0">
            <span className="font-mono text-primary text-xs font-bold">DEL</span>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-ink">Daily engineering log</h1>
            <p className="text-sm text-ink-soft">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
        <button onClick={() => supabase.auth.signOut()} className="text-xs text-ink-muted hover:text-ink-soft shrink-0">
          Keluar
        </button>
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatCard label="Total aktivitas" value={stats.total} />
        <StatCard label="Selesai" value={stats.done} />
        <StatCard label="Pending" value={stats.pending} />
        <StatCard label="Jam kerja" value={stats.totalHours.toFixed(1)} mono />
      </section>

      <Section title="Project aktif" action={<TextButton onClick={() => setShowProjectForm(true)}>+ Project</TextButton>}>
        {showProjectForm && <ProjectForm onCancel={() => setShowProjectForm(false)} onSubmit={addProject} />}
        {projects.length === 0 && !showProjectForm && <EmptyHint text="Belum ada project. Tambahkan project pertamamu." />}
        <div className="flex flex-col gap-3">
          {projects.map((p) => (
            <div key={p.id} className="bg-surface border border-line rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-sm font-medium text-ink">{p.name}</p>
                  {p.description && <p className="text-xs text-ink-soft mt-0.5">{p.description}</p>}
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${PRIORITY_STYLES[p.priority]}`}>
                  {p.priority}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 rounded-full bg-surface-soft overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${p.progress}%`,
                      background: p.progress >= 60 ? 'var(--color-success)' : p.progress >= 30 ? 'var(--color-warning)' : 'var(--color-danger)',
                    }}
                  />
                </div>
                <span className="font-mono text-xs text-ink-soft">{p.progress}%</span>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${STATUS_STYLES[p.status]}`}>
                  {p.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Aktivitas hari ini" action={<TextButton onClick={() => setShowActivityForm(true)}>+ Aktivitas</TextButton>}>
        {showActivityForm && (
          <ActivityForm projects={projects} onCancel={() => setShowActivityForm(false)} onSubmit={addActivity} />
        )}
        {activities.length === 0 && !showActivityForm && <EmptyHint text="Belum ada aktivitas tercatat hari ini." />}
        <div className="bg-surface border border-line rounded-xl divide-y divide-line">
          {activities.map((a) => (
            <div key={a.id} className="flex items-center gap-3 px-4 py-2.5">
              <button onClick={() => toggleActivityDone(a)} className="shrink-0">
                <span
                  className={`block w-4 h-4 rounded-full border-2 ${a.done ? 'bg-success border-success' : 'border-line'}`}
                />
              </button>
              {a.start_time && (
                <span className="font-mono text-xs text-ink-muted w-16 shrink-0">{a.start_time.slice(0, 5)}</span>
              )}
              <span className="flex-1 text-sm text-ink">{a.title}</span>
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: CATEGORIES[a.category]?.dot }} />
              <span className="font-mono text-xs text-ink-soft w-10 text-right shrink-0">{a.duration_hours}j</span>
            </div>
          ))}
        </div>
      </Section>

      <section className="grid sm:grid-cols-2 gap-3 mb-8">
        <div className="bg-success-soft border border-success/20 rounded-xl p-4">
          <h3 className="text-sm font-medium text-success mb-2">Pencapaian hari ini</h3>
          <div className="flex flex-col gap-1.5">
            {(reflection.achievements || []).map((item, i) => (
              <p key={i} className="text-sm text-ink">{item}</p>
            ))}
            {(!reflection.achievements || reflection.achievements.length === 0) && (
              <p className="text-sm text-ink-muted">Belum diisi.</p>
            )}
          </div>
        </div>
        <div className="bg-danger-soft border border-danger/20 rounded-xl p-4">
          <h3 className="text-sm font-medium text-danger mb-2">Kendala</h3>
          <div className="flex flex-col gap-1.5">
            {(reflection.obstacles || []).map((item, i) => (
              <p key={i} className="text-sm text-ink">{item}</p>
            ))}
            {(!reflection.obstacles || reflection.obstacles.length === 0) && (
              <p className="text-sm text-ink-muted">Belum diisi.</p>
            )}
          </div>
        </div>
      </section>

      <Section title="Kategori waktu">
        <div className="bg-surface border border-line rounded-xl p-4 flex items-center gap-6 flex-wrap">
          <div className="w-28 h-28 rounded-full shrink-0 relative" style={{ background: conicGradient }}>
            <div className="absolute inset-2.5 rounded-full bg-surface flex flex-col items-center justify-center">
              <span className="text-lg font-semibold text-ink">{stats.totalHours.toFixed(1)}</span>
              <span className="text-[11px] text-ink-soft">jam</span>
            </div>
          </div>
          <div className="flex-1 min-w-40 flex flex-col gap-2">
            {Object.entries(stats.byCategory).map(([cat, hours]) => (
              <div key={cat} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-ink">
                  <span className="w-2 h-2 rounded-full" style={{ background: CATEGORIES[cat]?.dot }} />
                  {CATEGORIES[cat]?.label || cat}
                </span>
                <span className="font-mono text-xs text-ink-soft">
                  {hours.toFixed(2)}j · {stats.totalHours ? Math.round((hours / stats.totalHours) * 100) : 0}%
                </span>
              </div>
            ))}
            {Object.keys(stats.byCategory).length === 0 && <p className="text-sm text-ink-muted">Belum ada data.</p>}
          </div>
        </div>
      </Section>

      <Section title="Target besok" action={<TextButton onClick={() => setShowTargetForm(true)}>+ Target</TextButton>}>
        {showTargetForm && <TargetForm projects={projects} onCancel={() => setShowTargetForm(false)} onSubmit={addTarget} />}
        {targets.length === 0 && !showTargetForm && <EmptyHint text="Belum ada target untuk besok." />}
        <div className="bg-surface border border-line rounded-xl divide-y divide-line">
          {targets.map((t) => (
            <div key={t.id} className="flex items-center gap-3 px-4 py-2.5">
              <button onClick={() => toggleTargetDone(t)} className="shrink-0">
                <span
                  className={`block w-4 h-4 rounded border-2 ${t.done ? 'bg-primary border-primary' : 'border-line'}`}
                />
              </button>
              <span className="flex-1 text-sm text-ink">{t.title}</span>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${PRIORITY_STYLES[t.priority]}`}>
                {t.priority}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Catatan pribadi" action={<TextButton onClick={() => setShowReflectionForm(true)}>Edit</TextButton>}>
        {showReflectionForm ? (
          <ReflectionForm initial={reflection} onCancel={() => setShowReflectionForm(false)} onSubmit={saveReflection} />
        ) : (
          <div className="bg-warning-soft border border-warning/20 rounded-xl p-4">
            <p className="text-sm text-ink whitespace-pre-line">{reflection.personal_notes || 'Belum ada catatan.'}</p>
          </div>
        )}
      </Section>
    </div>
  )
}

function StatCard({ label, value, mono }) {
  return (
    <div className="bg-surface-soft rounded-xl p-3">
      <p className="text-xs text-ink-soft mb-1">{label}</p>
      <p className={`text-xl font-semibold text-ink ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  )
}

function Section({ title, action, children }) {
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-medium text-ink">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function TextButton({ children, onClick }) {
  return (
    <button onClick={onClick} className="text-xs font-medium text-primary hover:underline">
      {children}
    </button>
  )
}

function EmptyHint({ text }) {
  return <p className="text-sm text-ink-muted mb-3">{text}</p>
}

function FormShell({ onCancel, onSubmit, children, submitLabel = 'Simpan' }) {
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit() }}
      className="bg-surface border border-line rounded-xl p-4 mb-3 flex flex-col gap-3"
    >
      {children}
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="text-xs text-ink-soft px-3 py-1.5">Batal</button>
        <button type="submit" className="text-xs font-medium bg-primary text-white rounded-lg px-3 py-1.5">{submitLabel}</button>
      </div>
    </form>
  )
}

const inputCls = 'border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-soft focus:border-primary'

function ProjectForm({ onCancel, onSubmit }) {
  const [form, setForm] = useState({ name: '', description: '', progress: 0, status: 'berjalan', priority: 'sedang' })
  return (
    <FormShell onCancel={onCancel} onSubmit={() => onSubmit(form)}>
      <input required placeholder="Nama project" className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input placeholder="Deskripsi singkat" className={inputCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <div className="grid grid-cols-3 gap-2">
        <input type="number" min="0" max="100" placeholder="Progress %" className={inputCls} value={form.progress} onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })} />
        <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option value="berjalan">Berjalan</option>
          <option value="menunggu">Menunggu</option>
          <option value="review">Review</option>
          <option value="selesai">Selesai</option>
        </select>
        <select className={inputCls} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
          <option value="tinggi">Tinggi</option>
          <option value="sedang">Sedang</option>
          <option value="rendah">Rendah</option>
        </select>
      </div>
    </FormShell>
  )
}

function ActivityForm({ projects, onCancel, onSubmit }) {
  const [form, setForm] = useState({ title: '', category: 'design', duration_hours: 1, start_time: '', end_time: '', project_id: '', done: true })
  return (
    <FormShell onCancel={onCancel} onSubmit={() => onSubmit({ ...form, project_id: form.project_id || null })}>
      <input required placeholder="Nama aktivitas" className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <div className="grid grid-cols-2 gap-2">
        <input type="time" className={inputCls} value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
        <input type="time" className={inputCls} value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <select className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          {Object.entries(CATEGORIES).map(([key, v]) => <option key={key} value={key}>{v.label}</option>)}
        </select>
        <input type="number" step="0.25" min="0" placeholder="Durasi (jam)" className={inputCls} value={form.duration_hours} onChange={(e) => setForm({ ...form, duration_hours: Number(e.target.value) })} />
      </div>
      <select className={inputCls} value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })}>
        <option value="">Tanpa project</option>
        {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
    </FormShell>
  )
}

function TargetForm({ projects, onCancel, onSubmit }) {
  const [form, setForm] = useState({ title: '', priority: 'sedang', project_id: '' })
  return (
    <FormShell onCancel={onCancel} onSubmit={() => onSubmit({ ...form, project_id: form.project_id || null })}>
      <input required placeholder="Target / pekerjaan" className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <div className="grid grid-cols-2 gap-2">
        <select className={inputCls} value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })}>
          <option value="">Tanpa project</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select className={inputCls} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
          <option value="tinggi">Tinggi</option>
          <option value="sedang">Sedang</option>
          <option value="rendah">Rendah</option>
        </select>
      </div>
    </FormShell>
  )
}

function ReflectionForm({ initial, onCancel, onSubmit }) {
  const [mood, setMood] = useState(initial.mood || '')
  const [achievements, setAchievements] = useState((initial.achievements || []).join('\n'))
  const [obstacles, setObstacles] = useState((initial.obstacles || []).join('\n'))
  const [notes, setNotes] = useState(initial.personal_notes || '')

  function handleSubmit() {
    onSubmit({
      mood,
      achievements: achievements.split('\n').map((s) => s.trim()).filter(Boolean),
      obstacles: obstacles.split('\n').map((s) => s.trim()).filter(Boolean),
      personal_notes: notes,
    })
  }

  return (
    <FormShell onCancel={onCancel} onSubmit={handleSubmit}>
      <input placeholder="Mood hari ini" className={inputCls} value={mood} onChange={(e) => setMood(e.target.value)} />
      <textarea placeholder="Pencapaian (satu baris per item)" rows={3} className={inputCls} value={achievements} onChange={(e) => setAchievements(e.target.value)} />
      <textarea placeholder="Kendala (satu baris per item)" rows={3} className={inputCls} value={obstacles} onChange={(e) => setObstacles(e.target.value)} />
      <textarea placeholder="Catatan pribadi" rows={3} className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} />
    </FormShell>
  )
}
