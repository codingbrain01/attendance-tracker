import { useState, useEffect } from 'react'
import { shiftService }    from '../../services/shift.service'
import { employeeService } from '../../services/employee.service'
import type { Shift, User } from '../../types'
import { Modal } from '../../components/Modal'
import { todayStr } from '../../lib/timeUtils'

type SForm = { employee_id: string; date: string; shift_start: string; shift_end: string }

const defaultForm = (firstId: string): SForm => ({
  employee_id: firstId,
  date: todayStr(),
  shift_start: '08:00',
  shift_end:   '17:00',
})

const INPUT = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent'

export function ShiftsTab() {
  const [shifts,     setShifts]     = useState<Shift[]>([])
  const [users,      setUsers]      = useState<User[]>([])
  const [loading,    setLoading]    = useState(true)
  const [modal,      setModal]      = useState<'create' | Shift | null>(null)
  const [form,       setForm]       = useState<SForm>(defaultForm(''))
  const [submitting, setSubmitting] = useState(false)
  const [filter,     setFilter]     = useState('')

  useEffect(() => {
    Promise.all([shiftService.getAll(), employeeService.getByRole('employee')]).then(([s, u]) => {
      setShifts(s); setUsers(u)
      if (u.length) setForm(defaultForm(u[0].id))
      setLoading(false)
    })
  }, [])

  const name = (id: string) => users.find(u => u.id === id)?.full_name ?? id
  const fv   = <K extends keyof SForm>(k: K, v: SForm[K]) => setForm(f => ({ ...f, [k]: v }))

  const openCreate = () => { setForm(defaultForm(users[0]?.id ?? '')); setModal('create') }
  const openEdit   = (s: Shift) => {
    setForm({ employee_id: s.employee_id, date: s.date, shift_start: s.shift_start, shift_end: s.shift_end })
    setModal(s)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true)
    try {
      if (modal === 'create') {
        const s = await shiftService.create(form)
        setShifts(prev => [s, ...prev])
      } else if (modal && typeof modal === 'object') {
        const updated = await shiftService.update((modal as Shift).id, form)
        setShifts(prev => prev.map(s => s.id === updated.id ? updated : s))
      }
      setModal(null)
    } finally { setSubmitting(false) }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this shift?')) return
    await shiftService.delete(id)
    setShifts(prev => prev.filter(s => s.id !== id))
  }

  const visible = filter ? shifts.filter(s => s.employee_id === filter) : shifts

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Shifts</h2>
          <p className="text-xs text-slate-400 mt-0.5">{visible.length} records</p>
        </div>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">All Employees</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
          </select>
          <button
            onClick={openCreate}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            + Add Shift
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {['Employee', 'Date', 'Shift Start', 'Shift End', 'Actions'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.slice(0, 60).map(s => (
              <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3 text-sm font-semibold text-slate-900">{name(s.employee_id)}</td>
                <td className="px-5 py-3 text-sm text-slate-500">{s.date}</td>
                <td className="px-5 py-3 text-sm text-slate-700">{s.shift_start}</td>
                <td className="px-5 py-3 text-sm text-slate-700">{s.shift_end}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <button onClick={() => openEdit(s)}
                      className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold transition-colors">
                      Edit
                    </button>
                    <span className="text-slate-200">|</span>
                    <button onClick={() => handleDelete(s.id)}
                      className="text-rose-500 hover:text-rose-700 text-xs font-semibold transition-colors">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-400">No shifts found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal !== null && (
        <Modal title={modal === 'create' ? 'New Shift' : 'Edit Shift'} onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {modal === 'create' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Employee</label>
                <select value={form.employee_id} onChange={e => fv('employee_id', e.target.value)}
                  className={INPUT}>
                  {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Date</label>
              <input type="date" value={form.date} onChange={e => fv('date', e.target.value)}
                className={INPUT} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Start Time</label>
                <input type="time" value={form.shift_start} onChange={e => fv('shift_start', e.target.value)}
                  className={INPUT} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">End Time</label>
                <input type="time" value={form.shift_end} onChange={e => fv('shift_end', e.target.value)}
                  className={INPUT} required />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setModal(null)}
                className="px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={submitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg disabled:opacity-50 transition-colors">
                {submitting ? 'Saving…' : modal === 'create' ? 'Create Shift' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
