import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'

import { ComponentTest } from './dev/ComponentTest'
import { AdminLayout, UsersPage } from './features/admin'
import { AffiliateDetail } from './features/affiliates/components/AffiliateDetail'
import { AffiliatesList } from './features/affiliates/components/AffiliatesList'
import { AgentDetail, AgentsList } from './features/agents'
import { AiAssistant } from './features/ai/AiAssistant'
import { AcceptInvite } from './features/auth/AcceptInvite'
import { ForgotPassword } from './features/auth/ForgotPassword'
import { Login } from './features/auth/Login'
import { ResetPassword } from './features/auth/ResetPassword'
import { Signup } from './features/auth/Signup'
import { ClaimDetail } from './features/claims/components/ClaimDetail'
import { ClaimsList } from './features/claims/components/ClaimsList'
import { NewClaim } from './features/claims/components/NewClaim'
import { ClientDetail } from './features/clients/components/ClientDetail'
import { ClientsList } from './features/clients/components/ClientsList'
import { EmployeeDetail, EmployeesList } from './features/employees'
import { Dashboard } from './features/home/Dashboard'
import { Home } from './features/home/Home'
import { InsurerDetail } from './features/insurers/components/InsurerDetail'
import { InsurersList } from './features/insurers/components/InsurersList'
import { InvoiceDetail } from './features/invoices/components/InvoiceDetail'
import { InvoicesList } from './features/invoices/components/InvoicesList'
import { Library } from './features/library/Library'
import { PoliciesList } from './features/policies/components/PoliciesList'
import { PolicyDetail } from './features/policies/components/PolicyDetail'
import { TicketDetail } from './features/tickets/components/TicketDetail'
import { TicketsList } from './features/tickets/components/TicketsList'
import { QueryProvider } from './providers/QueryProvider'
import { ErrorBoundary } from './shared/components/ErrorBoundary'
import { GuestRoute } from './shared/components/GuestRoute'
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

          {/* Auth Routes - redirect to dashboard if already logged in */}
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/signup" element={<GuestRoute><Signup /></GuestRoute>} />
          <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
          <Route path="/reset-password" element={<GuestRoute><ResetPassword /></GuestRoute>} />
          {/* Invitation route - accessible regardless of auth state */}
          <Route path="/invite/:token" element={<AcceptInvite />} />

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
            <Route path="casos/mis-casos" element={<TicketsList />} />
            <Route path="casos/abiertos" element={<TicketsList />} />
            <Route path="casos/:id" element={<TicketDetail />} />

            {/* Other Pages */}
            <Route path="biblioteca" element={<Library />} />
            <Route path="capstone-ai" element={<AiAssistant />} />

            {/* 404 - Redirect to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* Admin Panel - Separate layout, still protected */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="aseguradoras" replace />} />
            <Route path="aseguradoras" element={<InsurersList />} />
            <Route path="aseguradoras/:id" element={<InsurerDetail />} />
            <Route path="empleados" element={<EmployeesList />} />
            <Route path="empleados/:id" element={<EmployeeDetail />} />
            <Route path="agentes" element={<AgentsList />} />
            <Route path="agentes/:id" element={<AgentDetail />} />
            <Route path="usuarios" element={<UsersPage />} />
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
