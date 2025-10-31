import { AuthPageLayout } from '../features/auth/components'
import { LoginForm } from '../features/auth/login/LoginForm'

/**
 * Login Page
 * Orchestrates authentication layout and login form
 */
export function Login() {
  return (
    <AuthPageLayout backLink={{ to: '/', label: 'Volver al Inicio' }} showLogo>
      <LoginForm />
    </AuthPageLayout>
  )
}
