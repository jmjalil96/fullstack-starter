import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'

import { Biblioteca } from './pages/Biblioteca'
import { CapstoneAI } from './pages/CapstoneAI'
import { CasosAbiertos } from './pages/casos/CasosAbiertos'
import { MisCasos } from './pages/casos/MisCasos'
import { NuevoCaso } from './pages/casos/NuevoCaso'
import { Afiliados } from './pages/clientes/Afiliados'
import { ClienteDetalle } from './pages/clientes/ClienteDetalle'
import { Clientes } from './pages/clientes/Clientes'
import { NuevaPoliza } from './pages/clientes/NuevaPoliza'
import { PolizaDetalle } from './pages/clientes/PolizaDetalle'
import { Polizas } from './pages/clientes/Polizas'
import { ComponentTest } from './pages/ComponentTest'
import { Dashboard } from './pages/Dashboard'
import { ForgotPassword } from './pages/ForgotPassword'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { Atencion } from './pages/reclamos/Atencion'
import { MisReclamos } from './pages/reclamos/MisReclamos'
import { NuevoReclamo } from './pages/reclamos/NuevoReclamo'
import { ReclamoDetalle } from './pages/reclamos/ReclamoDetalle'
import { ResetPassword } from './pages/ResetPassword'
import { Signup } from './pages/Signup'
import { ErrorBoundary } from './shared/components/ErrorBoundary'
import { MainLayout } from './shared/components/mainLayout'
import { ProtectedRoute } from './shared/components/ProtectedRoute'

/**
 * Router content wrapped with ErrorBoundary that resets on navigation
 */
function AppRoutes() {
  const location = useLocation()

  return (
    <ErrorBoundary resetKeys={[location.pathname]}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/test" element={<ComponentTest />} />

        {/* Protected Routes with MainLayout */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard */}
          <Route path="dashboard" element={<Dashboard />} />

          {/* Reclamos */}
          <Route path="reclamos/nuevo" element={<NuevoReclamo />} />
          <Route path="reclamos/mis-reclamos" element={<MisReclamos />} />
          <Route path="reclamos/atencion" element={<Atencion />} />
          <Route path="reclamos/:id" element={<ReclamoDetalle />} />

          {/* Clientes */}
          <Route path="clientes/lista" element={<Clientes />} />
          <Route path="clientes/:id" element={<ClienteDetalle />} />
          <Route path="clientes/polizas" element={<Polizas />} />
          <Route path="clientes/polizas/nueva" element={<NuevaPoliza />} />
          <Route path="clientes/polizas/:id" element={<PolizaDetalle />} />
          <Route path="clientes/afiliados" element={<Afiliados />} />

          {/* Casos (Centro de Resolución) */}
          <Route path="casos/nuevo" element={<NuevoCaso />} />
          <Route path="casos/mis-casos" element={<MisCasos />} />
          <Route path="casos/abiertos" element={<CasosAbiertos />} />

          {/* Other Pages */}
          <Route path="biblioteca" element={<Biblioteca />} />
          <Route path="capstone-ai" element={<CapstoneAI />} />

          {/* 404 - Redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  )
}

/**
 * App - Router configuration
 */
function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
