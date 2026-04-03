import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { attendanceService } from '../../services/attendance.service'
import type { AttendanceLog } from '../../types'
import {
  calcHoursWorked, formatHours, formatTime, todayStr, getWeekStart, getMonthStart,
} from '../../lib/timeUtils'

interface Stats {
  hoursToday: number
  hoursWeek:  number
  hoursMonth: number
  overtimeH:  number
  lateCount:  number
}

export function DashboardTab() {
  const { user } = useAuth()
  const [stats,   setStats]   = useState<Stats | null>(null)
  const [logs,    setLogs]    = useState<AttendanceLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    attendanceService.getByEmployee(user.id).then(all => {
      const today      = todayStr()
      const weekStart  = getWeekStart()
      const monthStart = getMonthStart()
      const todayLog   = all.find(l => l.date === today)
      const weekLogs   = all.filter(l => l.date >= weekStart  && l.date <= today)
      const monthLogs  = all.filter(l => l.date >= monthStart && l.date <= today)
      const hrs        = (l: AttendanceLog) => calcHoursWorked(l.time_in, l.time_out, l.break_start, l.break_end)
      setStats({
        hoursToday: todayLog ? hrs(todayLog) : 0,
        hoursWeek:  weekLogs.reduce((s, l) => s + hrs(l), 0),
        hoursMonth: monthLogs.reduce((s, l) => s + hrs(l), 0),
        overtimeH:  monthLogs.reduce((s, l) => s + l.overtime_minutes, 0) / 60,
        lateCount:  monthLogs.filter(l => l.is_late).length,
      })
      setLogs(all.slice(0, 14))
      setLoading(false)
    })
  }, [user])

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!stats) return null

  const statCards = [
    { label: 'Today',        sublabel: 'Hours worked',    value: formatHours(stats.hoursToday), color: 'text-indigo-600',  indicator: 'bg-indigo-500' },
    { label: 'This Week',    sublabel: 'Hours worked',    value: formatHours(stats.hoursWeek),  color: 'text-slate-900',   indicator: 'bg-emerald-500' },
    { label: 'This Month',   sublabel: 'Hours worked',    value: formatHours(stats.hoursMonth), color: 'text-slate-900',   indicator: 'bg-slate-400' },
    { label: 'Overtime',     sublabel: 'Month total',     value: formatHours(stats.overtimeH),  color: 'text-amber-600',   indicator: 'bg-amber-400' },
    { label: 'Late Days',    sublabel: 'This month',      value: String(stats.lateCount),       color: 'text-rose-600',    indicator: 'bg-rose-400' },
  ]

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {statCards.map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className={`w-2 h-2 rounded-full ${c.indicator} mb-3`} />
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
            <p className="text-xs font-semibold text-slate-700 mt-0.5">{c.label}</p>
            <p className="text-xs text-slate-400">{c.sublabel}</p>
          </div>
        ))}
      </div>

      {/* History table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">Recent Attendance</h3>
          <p className="text-xs text-slate-400 mt-0.5">Last 14 working days</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Date', 'Time In', 'Time Out', 'Hours', 'Status'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map(l => {
                const worked = calcHoursWorked(l.time_in, l.time_out, l.break_start, l.break_end)
                return (
                  <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 text-sm text-slate-600">{l.date}</td>
                    <td className="px-5 py-3 text-sm font-medium text-slate-900">{formatTime(l.time_in)}</td>
                    <td className="px-5 py-3 text-sm font-medium text-slate-900">{formatTime(l.time_out)}</td>
                    <td className="px-5 py-3 text-sm text-slate-700">{formatHours(worked)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        {l.is_late && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700">Late</span>
                        )}
                        {l.overtime_minutes > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">+{l.overtime_minutes}m OT</span>
                        )}
                        {!l.is_late && l.overtime_minutes === 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">On time</span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-400">No attendance records yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
