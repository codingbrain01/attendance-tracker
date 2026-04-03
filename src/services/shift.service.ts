import { db } from '../lib/mockStore'
import type { Shift } from '../types'

export const shiftService = {
  async getAll(): Promise<Shift[]> {
    return db.shifts.getAll().sort((a, b) => b.date.localeCompare(a.date))
  },

  async getByEmployee(employeeId: string): Promise<Shift[]> {
    return db.shifts.getAll()
      .filter(s => s.employee_id === employeeId)
      .sort((a, b) => b.date.localeCompare(a.date))
  },

  async getForDate(employeeId: string, date: string): Promise<Shift | null> {
    return db.shifts.getAll().find(s => s.employee_id === employeeId && s.date === date) ?? null
  },

  async create(shift: Omit<Shift, 'id'>): Promise<Shift> {
    const newShift: Shift = { id: `s-${crypto.randomUUID().slice(0, 8)}`, ...shift }
    db.shifts.save([...db.shifts.getAll(), newShift])
    return newShift
  },

  async update(id: string, updates: Partial<Omit<Shift, 'id'>>): Promise<Shift> {
    const shifts = db.shifts.getAll()
    const idx = shifts.findIndex(s => s.id === id)
    if (idx === -1) throw new Error('Shift not found.')
    shifts[idx] = { ...shifts[idx], ...updates }
    db.shifts.save(shifts)
    return shifts[idx]
  },

  async delete(id: string): Promise<void> {
    db.shifts.save(db.shifts.getAll().filter(s => s.id !== id))
  },
}
