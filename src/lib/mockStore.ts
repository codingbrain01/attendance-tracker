import type { Shift, AttendanceLog } from '../types'
import { type UserRecord, SEED_USERS, SEED_SHIFTS, SEED_ATTENDANCE } from './mockData'

const K = {
  users:      'at_users',
  shifts:     'at_shifts',
  attendance: 'at_attendance',
  session:    'at_session',
}

function load<T>(key: string, seed: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) { localStorage.setItem(key, JSON.stringify(seed)); return seed }
    return JSON.parse(raw) as T
  } catch {
    return seed
  }
}

function save<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data))
}

export const db = {
  users: {
    getAll:  (): UserRecord[] => load(K.users, SEED_USERS),
    save:    (v: UserRecord[]) => save(K.users, v),
  },
  shifts: {
    getAll:  (): Shift[] => load(K.shifts, SEED_SHIFTS),
    save:    (v: Shift[]) => save(K.shifts, v),
  },
  attendance: {
    getAll:  (): AttendanceLog[] => load(K.attendance, SEED_ATTENDANCE),
    save:    (v: AttendanceLog[]) => save(K.attendance, v),
  },
  session: {
    get:    (): string | null => localStorage.getItem(K.session),
    set:    (id: string)      => localStorage.setItem(K.session, id),
    clear:  ()                => localStorage.removeItem(K.session),
  },
}

/** Wipes all app data from localStorage and reloads with fresh seed data. */
export function resetDemoData(): void {
  Object.values(K).forEach(k => localStorage.removeItem(k))
}
