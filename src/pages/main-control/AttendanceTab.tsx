import { useState, useEffect } from 'react'
import { attendanceService } from '../../services/attendance.service'
import { employeeService }   from '../../services/employee.service'
import type { AttendanceLog, User } from '../../types'
import { Modal } from '../../components/Modal'
import { formatTime } from '../../lib/timeUtils'

type LogForm = Partial<AttendanceLog>

const INPUT = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent'

export function AttendanceTab() {
  const [logs,    setLogs]    = useState<AttendanceLog[]>([])
  const [users,   setUsers]   = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [editLog, setEditLog] = useState<AttendanceLog | null>(null)
  const [form,    setForm]    = useState<LogForm>({})
  const [saving,  setSaving]  = useState(false)
  const [filter,  setFilter]  = useState('')

  useEffect(() => {
    Promise.all([attendanceService.getAll(), employeeService.getByRole('employee')]).then(([l, u]) => {
      setLogs(l); setUsers(u); setLoading(false)
    })
  }, [])

  const name = (id: string) => users.find(u => u.id === id)?.full_name ?? id
  const fv   = <K extends keyof LogForm>(k: K, v: LogForm[K]) => setForm(f => ({ ...f, [k]: v }))

  const openEdit = (log: AttendanceLog) => { setForm({ ...log }); setEditLog(log) }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editLog) return
    setSaving(true)
    try {
      const updated = await attendanceService.update(editLog.id, form)
      setLogs(prev => prev.map(l => l.id === updated.id ? updated : l))
      setEditLog(null)
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this attendance log?')) return
    await attendanceService.delete(id)
    setLogs(prev => prev.filter(l => l.id !== id))
  }

  const visible = filter ? logs.filter(l => l.employee_id === filter) : logs

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Attendance Logs</h2>
          <p className="text-xs text-slate-400 mt-0.5">{visible.length} records</p>
        </div>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="">All Employees</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Employee', 'Date', 'Time In', 'Break', 'Time Out', 'OT', 'Status', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.slice(0, 60).map(l => (
                <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900">{name(l.employee_id)}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{l.date}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{formatTime(l.time_in)}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {l.break_start ? `${formatTime(l.break_start)} – ${formatTime(l.break_end)}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{formatTime(l.time_out)}</td>
                  <td className="px-4 py-3 text-sm">
                    {l.overtime_minutes > 0
                      ? <span className="text-amber-600 font-medium">+{l.overtime_minutes}m</span>
                      : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {l.is_late
                      ? <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700">Late</span>
                      : <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">On time</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button onClick={() => openEdit(l)}
                        className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold transition-colors">
                        Edit
                      </button>
                      <span className="text-slate-200">|</span>
                      <button onClick={() => handleDelete(l.id)}
                        className="text-rose-500 hover:text-rose-700 text-xs font-semibold transition-colors">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-400">No records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editLog && (
        <Modal title="Edit Attendance Log" onClose={() => setEditLog(null)}>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Date</label>
              <input type="date" value={form.date ?? ''} onChange={e => fv('date', e.target.value)} className={INPUT} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(['time_in', 'break_start', 'break_end', 'time_out'] as const).map(k => (
                <div key={k}>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                    {k.replace(/_/g, ' ')}
                  </label>
                  <input
                    type="time"
                    value={(form[k] as string | null | undefined)?.slice(0, 5) ?? ''}
                    onChange={e => fv(k, e.target.value ? e.target.value + ':00' : null)}
                    className={INPUT}
                  />
                </div>
              ))}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Overtime (minutes)</label>
              <input type="number" min="0" value={form.overtime_minutes ?? 0}
                onChange={e => fv('overtime_minutes', parseInt(e.target.value) || 0)}
                className={INPUT} />
            </div>
            <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.is_late ?? false}
                onChange={e => fv('is_late', e.target.checked)}
                className="w-4 h-4 accent-indigo-600"
              />
              Mark as Late
            </label>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setEditLog(null)}
                className="px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg disabled:opacity-50 transition-colors">
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
