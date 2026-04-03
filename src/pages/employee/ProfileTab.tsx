import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { employeeService } from '../../services/employee.service'
import { getInitials } from '../../lib/timeUtils'

const ROLE_LABELS: Record<string, string> = {
  main_control: 'Main Control',
  admin: 'Admin',
  employee: 'Employee',
}

const ROLE_COLORS: Record<string, string> = {
  main_control: 'bg-purple-100 text-purple-700',
  admin:        'bg-indigo-100 text-indigo-700',
  employee:     'bg-slate-100 text-slate-700',
}

const INPUT = 'w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow'

export function ProfileTab() {
  const { user, refreshUser } = useAuth()
  const [email,   setEmail]   = useState(user?.email ?? '')
  const [saving,  setSaving]  = useState(false)
  const [message, setMessage] = useState('')
  const [error,   setError]   = useState('')

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.')
      return
    }
    setSaving(true); setError(''); setMessage('')
    try {
      await employeeService.update(user.id, { email })
      await refreshUser()
      setMessage('Email updated successfully.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update.')
    } finally {
      setSaving(false)
    }
  }

  if (!user) return null

  return (
    <div className="space-y-4">
      {/* Identity card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-indigo-500 flex items-center justify-center shrink-0">
            <span className="text-white text-lg font-bold">{getInitials(user.full_name)}</span>
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{user.full_name}</h2>
            <p className="text-sm text-slate-500">{user.position}</p>
            <span className={`inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[user.role]}`}>
              {ROLE_LABELS[user.role]}
            </span>
          </div>
        </div>
      </div>

      {/* Read-only info */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Account Details</h3>
        {[
          { label: 'Full Name', value: user.full_name },
          { label: 'Position',  value: user.position  },
          { label: 'Role',      value: ROLE_LABELS[user.role] },
        ].map(f => (
          <div key={f.label}>
            <p className="text-xs font-medium text-slate-500 mb-1">{f.label}</p>
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700">
              {f.value}
            </div>
          </div>
        ))}
      </div>

      {/* Editable email */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Contact</h3>
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Email <span className="text-indigo-500 font-normal">(editable)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={INPUT}
            />
          </div>
          {error   && <p className="text-rose-600 text-xs">{error}</p>}
          {message && <p className="text-emerald-600 text-xs">{message}</p>}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving || email === user.email}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors disabled:opacity-40"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
