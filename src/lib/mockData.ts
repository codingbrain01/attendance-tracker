import type { User, Shift, AttendanceLog } from '../types'
import { timeToMinutes, minutesToTime } from './timeUtils'

export type UserRecord = User & { password: string }

export const SEED_USERS: UserRecord[] = [
  { id: 'u-001', full_name: 'System Administrator', position: 'System Admin',       email: 'control@demo.com', role: 'main_control', password: 'Demo@1234' },
  { id: 'u-002', full_name: 'Maria Santos',          position: 'HR Manager',         email: 'admin@demo.com',   role: 'admin',        password: 'Demo@1234' },
  { id: 'u-003', full_name: 'James Reyes',            position: 'Operations Head',    email: 'hr@demo.com',      role: 'admin',        password: 'Demo@1234' },
  { id: 'u-004', full_name: 'Alice Cruz',             position: 'Software Developer', email: 'alice@demo.com',   role: 'employee',     password: 'Demo@1234' },
  { id: 'u-005', full_name: 'Bob Mendoza',            position: 'UI/UX Designer',     email: 'bob@demo.com',     role: 'employee',     password: 'Demo@1234' },
  { id: 'u-006', full_name: 'Carol Torres',           position: 'QA Engineer',        email: 'carol@demo.com',   role: 'employee',     password: 'Demo@1234' },
  { id: 'u-007', full_name: 'David Lim',              position: 'Backend Developer',  email: 'david@demo.com',   role: 'employee',     password: 'Demo@1234' },
  { id: 'u-008', full_name: 'Eva Ramos',              position: 'Project Manager',    email: 'eva@demo.com',     role: 'employee',     password: 'Demo@1234' },
]

function pastWeekdays(n: number): string[] {
  const dates: string[] = []
  const d = new Date()
  d.setDate(d.getDate() - 1)
  while (dates.length < n) {
    if (d.getDay() !== 0 && d.getDay() !== 6) dates.push(d.toISOString().split('T')[0])
    d.setDate(d.getDate() - 1)
  }
  return dates
}

function weekdaysInRange(offsetStart: number, offsetEnd: number): string[] {
  const dates: string[] = []
  for (let i = offsetStart; i <= offsetEnd; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    if (d.getDay() !== 0 && d.getDay() !== 6) dates.push(d.toISOString().split('T')[0])
  }
  return dates
}

const SHIFT_VARIANTS = [
  { shift_start: '08:00', shift_end: '17:00' },
  { shift_start: '09:00', shift_end: '18:00' },
  { shift_start: '08:00', shift_end: '17:00' },
  { shift_start: '08:00', shift_end: '17:00' },
  { shift_start: '09:00', shift_end: '18:00' },
]

export function generateSeedShifts(): Shift[] {
  const employees = SEED_USERS.filter(u => u.role === 'employee')
  const dates = weekdaysInRange(-21, 7)
  const shifts: Shift[] = []
  employees.forEach((emp, i) => {
    const v = SHIFT_VARIANTS[i % SHIFT_VARIANTS.length]
    dates.forEach(date => {
      shifts.push({ id: `s-${emp.id}-${date}`, employee_id: emp.id, date, ...v })
    })
  })
  return shifts
}

export function generateSeedAttendance(shifts: Shift[]): AttendanceLog[] {
  const employees = SEED_USERS.filter(u => u.role === 'employee')
  const days = pastWeekdays(14)
  const logs: AttendanceLog[] = []

  const latePattern     = [false, false, false, true,  false, false, false, true,  false, false, false, false, true,  false]
  const overtimePattern = [false, false, true,  false, false, true,  false, false, true,  false, false, false, false, true ]

  employees.forEach((emp, ei) => {
    const shift = shifts.find(s => s.employee_id === emp.id)
    const shiftStart = shift?.shift_start ?? '08:00'
    const shiftEnd   = shift?.shift_end   ?? '17:00'

    days.forEach((date, di) => {
      const isLate = latePattern[(ei + di) % latePattern.length]
      const hasOT  = overtimePattern[(ei * 2 + di) % overtimePattern.length]

      const timeInMin  = timeToMinutes(shiftStart) + (isLate ? 8 + di % 20 : -(di % 8))
      const timeOutMin = timeToMinutes(shiftEnd)   + (hasOT  ? 20 + di % 55 : -(di % 15))
      const overtimeMinutes = Math.max(0, timeOutMin - timeToMinutes(shiftEnd))
      const breakStartMin   = timeInMin + 180
      const breakEndMin     = breakStartMin + 60

      logs.push({
        id: `l-${emp.id}-${date}`,
        employee_id: emp.id,
        date,
        time_in:     minutesToTime(timeInMin)     + ':00',
        break_start: minutesToTime(breakStartMin) + ':00',
        break_end:   minutesToTime(breakEndMin)   + ':00',
        time_out:    minutesToTime(timeOutMin)    + ':00',
        is_late:     isLate,
        overtime_minutes: overtimeMinutes,
      })
    })
  })
  return logs
}

export const SEED_SHIFTS     = generateSeedShifts()
export const SEED_ATTENDANCE = generateSeedAttendance(SEED_SHIFTS)
