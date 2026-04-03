import { useState, useEffect } from 'react'
import { employeeService }   from '../../services/employee.service'
import { attendanceService } from '../../services/attendance.service'
import type { User, AttendanceLog } from '../../types'
import { calcHoursWorked, formatHours, formatTime, todayStr, getMonthStart, getInitials } from '../../lib/timeUtils'

export function DashboardTab() {
  const [employees,  setEmployees]  = useState<User[]>([])
  const [selected,   setSelected]   = useState<User | null>(null)
  const [logs,       setLogs]       = useState<AttendanceLog[]>([])
  const [loading,    setLoading]    = useState(true)
  const [detailLoad, setDetailLoad] = useState(false)

  useEffect(() => {
    employeeService.getByRole('employee').then(emps => {
      setEmployees(emps)
      setLoading(false)
    })
  }, [])

  const handleSelect = async (emp: User) => {
    if (selected?.id === emp.id) return
    setSelected(emp)
    setDetailLoad(true)
    setLogs(await attendanceService.getByEmployee(emp.id))
    setDetailLoad(false)
  }

  const today      = todayStr()
  const monthStart = getMonthStart()
  const monthLogs  = logs.filter(l => l.date >= monthStart && l.date <= today)
  const hrs        = (l: AttendanceLog) => calcHoursWorked(l.time_in, l.time_out, l.break_start, l.break_end)
  const totalH     = monthLogs.reduce((s, l) => s + hrs(l), 0)
  const overtimeH  = monthLogs.reduce((s, l) => s + l.overtime_minutes, 0) / 60
  const lateCount  = monthLogs.filter(l => l.is_late).length

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Employee list */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Employees</h2>
          <p className="text-xs text-slate-400 mt-0.5">{employees.length} team members</p>
        </div>
        <div className="divide-y divide-slate-100">
          {employees.map(emp => (
            <button
              key={emp.id}
              onClick={() => handleSelect(emp)}
              className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                selected?.id === emp.id
                  ? 'bg-indigo-50 border-l-2 border-indigo-500'
                  : 'hover:bg-slate-50 border-l-2 border-transparent'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-semibold ${
                selected?.id === emp.id ? 'bg-indigo-500' : 'bg-slate-400'
              }`}>
                {getInitials(emp.full_name)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{emp.full_name}</p>
                <p className="text-xs text-slate-400 truncate">{emp.position}</p>
              </div>
            </button>
          ))}
          {employees.length === 0 && (
            <p className="px-4 py-8 text-sm text-slate-400 text-center">No employees found.</p>
          )}
        </div>
      </div>

      {/* Detail panel */}
      <div className="lg:col-span-2 space-y-4">
        {!selected ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-600">Select an employee</p>
            <p className="text-xs text-slate-400 mt-1">Click a name to view their records</p>
          </div>
        ) : (
          <>
            {/* Profile card + month stats */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-indigo-500 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-white text-sm font-bold">{getInitials(selected.full_name)}</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{selected.full_name}</h3>
                    <p className="text-sm text-slate-500">{selected.position}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{selected.email}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  {[
                    { label: 'Month Hours',  value: formatHours(totalH),     color: 'text-indigo-600' },
                    { label: 'Overtime',     value: formatHours(overtimeH),  color: 'text-amber-600' },
                    { label: 'Late Days',    value: String(lateCount),       color: 'text-rose-600' },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-slate-400">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Attendance table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900">Attendance History</h3>
                <p className="text-xs text-slate-400 mt-0.5">Most recent first</p>
              </div>
              {detailLoad ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        {['Date', 'Time In', 'Break', 'Time Out', 'Hours', 'Status'].map(h => (
                          <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {logs.slice(0, 20).map(l => (
                        <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3 text-sm text-slate-600">{l.date}</td>
                          <td className="px-5 py-3 text-sm font-medium text-slate-900">{formatTime(l.time_in)}</td>
                          <td className="px-5 py-3 text-xs text-slate-400">
                            {l.break_start ? `${formatTime(l.break_start)} – ${formatTime(l.break_end)}` : '—'}
                          </td>
                          <td className="px-5 py-3 text-sm font-medium text-slate-900">{formatTime(l.time_out)}</td>
                          <td className="px-5 py-3 text-sm text-slate-700">{formatHours(hrs(l))}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-1">
                              {l.is_late && <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700">Late</span>}
                              {l.overtime_minutes > 0 && <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">+{l.overtime_minutes}m</span>}
                              {!l.is_late && l.overtime_minutes === 0 && <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">On time</span>}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {logs.length === 0 && (
                        <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-400">No attendance records yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
