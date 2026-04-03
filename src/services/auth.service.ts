import { db } from '../lib/mockStore'
import type { User } from '../types'

export const authService = {
  async signIn(email: string, password: string): Promise<User> {
    await new Promise(r => setTimeout(r, 300)) // simulate network latency
    const user = db.users.getAll().find(u => u.email.toLowerCase() === email.toLowerCase())
    if (!user || user.password !== password) throw new Error('Invalid email or password.')
    const { password: _pw, ...profile } = user
    db.session.set(user.id)
    return profile as User
  },

  async signOut(): Promise<void> {
    db.session.clear()
  },

  async getProfile(userId: string): Promise<User | null> {
    const user = db.users.getAll().find(u => u.id === userId)
    if (!user) return null
    const { password: _pw, ...profile } = user
    return profile as User
  },

  getCurrentUserId(): string | null {
    return db.session.get()
  },
}
