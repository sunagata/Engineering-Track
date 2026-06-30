import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Login() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({ email })
    setLoading(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm bg-surface border border-line rounded-2xl p-8">
        <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center mb-4">
          <span className="font-mono text-primary text-sm font-bold">DEL</span>
        </div>
        <h1 className="text-xl font-semibold text-ink mb-1">Daily engineering log</h1>
        <p className="text-sm text-ink-soft mb-6">Masuk pakai email untuk sinkron data di semua device kamu.</p>

        {sent ? (
          <p className="text-sm text-success bg-success-soft rounded-lg p-3">
            Link masuk sudah dikirim ke {email}. Cek inbox kamu, lalu buka link itu di device ini atau device lain.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              required
              placeholder="email@kamu.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-line rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-soft focus:border-primary"
            />
            {error && <p className="text-sm text-danger">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-60"
            >
              {loading ? 'Mengirim link...' : 'Kirim link masuk'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
