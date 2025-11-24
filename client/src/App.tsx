import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'

import { ComponentTest } from './dev/ComponentTest'
import { AffiliateDetail } from './features/affiliates/components/AffiliateDetail'
import { AffiliatesList } from './features/affiliates/components/AffiliatesList'
import { AiAssistant } from './features/ai/AiAssistant'
import { ForgotPassword } from './features/auth/ForgotPassword'
import { Login } from './features/auth/Login'
import { ResetPassword } from './features/auth/ResetPassword'
import { Signup } from './features/auth/Signup'
import { CreateCase } from './features/cases/CreateCase'
import { MyCases } from './features/cases/MyCases'
import { OpenCases } from './features/cases/OpenCases'
import { ClaimDetail } from './features/claims/components/ClaimDetail'
import { ClaimsList } from './features/claims/components/ClaimsList'
import { NewClaim } from './features/claims/components/NewClaim'
import { ClientDetail } from './features/clients/components/ClientDetail'
import { ClientsList } from './features/clients/components/ClientsList'
import { Dashboard } from './features/home/Dashboard'
import { Home } from './features/home/Home'
import { InvoiceDetail } from './features/invoices/components/InvoiceDetail'
import { InvoicesList } from './features/invoices/components/InvoicesList'
import { Library } from './features/library/Library'
import { PoliciesList } from './features/policies/components/PoliciesList'
import { PolicyDetail } from './features/policies/components/PolicyDetail'
import { QueryProvider } from './providers/QueryProvider'
import { ErrorBoundary } from './shared/components/ErrorBoundary'
import { MainLayout } from './shared/components/layout/templates/MainLayout'
import { ProtectedRoute } from './shared/components/ProtectedRoute'

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
            <Route path="casos/nuevo" element={<CreateCase />} />
            <Route path="casos/mis-casos" element={<MyCases />} />
            <Route path="casos/abiertos" element={<OpenCases />} />

            {/* Other Pages */}
            <Route path="biblioteca" element={<Library />} />
            <Route path="capstone-ai" element={<AiAssistant />} />

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
