import { db } from '../lib/mockStore'
import type { UserRecord } from '../lib/mockData'
import type { User, Role } from '../types'

function strip(u: UserRecord): User {
  const { password: _pw, ...profile } = u
  return profile as User
}

export const employeeService = {
  async getAll(): Promise<User[]> {
    return db.users.getAll().map(strip).sort((a, b) => a.full_name.localeCompare(b.full_name))
  },

  async getByRole(role: Role): Promise<User[]> {
    return db.users.getAll().filter(u => u.role === role).map(strip)
      .sort((a, b) => a.full_name.localeCompare(b.full_name))
  },

  async getById(id: string): Promise<User | null> {
    const u = db.users.getAll().find(u => u.id === id)
    return u ? strip(u) : null
  },

  async create(payload: Omit<User, 'id'> & { password: string }): Promise<User> {
    const users = db.users.getAll()
    if (users.some(u => u.email.toLowerCase() === payload.email.toLowerCase())) {
      throw new Error('An account with that email already exists.')
    }
    const newUser: UserRecord = { id: `u-${crypto.randomUUID().slice(0, 8)}`, ...payload }
    db.users.save([...users, newUser])
    return strip(newUser)
  },

  async update(id: string, updates: Partial<Omit<User, 'id'> & { password?: string }>): Promise<User> {
    const users = db.users.getAll()
    const idx = users.findIndex(u => u.id === id)
    if (idx === -1) throw new Error('User not found.')
    users[idx] = { ...users[idx], ...updates }
    db.users.save(users)
    return strip(users[idx])
  },

  async delete(id: string): Promise<void> {
    db.users.save(db.users.getAll().filter(u => u.id !== id))
  },
}
