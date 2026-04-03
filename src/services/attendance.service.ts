import { db } from '../lib/mockStore'
import { todayStr, nowTimeStr } from '../lib/timeUtils'
import type { AttendanceLog } from '../types'

const mut = (id: string, updates: Partial<AttendanceLog>): AttendanceLog => {
  const logs = db.attendance.getAll()
  const idx  = logs.findIndex(l => l.id === id)
  if (idx === -1) throw new Error('Log not found.')
  logs[idx] = { ...logs[idx], ...updates }
  db.attendance.save(logs)
  return logs[idx]
}

export const attendanceService = {
  async getAll(): Promise<AttendanceLog[]> {
    return db.attendance.getAll().sort((a, b) => b.date.localeCompare(a.date))
  },

  async getByEmployee(employeeId: string): Promise<AttendanceLog[]> {
    return db.attendance.getAll()
      .filter(l => l.employee_id === employeeId)
      .sort((a, b) => b.date.localeCompare(a.date))
  },

  async getToday(employeeId: string): Promise<AttendanceLog | null> {
    return db.attendance.getAll().find(l => l.employee_id === employeeId && l.date === todayStr()) ?? null
  },

  async timeIn(employeeId: string, isLate: boolean): Promise<AttendanceLog> {
    const log: AttendanceLog = {
      id: `l-${crypto.randomUUID().slice(0, 8)}`,
      employee_id: employeeId,
      date: todayStr(),
      time_in: nowTimeStr(),
      break_start: null,
      break_end: null,
      time_out: null,
      is_late: isLate,
      overtime_minutes: 0,
    }
    db.attendance.save([...db.attendance.getAll(), log])
    return log
  },

  async breakStart(logId: string): Promise<AttendanceLog> {
    return mut(logId, { break_start: nowTimeStr() })
  },

  async breakEnd(logId: string): Promise<AttendanceLog> {
    return mut(logId, { break_end: nowTimeStr() })
  },

  async timeOut(logId: string, overtimeMinutes: number): Promise<AttendanceLog> {
    return mut(logId, { time_out: nowTimeStr(), overtime_minutes: overtimeMinutes })
  },

  async update(id: string, updates: Partial<AttendanceLog>): Promise<AttendanceLog> {
    return mut(id, updates)
  },

  async delete(id: string): Promise<void> {
    db.attendance.save(db.attendance.getAll().filter(l => l.id !== id))
  },
}
