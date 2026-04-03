import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import type { Role } from '../types'
import { ROLE_ROUTES } from '../types'

interface Props {
  children: React.ReactNode
  allowedRoles: Role[]
}

export function ProtectedRoute({ children, allowedRoles }: Props) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Loading...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(user.role)) {
    // User is authenticated but wrong role — send them to their own page
    return <Navigate to={ROLE_ROUTES[user.role]} replace />
  }

  return <>{children}</>
}
