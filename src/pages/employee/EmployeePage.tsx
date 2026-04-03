import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getInitials } from '../../lib/timeUtils'
import { ProfileTab }    from './ProfileTab'
import { AttendanceTab } from './AttendanceTab'
import { DashboardTab }  from './DashboardTab'

type Tab = 'attendance' | 'dashboard' | 'profile'

const TABS: { key: Tab; label: string }[] = [
  { key: 'attendance', label: 'Attendance' },
  { key: 'dashboard',  label: 'Dashboard'  },
  { key: 'profile',    label: 'Profile'    },
]

export function EmployeePage() {
  const { user, signOut } = useAuth()
  const [tab, setTab] = useState<Tab>('attendance')

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Nav */}
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">AT</span>
            </div>
            <span className="text-white font-semibold text-sm tracking-tight hidden sm:block">AttendTrack</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center shrink-0">
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

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* Tab bar */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 mb-6 shadow-sm">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                tab === t.key
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'attendance' && <AttendanceTab />}
        {tab === 'dashboard'  && <DashboardTab  />}
        {tab === 'profile'    && <ProfileTab    />}
      </div>
    </div>
  )
}
