import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getInitials } from '../../lib/timeUtils'
import { DashboardTab } from './DashboardTab'
import { AccountsTab }  from './AccountsTab'

type Tab = 'dashboard' | 'accounts'

export function AdminPage() {
  const { user, signOut } = useAuth()
  const [tab, setTab] = useState<Tab>('dashboard')

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Nav */}
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold">AT</span>
              </div>
              <span className="text-white font-semibold text-sm tracking-tight hidden sm:block">AttendTrack</span>
            </div>
            <span className="hidden sm:block text-slate-700 select-none">|</span>
            <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-semibold">{getInitials(user?.full_name ?? '')}</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-white text-sm font-medium leading-none">{user?.full_name}</p>
                <p className="text-slate-400 text-xs mt-0.5">{user?.position}</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="text-slate-400 hover:text-white text-xs font-medium transition-colors border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-lg"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 mb-6 shadow-sm max-w-xs">
          {(['dashboard', 'accounts'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg capitalize transition-colors ${
                tab === t
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'dashboard' && <DashboardTab />}
        {tab === 'accounts'  && <AccountsTab  />}
      </div>
    </div>
  )
}
