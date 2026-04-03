export type Role = 'main_control' | 'admin' | 'employee'

/** Mirrors the `users` table in Supabase. `id` is the auth.users UUID. */
export interface User {
  id: string
  full_name: string
  position: string
  email: string
  role: Role
}

/** Mirrors the `shifts` table. Times are stored as 'HH:MM' strings. */
export interface Shift {
  id: string
  employee_id: string
  date: string        // 'YYYY-MM-DD'
  shift_start: string // 'HH:MM'
  shift_end: string   // 'HH:MM'
}

/** Mirrors the `attendance_logs` table. Times are 'HH:MM:SS' strings. */
export interface AttendanceLog {
  id: string
  employee_id: string
  date: string             // 'YYYY-MM-DD'
  time_in: string | null   // 'HH:MM:SS'
  break_start: string | null
  break_end: string | null
  time_out: string | null
  is_late: boolean
  overtime_minutes: number
}

export const ROLE_ROUTES: Record<Role, string> = {
  main_control: '/main-control',
  admin: '/admin',
  employee: '/employee',
}
