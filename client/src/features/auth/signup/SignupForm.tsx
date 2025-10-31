import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '../../../shared/components/ui/Button'
import { useAuthStore } from '../../../shared/store/authStore'
import { AuthErrorBanner } from '../components'

interface SignupFormData {
  name: string
  email: string
  password: string
}

/**
 * SignupForm - Signup form with state management
 * Features:
 * - Name, email, and password fields
 * - Form validation
 * - Error handling
 * - Loading states
 * - Link to login
 */
export function SignupForm() {
  const navigate = useNavigate()
  const { signUp, isAuthenticating, error, clearError } = useAuthStore()

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    mode: 'onBlur',
    defaultValues: { name: '', email: '', password: '' },
  })

  // Watch form fields for auth error clearing
  const nameValue = watch('name')
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
  }, [nameValue, emailValue, passwordValue, clearError])

  /**
   * Handle form submission
   */
  const onSubmit = async (data: SignupFormData) => {
    const trimmedName = data.name.trim()
    const trimmedEmail = data.email.trim()
    // Don't trim password - whitespace can be valid

    try {
      await signUp(trimmedName, trimmedEmail, data.password)
      navigate('/dashboard')
    } catch (error) {
      // Error already handled by store (sets error state, shows toast)
      console.error('Signup failed:', error)
    }
  }

  // Consolidated loading state
  const isLoading = isAuthenticating || isSubmitting

  return (
    <>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[var(--color-navy)] mb-2">Crear Cuenta</h1>
        <p className="text-[var(--color-text-secondary)]">Únete a Capstone360°</p>
      </div>

      {/* Error Banner */}
      <AuthErrorBanner error={error} />

      {/* Signup Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-[var(--color-navy)] mb-2">
            Nombre Completo
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            {...register('name', {
              required: 'El nombre es requerido',
              minLength: {
                value: 2,
                message: 'El nombre debe tener al menos 2 caracteres',
              },
            })}
            placeholder="Juan Pérez"
            disabled={isLoading}
            aria-invalid={errors.name ? 'true' : 'false'}
            aria-describedby={errors.name ? 'name-error' : undefined}
            className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-teal)] focus:border-transparent transition-colors disabled:bg-[var(--color-bg-secondary)] disabled:cursor-not-allowed"
          />
          {errors.name && (
            <p id="name-error" className="mt-1 text-xs text-red-600" role="alert">
              {errors.name.message}
            </p>
          )}
        </div>

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
          <label htmlFor="password" className="block text-sm font-medium text-[var(--color-navy)] mb-2">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register('password', {
              required: 'La contraseña es requerida',
              minLength: {
                value: 8,
                message: 'La contraseña debe tener al menos 8 caracteres',
              },
            })}
            placeholder="Mínimo 8 caracteres"
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
          <p className="mt-1 text-xs text-[var(--color-text-light)]">
            Debe tener al menos 8 caracteres
          </p>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isLoading}
          loadingText="Creando cuenta..."
          disabled={isLoading}
          className="w-full"
        >
          Crear Cuenta
        </Button>
      </form>

      {/* Sign In Link */}
      <div className="mt-6 text-center">
        <p className="text-sm text-[var(--color-text-secondary)]">
          ¿Ya tienes una cuenta?{' '}
          <Link
            to="/login"
            className="text-[var(--color-teal)] hover:text-[var(--color-secondary-hover)] font-medium transition-colors"
          >
            Inicia sesión
          </Link>
        </p>
      </div>
    </>
  )
}
