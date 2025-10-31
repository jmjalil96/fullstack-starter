import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '../../../shared/components/ui/Button'
import { useAuthStore } from '../../../shared/store/authStore'
import { AuthErrorBanner } from '../components'

interface LoginFormData {
  email: string
  password: string
}

/**
 * LoginForm - Login form with state management
 * Features:
 * - Email + password fields
 * - Form validation
 * - Error handling
 * - Loading states
 * - Links to forgot password and signup
 */
export function LoginForm() {
  const navigate = useNavigate()
  const { signIn, isAuthenticating, error, clearError } = useAuthStore()

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    mode: 'onBlur',
    defaultValues: { email: '', password: '' },
  })

  // Watch form fields for auth error clearing
  const emailValue = watch('email')
  const passwordValue = watch('password')
  const errorRef = useRef(error)

  // Keep error ref in sync
  useEffect(() => {
    errorRef.current = error
  }, [error])

  // Clear auth error when user types in any field
  useEffect(() => {
    if (errorRef.current) clearError()
  }, [emailValue, passwordValue, clearError])

  /**
   * Handle form submission
   */
  const onSubmit = async (data: LoginFormData) => {
    const trimmedEmail = data.email.trim()
    // Don't trim password - whitespace can be valid

    try {
      await signIn(trimmedEmail, data.password)
      navigate('/dashboard')
    } catch (error) {
      // Error already handled by store (sets error state, shows toast)
      console.error('Login failed:', error)
    }
  }

  // Consolidated loading state
  const isLoading = isAuthenticating || isSubmitting

  return (
    <>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[var(--color-navy)] mb-2">Bienvenido</h1>
        <p className="text-[var(--color-text-secondary)]">Inicia sesión en Capstone360°</p>
      </div>

      {/* Error Banner */}
      <AuthErrorBanner error={error} />

      {/* Login Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[var(--color-navy)] mb-2">
            Correo Electrónico
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email', {
              required: 'El correo es requerido',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Correo electrónico inválido',
              },
            })}
            placeholder="correo@ejemplo.com"
            disabled={isLoading}
            aria-invalid={errors.email ? 'true' : 'false'}
            aria-describedby={errors.email ? 'email-error' : undefined}
            className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-teal)] focus:border-transparent transition-colors disabled:bg-[var(--color-bg-secondary)] disabled:cursor-not-allowed"
          />
          {errors.email && (
            <p id="email-error" className="mt-1 text-xs text-red-600" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="password" className="block text-sm font-medium text-[var(--color-navy)]">
              Contraseña
            </label>
            {/* Forgot Password Link */}
            <Link
              to="/forgot-password"
              className="text-sm text-[var(--color-teal)] hover:text-[var(--color-secondary-hover)] transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register('password', {
              required: 'La contraseña es requerida',
            })}
            placeholder="Ingresa tu contraseña"
            disabled={isLoading}
            aria-invalid={errors.password ? 'true' : 'false'}
            aria-describedby={errors.password ? 'password-error' : undefined}
            className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-teal)] focus:border-transparent transition-colors disabled:bg-[var(--color-bg-secondary)] disabled:cursor-not-allowed"
          />
          {errors.password && (
            <p id="password-error" className="mt-1 text-xs text-red-600" role="alert">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isLoading}
          loadingText="Iniciando sesión..."
          disabled={isLoading}
          className="w-full"
        >
          Iniciar Sesión
        </Button>
      </form>

      {/* Sign Up Link */}
      <div className="mt-6 text-center">
        <p className="text-sm text-[var(--color-text-secondary)]">
          ¿No tienes una cuenta?{' '}
          <Link
            to="/signup"
            className="text-[var(--color-teal)] hover:text-[var(--color-secondary-hover)] font-medium transition-colors"
          >
            Regístrate
          </Link>
        </p>
      </div>
    </>
  )
}
