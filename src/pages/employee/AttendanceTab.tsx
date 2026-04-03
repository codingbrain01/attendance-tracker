import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { attendanceService } from '../../services/attendance.service'
import { shiftService } from '../../services/shift.service'
import type { AttendanceLog, Shift } from '../../types'
import { formatTime, formatDate, todayStr, nowTimeStr, timeToMinutes } from '../../lib/timeUtils'

type AttStatus = 'idle' | 'clocked_in' | 'on_break' | 'back_from_break' | 'done'

function getStatus(log: AttendanceLog | null): AttStatus {
  if (!log)                                return 'idle'
  if (log.time_out)                        return 'done'
  if (log.break_start && !log.break_end)   return 'on_break'
  if (log.break_end   && !log.time_out)    return 'back_from_break'
  return 'clocked_in'
}

const STEPS = ['Time In', 'Break Start', 'Break End', 'Time Out'] as const
type Step = typeof STEPS[number]

function stepValue(log: AttendanceLog | null, step: Step): string | null | undefined {
  if (!log) return undefined
  return { 'Time In': log.time_in, 'Break Start': log.break_start, 'Break End': log.break_end, 'Time Out': log.time_out }[step]
}

export function AttendanceTab() {
  const { user } = useAuth()
  const [log,     setLog]     = useState<AttendanceLog | null>(null)
  const [shift,   setShift]   = useState<Shift | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting,  setActing]  = useState(false)

  useEffect(() => {
    if (!user) return
    Promise.all([
      attendanceService.getToday(user.id),
      shiftService.getForDate(user.id, todayStr()),
    ]).then(([l, s]) => { setLog(l); setShift(s); setLoading(false) })
  }, [user])

  const act = async (fn: () => Promise<AttendanceLog>) => {
    setActing(true)
    try { setLog(await fn()) } finally { setActing(false) }
  }

  const handleTimeIn    = () => act(() => {
    const isLate = shift ? nowTimeStr().slice(0, 5) > shift.shift_start : false
    return attendanceService.timeIn(user!.id, isLate)
  })
  const handleBreakStart = () => act(() => attendanceService.breakStart(log!.id))
  const handleBreakEnd   = () => act(() => attendanceService.breakEnd(log!.id))
  const handleTimeOut    = () => act(() => {
    const ot = shift
      ? Math.max(0, timeToMinutes(nowTimeStr().slice(0, 5)) - timeToMinutes(shift.shift_end))
      : 0
    return attendanceService.timeOut(log!.id, ot)
  })

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const status = getStatus(log)

  // Step completion: 0=none, 1=time_in, 2=break_start, 3=break_end, 4=time_out
  const completedSteps = log
    ? [log.time_in, log.break_start, log.break_end, log.time_out].filter(Boolean).length
    : 0

  const statusConfig = {
    idle:            { label: 'Not clocked in',   color: 'text-slate-400',   bg: 'bg-slate-100'   },
    clocked_in:      { label: 'Currently working', color: 'text-emerald-700', bg: 'bg-emerald-100' },
    on_break:        { label: 'On break',          color: 'text-amber-700',   bg: 'bg-amber-100'   },
    back_from_break: { label: 'Currently working', color: 'text-emerald-700', bg: 'bg-emerald-100' },
    done:            { label: 'Completed',         color: 'text-indigo-700',  bg: 'bg-indigo-100'  },
  }[status]

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Today's Attendance</h2>
            <p className="text-xs text-slate-400 mt-0.5">{formatDate(todayStr())}</p>
          </div>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.color}`}>
            {statusConfig.label}
          </span>
        </div>

        <div className="px-6 py-5">
          {/* Shift info */}
          {shift ? (
            <div className="flex items-center gap-2 text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2 mb-5">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
              </svg>
              <span>Assigned shift: <strong>{shift.shift_start} – {shift.shift_end}</strong></span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 mb-5">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>No shift assigned — late and overtime will not be calculated.</span>
            </div>
          )}

          {/* Step tracker */}
          <div className="relative mb-6">
            {/* Progress line */}
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-200" />
            <div
              className="absolute top-4 left-4 h-0.5 bg-indigo-500 transition-all duration-500"
              style={{ width: completedSteps === 0 ? '0%' : `${(completedSteps / (STEPS.length - 1)) * (100 - (8 / (STEPS.length)))}%` }}
            />

            <div className="relative flex justify-between">
              {STEPS.map((step, i) => {
                const val = stepValue(log, step)
                const done = i < completedSteps
                const active = i === completedSteps && status !== 'done'
                return (
                  <div key={step} className="flex flex-col items-center gap-1.5" style={{ width: '25%' }}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors z-10 ${
                      done   ? 'bg-indigo-600 border-indigo-600 text-white' :
                      active ? 'bg-white border-indigo-500 text-indigo-500' :
                               'bg-white border-slate-300 text-slate-300'
                    }`}>
                      {done ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="text-xs font-bold">{i + 1}</span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-slate-600 text-center leading-tight">{step}</p>
                    <p className={`text-xs font-semibold ${done ? 'text-slate-900' : 'text-slate-300'}`}>
                      {val ? formatTime(val) : '—'}
                    </p>
                    {step === 'Time In' && log?.is_late && (
                      <span className="text-xs font-medium text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full">Late</span>
                    )}
                    {step === 'Time Out' && log && log.overtime_minutes > 0 && (
                      <span className="text-xs font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">+{log.overtime_minutes}m OT</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            {status === 'idle' && (
              <ActionBtn variant="primary" onClick={handleTimeIn} disabled={acting}>
                Clock In
              </ActionBtn>
            )}
            {status === 'clocked_in' && (<>
              <ActionBtn variant="secondary" onClick={handleBreakStart} disabled={acting}>
                Start Break
              </ActionBtn>
              <ActionBtn variant="danger" onClick={handleTimeOut} disabled={acting}>
                Clock Out
              </ActionBtn>
            </>)}
            {status === 'on_break' && (
              <ActionBtn variant="primary" onClick={handleBreakEnd} disabled={acting}>
                End Break
              </ActionBtn>
            )}
            {status === 'back_from_break' && (
              <ActionBtn variant="danger" onClick={handleTimeOut} disabled={acting}>
                Clock Out
              </ActionBtn>
            )}
            {status === 'done' && (
              <div className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium rounded-lg py-2.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Attendance logged for today
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ActionBtn({ variant, onClick, disabled, children }: {
  variant: 'primary' | 'secondary' | 'danger'
  onClick: () => void
  disabled: boolean
  children: React.ReactNode
}) {
  const cls = {
    primary:   'bg-indigo-600 hover:bg-indigo-700 text-white',
    secondary: 'bg-amber-500 hover:bg-amber-600 text-white',
    danger:    'bg-rose-500 hover:bg-rose-600 text-white',
  }[variant]
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 ${cls} font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 text-sm`}
    >
      {children}
    </button>
  )
}
