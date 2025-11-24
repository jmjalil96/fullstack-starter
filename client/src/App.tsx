import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'

import { AffiliateDetail } from './features/affiliates/AffiliateDetail'
import { AffiliatesList } from './features/affiliates/AffiliatesList'
import { ForgotPassword } from './features/auth/ForgotPassword'
import { Login } from './features/auth/Login'
import { ResetPassword } from './features/auth/ResetPassword'
import { Signup } from './features/auth/Signup'
import { ClaimDetail } from './features/claims/ClaimDetail'
import { ClaimsList } from './features/claims/ClaimsList'
import { NewClaim } from './features/claims/NewClaim'
import { ClientDetail } from './features/clients/ClientDetail'
import { ClientsList } from './features/clients/ClientsList'
import { InvoiceDetail } from './features/invoices/InvoiceDetail'
import { InvoicesList } from './features/invoices/InvoicesList'
import { PoliciesList } from './features/policies/PoliciesList'
import { PolicyDetail } from './features/policies/PolicyDetail'
import { Biblioteca } from './pages/Biblioteca'
import { CapstoneAI } from './pages/CapstoneAI'
import { CasosAbiertos } from './pages/casos/CasosAbiertos'
import { MisCasos } from './pages/casos/MisCasos'
import { NuevoCaso } from './pages/casos/NuevoCaso'
import { ComponentTest } from './pages/ComponentTest'
import { Dashboard } from './pages/Dashboard'
import { Home } from './pages/Home'
import { ErrorBoundary } from './shared/components/ErrorBoundary'
import { MainLayout } from './shared/components/layout/templates/MainLayout'
import { ProtectedRoute } from './shared/components/ProtectedRoute'
import { QueryProvider } from './shared/providers/QueryProvider'

/**
 * Router content wrapped with ErrorBoundary that resets on navigation
 */
function AppRoutes() {
  const location = useLocation()

  return (
    <QueryProvider>
      <ErrorBoundary resetKeys={[location.pathname]}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/test" element={<ComponentTest />} />

          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected Routes */}
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
            <Route path="reclamos" element={<ClaimsList />} />
            <Route path="reclamos/nuevo" element={<NewClaim />} />
            <Route path="reclamos/:id" element={<ClaimDetail />} />

            {/* Clientes */}
            <Route path="clientes" element={<ClientsList />} />
            <Route path="clientes/:id" element={<ClientDetail />} />

            {/* Polizas */}
            <Route path="polizas" element={<PoliciesList />} />
            <Route path="polizas/:id" element={<PolicyDetail />} />

            {/* Afiliados */}
            <Route path="afiliados" element={<AffiliatesList />} />
            <Route path="afiliados/:id" element={<AffiliateDetail />} />

            {/* Facturas */}
            <Route path="facturas" element={<InvoicesList />} />
            <Route path="facturas/:id" element={<InvoiceDetail />} />

            {/* Backwards compatibility redirects */}
            <Route path="clientes/lista" element={<Navigate to="/clientes" replace />} />
            <Route path="clientes/polizas/*" element={<Navigate to="/polizas" replace />} />
            <Route path="clientes/afiliados/*" element={<Navigate to="/afiliados" replace />} />
            <Route path="clientes/facturas/*" element={<Navigate to="/facturas" replace />} />

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
    </QueryProvider>
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
