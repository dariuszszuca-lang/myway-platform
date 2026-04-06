import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import ProtectedRoute from './components/ProtectedRoute'
import PlatformLayout from './components/PlatformLayout'
import Login from './pages/Login'
import Register from './pages/Register'
import PlatformDashboard from './pages/platform/PlatformDashboard'
import PlatformPatients from './pages/platform/PlatformPatients'
import PlatformMaterials from './pages/platform/PlatformMaterials'
import PlatformSessions from './pages/platform/PlatformSessions'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Platform — terapeuta (desktop) */}
          <Route
            element={
              <ProtectedRoute>
                <PlatformLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<PlatformDashboard />} />
            <Route path="/pacjenci" element={<PlatformPatients />} />
            <Route path="/materialy" element={<PlatformMaterials />} />
            <Route path="/sesje" element={<PlatformSessions />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
