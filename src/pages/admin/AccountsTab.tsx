import { useState, useEffect } from 'react'
import { employeeService } from '../../services/employee.service'
import { shiftService }    from '../../services/shift.service'
import type { User, Shift } from '../../types'
import { Modal } from '../../components/Modal'
import { getInitials } from '../../lib/timeUtils'

interface AccountForm { full_name: string; position: string; email: string; password: string }
interface ShiftForm   { date: string; shift_start: string; shift_end: string }

const EMPTY_ACCOUNT: AccountForm = { full_name: '', position: '', email: '', password: '' }
const defaultShiftForm = (): ShiftForm => ({
  date: new Date().toISOString().split('T')[0],
  shift_start: '08:00',
  shift_end:   '17:00',
})

const INPUT = 'w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent'

export function AccountsTab() {
  const [employees,   setEmployees]   = useState<User[]>([])
  const [loading,     setLoading]     = useState(true)
  const [showCreate,  setShowCreate]  = useState(false)
  const [shiftTarget, setShiftTarget] = useState<User | null>(null)
  const [shifts,      setShifts]      = useState<Shift[]>([])
  const [form,        setForm]        = useState<AccountForm>(EMPTY_ACCOUNT)
  const [shiftForm,   setShiftForm]   = useState<ShiftForm>(defaultShiftForm())
  const [creating,    setCreating]    = useState(false)
  const [addingShift, setAddingShift] = useState(false)
  const [error,       setError]       = useState('')

  useEffect(() => { load() }, [])

  const load = async () => {
    setEmployees(await employeeService.getByRole('employee'))
    setLoading(false)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setCreating(true); setError('')
    try {
      await employeeService.create({ ...form, role: 'employee' })
      setShowCreate(false); setForm(EMPTY_ACCOUNT); await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account.')
    } finally { setCreating(false) }
  }

  const openShiftModal = async (emp: User) => {
    setShiftTarget(emp)
    setShiftForm(defaultShiftForm())
    setShifts(await shiftService.getByEmployee(emp.id))
  }

  const handleAddShift = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!shiftTarget) return
    setAddingShift(true)
    try {
      const s = await shiftService.create({ employee_id: shiftTarget.id, ...shiftForm })
      setShifts(prev => [s, ...prev])
      setShiftForm(defaultShiftForm())
    } finally { setAddingShift(false) }
  }

  const deleteShift = async (id: string) => {
    await shiftService.delete(id)
    setShifts(prev => prev.filter(s => s.id !== id))
  }

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Employee Accounts</h2>
          <p className="text-xs text-slate-400 mt-0.5">{employees.length} active employees</p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setError('') }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
        >
          + New Account
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {['Employee', 'Position', 'Email', 'Shifts'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {employees.map(emp => (
              <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                      <span className="text-indigo-600 text-xs font-semibold">{getInitials(emp.full_name)}</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">{emp.full_name}</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-slate-500">{emp.position}</td>
                <td className="px-5 py-4 text-sm text-slate-500">{emp.email}</td>
                <td className="px-5 py-4">
                  <button
                    onClick={() => openShiftModal(emp)}
                    className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold border border-indigo-200 hover:border-indigo-400 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Manage Shifts
                  </button>
                </td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-400">No employees yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Account Modal */}
      {showCreate && (
        <Modal title="New Employee Account" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            {(['full_name', 'position'] as const).map(field => (
              <div key={field}>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                  {field === 'full_name' ? 'Full Name' : 'Position'}
                </label>
                <input
                  value={form[field]}
                  onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                  className={INPUT}
                  required
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Email</label>
              <input type="email" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className={INPUT} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Password</label>
              <input type="password" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className={INPUT} required />
            </div>
            {error && <p className="text-rose-600 text-xs">{error}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setShowCreate(false)}
                className="px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={creating}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg disabled:opacity-50 transition-colors">
                {creating ? 'Creating…' : 'Create Account'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Shift Modal */}
      {shiftTarget && (
        <Modal title={`Shifts — ${shiftTarget.full_name}`} onClose={() => setShiftTarget(null)} wide>
          <form onSubmit={handleAddShift} className="grid grid-cols-3 gap-3 mb-5 pb-5 border-b border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Date</label>
              <input type="date" value={shiftForm.date}
                onChange={e => setShiftForm(f => ({ ...f, date: e.target.value }))}
                className={INPUT} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Start</label>
              <input type="time" value={shiftForm.shift_start}
                onChange={e => setShiftForm(f => ({ ...f, shift_start: e.target.value }))}
                className={INPUT} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">End</label>
              <input type="time" value={shiftForm.shift_end}
                onChange={e => setShiftForm(f => ({ ...f, shift_end: e.target.value }))}
                className={INPUT} required />
            </div>
            <div className="col-span-3">
              <button type="submit" disabled={addingShift}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-lg disabled:opacity-50 transition-colors">
                {addingShift ? 'Adding…' : '+ Add Shift'}
              </button>
            </div>
          </form>

          <div className="max-h-56 overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-white border-b border-slate-200">
                <tr>
                  {['Date', 'Start', 'End', ''].map(h => (
                    <th key={h} className="pb-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider pr-4 last:pr-0">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shifts.slice(0, 15).map(s => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="py-2 text-sm text-slate-700 pr-4">{s.date}</td>
                    <td className="py-2 text-sm text-slate-700 pr-4">{s.shift_start}</td>
                    <td className="py-2 text-sm text-slate-700 pr-4">{s.shift_end}</td>
                    <td className="py-2 text-right">
                      <button onClick={() => deleteShift(s.id)}
                        className="text-rose-500 hover:text-rose-700 text-xs font-medium transition-colors">
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {shifts.length === 0 && (
                  <tr><td colSpan={4} className="py-6 text-center text-sm text-slate-400">No shifts assigned yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Modal>
      )}
    </div>
  )
}
