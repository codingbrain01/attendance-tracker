import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { ROLE_ROUTES } from '../../types'
import { resetDemoData } from '../../lib/mockStore'

const DEMO_ACCOUNTS = [
  { label: 'Main Control', sub: 'Full system access', email: 'control@demo.com', color: 'border-purple-200 hover:border-purple-400 hover:bg-purple-50', dot: 'bg-purple-500' },
  { label: 'Admin',        sub: 'Manage team & shifts', email: 'admin@demo.com',   color: 'border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50', dot: 'bg-indigo-500' },
  { label: 'Employee',     sub: 'Log own attendance',   email: 'alice@demo.com',   color: 'border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50', dot: 'bg-emerald-500' },
]

const INPUT = 'w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow'

export function LoginPage() {
  const { signIn, user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [error, setError]           = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (user) navigate(ROLE_ROUTES[user.role], { replace: true })
  }, [user, navigate])

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await signIn(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Left brand panel ── */}
      <div className="hidden lg:flex lg:w-[42%] bg-slate-900 flex-col justify-between p-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">AT</span>
          </div>
          <span className="text-white font-semibold tracking-tight">AttendTrack</span>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-white leading-snug mb-4">
            Manage your team's<br />attendance with ease.
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            Track time in, breaks, and time out. Monitor late arrivals, overtime hours,
            and generate attendance reports — all in one place.
          </p>

          <div className="space-y-3">
            {[
              { role: 'Main Control', desc: 'Full CRUD over all employees, admins, shifts, and logs', color: 'bg-purple-500' },
              { role: 'Admin',        desc: 'Manage employees, assign shifts, view attendance reports', color: 'bg-indigo-500' },
              { role: 'Employee',     desc: 'Clock in/out, track breaks, view personal dashboard', color: 'bg-emerald-500' },
            ].map(r => (
              <div key={r.role} className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full ${r.color} mt-1.5 shrink-0`} />
                <div>
                  <p className="text-white text-sm font-medium">{r.role}</p>
                  <p className="text-slate-500 text-xs">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-slate-600 text-xs">Portfolio demo — all data stored locally in your browser.</p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 px-6 py-10">
        <div className="w-full max-w-sm space-y-6">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">AT</span>
            </div>
            <span className="text-slate-900 font-semibold">AttendTrack</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
            <p className="text-slate-500 text-sm mt-1">Sign in to your account to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={INPUT}
                placeholder="you@demo.com"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={INPUT}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-sm px-3 py-2.5 rounded-lg">
                <span className="shrink-0">⚠</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 text-sm"
            >
              {submitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Quick login */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-medium">Quick login</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map(acct => (
                <button
                  key={acct.email}
                  onClick={() => { setEmail(acct.email); setPassword('Demo@1234') }}
                  className={`w-full text-left px-4 py-3 rounded-xl border bg-white transition-all ${acct.color}`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2 h-2 rounded-full ${acct.dot} shrink-0`} />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{acct.label}</p>
                      <p className="text-xs text-slate-400">{acct.sub}</p>
                    </div>
                    <span className="ml-auto text-xs text-slate-400 font-mono">{acct.email}</span>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 text-center mt-3">
              All passwords: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">Demo@1234</code>
            </p>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={() => { resetDemoData(); window.location.reload() }}
              className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2 transition-colors"
            >
              Reset demo data
            </button>
          </div>

        </div>
      </div>

    </div>
  )
}
