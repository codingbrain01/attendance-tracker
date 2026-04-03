import { useState, useEffect } from 'react'
import { employeeService } from '../../services/employee.service'
import type { User } from '../../types'
import { Modal } from '../../components/Modal'
import { getInitials } from '../../lib/timeUtils'

interface Props { role: 'employee' | 'admin' }
interface UForm { full_name: string; position: string; email: string; password: string }

const EMPTY: UForm = { full_name: '', position: '', email: '', password: '' }

const INPUT = 'w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent'

export function UsersTab({ role }: Props) {
  const [users,      setUsers]      = useState<User[]>([])
  const [loading,    setLoading]    = useState(true)
  const [modal,      setModal]      = useState<'create' | User | null>(null)
  const [form,       setForm]       = useState<UForm>(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState('')

  useEffect(() => { load() }, [role])

  const load = async () => {
    setLoading(true)
    setUsers(await employeeService.getByRole(role))
    setLoading(false)
  }

  const openCreate = () => { setForm(EMPTY); setError(''); setModal('create') }
  const openEdit   = (u: User) => {
    setForm({ full_name: u.full_name, position: u.position, email: u.email, password: '' })
    setError(''); setModal(u)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError('')
    try {
      if (modal === 'create') {
        await employeeService.create({ ...form, role })
      } else if (modal && typeof modal === 'object') {
        const updates: Partial<UForm> = { full_name: form.full_name, position: form.position, email: form.email }
        if (form.password) updates.password = form.password
        await employeeService.update((modal as User).id, updates)
      }
      setModal(null); await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed.')
    } finally { setSubmitting(false) }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this account permanently?')) return
    await employeeService.delete(id); await load()
  }

  const isCreate = modal === 'create'
  const label    = role === 'employee' ? 'Employee' : 'Admin'
  const avatarBg = role === 'employee' ? 'bg-indigo-100 text-indigo-600' : 'bg-purple-100 text-purple-600'

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{label}s</h2>
          <p className="text-xs text-slate-400 mt-0.5">{users.length} {label.toLowerCase()}{users.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
        >
          + Add {label}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {['Name', 'Position', 'Email', 'Actions'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${avatarBg}`}>
                      {getInitials(u.full_name)}
                    </div>
                    <span className="text-sm font-semibold text-slate-900">{u.full_name}</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-slate-500">{u.position}</td>
                <td className="px-5 py-4 text-sm text-slate-500">{u.email}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <button onClick={() => openEdit(u)}
                      className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold transition-colors">
                      Edit
                    </button>
                    <span className="text-slate-200">|</span>
                    <button onClick={() => handleDelete(u.id)}
                      className="text-rose-500 hover:text-rose-700 text-xs font-semibold transition-colors">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-400">No {label.toLowerCase()}s found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal !== null && (
        <Modal title={isCreate ? `New ${label}` : `Edit ${label}`} onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Full Name</label>
              <input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                className={INPUT} placeholder="Jane Dela Cruz" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Position</label>
              <input value={form.position} onChange={e => setForm(p => ({ ...p, position: e.target.value }))}
                className={INPUT} placeholder="Software Developer" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Email</label>
              <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className={INPUT} placeholder="jane@demo.com" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Password {!isCreate && <span className="text-slate-400 normal-case font-normal">(leave blank to keep current)</span>}
              </label>
              <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                className={INPUT} placeholder="••••••••" required={isCreate} />
            </div>
            {error && (
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3 py-2 rounded-lg">
                <span>⚠</span><span>{error}</span>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setModal(null)}
                className="px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={submitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg disabled:opacity-50 transition-colors">
                {submitting ? 'Saving…' : isCreate ? `Create ${label}` : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
