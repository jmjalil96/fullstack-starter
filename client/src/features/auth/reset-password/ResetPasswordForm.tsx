import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { Button } from '../../../shared/components/ui/Button'
import { useToast } from '../../../shared/hooks/useToast'
import { useAuthStore } from '../../../shared/store/authStore'
import { AuthErrorBanner } from '../components'

interface ResetPasswordFormData {
  password: string
  confirmPassword: string
}

/**
 * ResetPasswordForm - Password reset form with token validation
 * Features:
 * - Token validation from URL
 * - Invalid token error screen
 * - Password reset form with confirmation
 * - Password match validation
 */
export function ResetPasswordForm() {
  const navigate = useNavigate()
  const toast = useToast()
  const [searchParams] = useSearchParams()
  const { resetPassword, isAuthenticating, error, clearError } = useAuthStore()

  // Extract token from URL
  const token = searchParams.get('token')

  // UI state (not form data)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    mode: 'onBlur',
    defaultValues: { password: '', confirmPassword: '' },
  })

  // Watch form fields for auth error clearing and validation
  const passwordValue = watch('password')
  const confirmPasswordValue = watch('confirmPassword')
  const errorRef = useRef(error)

  /**
   * Validate token on mount
   */
  useEffect(() => {
    if (!token) {
      setTokenValid(false)
      toast.error('Enlace inválido')
    } else {
      setTokenValid(true)
    }
  }, [token, toast])

  // Keep error ref in sync
  useEffect(() => {
    errorRef.current = error
  }, [error])

  // Clear auth error when user types in any field
  useEffect(() => {
    if (errorRef.current) clearError()
  }, [passwordValue, confirmPasswordValue, clearError])

  /**
   * Handle form submission
   */
  const onSubmit = async (data: ResetPasswordFormData) => {
    // Don't trim passwords - whitespace can be valid

    if (!token) return

    try {
      await resetPassword(token, data.password)
      toast.success('Contraseña restablecida exitosamente')
      navigate('/login')
    } catch (error) {
      // Error already handled by store (sets error state, shows toast)
      console.error('Password reset failed:', error)
    }
  }

  // Consolidated loading state
  const isLoading = isAuthenticating || isSubmitting

  // Invalid token state
  if (tokenValid === false) {
    return (
      <div className="text-center">
        {/* Logo */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[var(--color-navy)]">Capstone360°</h2>
        </div>

        {/* Error Icon */}
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-[var(--color-navy)] mb-2">Enlace Inválido</h2>
        <p className="text-[var(--color-text-secondary)] mb-6">
          Este enlace de restablecimiento es inválido o ha expirado.
        </p>

        <div className="space-y-3">
          <Link to="/forgot-password">
            <Button variant="primary" className="w-full">
              Solicitar Nuevo Enlace
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="ghost" className="w-full">
              Volver a Iniciar Sesión
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Valid token - show reset form
  return (
    <>
      {/* Logo */}
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold text-[var(--color-navy)]">Capstone360°</h2>
      </div>

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[var(--color-navy)] mb-2">
          Restablecer Contraseña
        </h1>
        <p className="text-[var(--color-text-secondary)]">Ingresa tu nueva contraseña</p>
      </div>

      {/* Error Banner */}
      <AuthErrorBanner error={error} />

      {/* Reset Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* New Password Field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-[var(--color-navy)] mb-2">
            Nueva Contraseña
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
            aria-describedby={errors.password ? 'password-error password-helper' : 'password-helper'}
            className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-teal)] focus:border-transparent transition-colors disabled:bg-[var(--color-bg-secondary)] disabled:cursor-not-allowed"
          />
          {errors.password && (
            <p id="password-error" className="mt-1 text-xs text-red-600" role="alert">
              {errors.password.message}
            </p>
          )}
          <p id="password-helper" className="mt-1 text-xs text-[var(--color-text-light)]">
            Debe tener al menos 8 caracteres
          </p>
        </div>

        {/* Confirm Password Field */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-[var(--color-navy)] mb-2"
          >
            Confirmar Nueva Contraseña
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            {...register('confirmPassword', {
              required: 'Confirma tu contraseña',
              validate: (value) => value === passwordValue || 'Las contraseñas no coinciden',
            })}
            placeholder="Vuelve a ingresar tu contraseña"
            disabled={isLoading}
            aria-invalid={errors.confirmPassword ? 'true' : 'false'}
            aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
            className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-teal)] focus:border-transparent transition-colors disabled:bg-[var(--color-bg-secondary)] disabled:cursor-not-allowed"
          />
          {errors.confirmPassword && (
            <p id="confirm-password-error" className="mt-1 text-xs text-red-600" role="alert">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isLoading}
          loadingText="Restableciendo contraseña..."
          disabled={isLoading}
          className="w-full"
        >
          Restablecer Contraseña
        </Button>
      </form>
    </>
  )
}
