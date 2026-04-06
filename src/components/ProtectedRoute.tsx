import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()

  // Czekaj na auth i profil
  if (loading || (user && !profile)) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-bg-primary">
        <div className="w-8 h-8 border-2 border-accent-green border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (profile?.role !== 'therapist') {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-bg-primary">
        <div className="text-center space-y-4 px-6">
          <div className="text-[48px]">🔒</div>
          <h1 className="text-[22px] font-black text-white">Brak dostępu</h1>
          <p className="text-[14px] font-bold" style={{ color: '#5a6178' }}>
            Ta platforma jest dostępna tylko dla terapeutów MyWay.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
