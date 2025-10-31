import { AuthPageLayout } from '../features/auth/components'
import { ResetPasswordForm } from '../features/auth/reset-password/ResetPasswordForm'

/**
 * ResetPassword Page
 * Orchestrates authentication layout and reset password form
 */
export function ResetPassword() {
  return (
    <AuthPageLayout backLink={{ to: '/login', label: 'Volver a Iniciar Sesión' }} showLogo={false}>
      <ResetPasswordForm />
    </AuthPageLayout>
  )
}
