import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from './lib/supabaseClient'
import Login from './components/Login'
import Dashboard from './components/Dashboard'

export default function App() {
  const [session, setSession] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setChecking(false)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setChecking(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h1 className="text-lg font-semibold text-ink mb-2">Supabase belum dikonfigurasi</h1>
          <p className="text-sm text-ink-soft">
            Buat file <code className="font-mono bg-surface-soft px-1.5 py-0.5 rounded">.env</code> berdasarkan{' '}
            <code className="font-mono bg-surface-soft px-1.5 py-0.5 rounded">.env.example</code>, isi
            VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY dari project Supabase kamu, lalu restart{' '}
            <code className="font-mono bg-surface-soft px-1.5 py-0.5 rounded">npm run dev</code>. Detail lengkap ada di README.
          </p>
        </div>
      </div>
    )
  }

  if (checking) {
    return <div className="min-h-screen flex items-center justify-center text-ink-soft text-sm">Memuat...</div>
  }

  return session ? <Dashboard session={session} /> : <Login />
}
