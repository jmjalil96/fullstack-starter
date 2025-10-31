import { AuthPageLayout } from '../features/auth/components'
import { SignupForm } from '../features/auth/signup/SignupForm'

/**
 * Signup Page
 * Orchestrates authentication layout and signup form
 */
export function Signup() {
  return (
    <AuthPageLayout backLink={{ to: '/', label: 'Volver al Inicio' }} showLogo>
      <SignupForm />
    </AuthPageLayout>
  )
}
