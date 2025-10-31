import { AuthPageLayout } from '../features/auth/components'
import { ForgotPasswordForm } from '../features/auth/forgot-password/ForgotPasswordForm'

/**
 * ForgotPassword Page
 * Orchestrates authentication layout and forgot password form
 */
export function ForgotPassword() {
  return (
    <AuthPageLayout backLink={{ to: '/login', label: 'Volver a Iniciar Sesión' }} showLogo>
      <ForgotPasswordForm />
    </AuthPageLayout>
  )
}
