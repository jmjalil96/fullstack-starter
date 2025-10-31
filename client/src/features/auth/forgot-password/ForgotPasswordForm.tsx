import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'

import { Button } from '../../../shared/components/ui/Button'
import { useAuthStore } from '../../../shared/store/authStore'
import { AuthErrorBanner } from '../components'

interface ForgotPasswordFormData {
  email: string
}

/**
 * ForgotPasswordForm - Password reset request form with success state
 * Features:
 * - Email input form
 * - Success confirmation screen
 * - Two-state UI (form or success)
 */
export function ForgotPasswordForm() {
  const { requestPasswordReset, isAuthenticating, error, clearError } = useAuthStore()

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    mode: 'onBlur',
    defaultValues: { email: '' },
  })

  // UI state (not form data)
  const [emailSent, setEmailSent] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')

  // Watch form field for auth error clearing
  const emailValue = watch('email')
  const errorRef = useRef(error)

  // Keep error ref in sync
  useEffect(() => {
    errorRef.current = error
  }, [error])

  // Clear auth error when user types
  useEffect(() => {
    if (errorRef.current) clearError()
  }, [emailValue, clearError])

  /**
   * Handle form submission
   */
  const onSubmit = async (data: ForgotPasswordFormData) => {
    const trimmedEmail = data.email.trim()

    try {
      await requestPasswordReset(trimmedEmail)

      // Success! Store email and show success state
      setSubmittedEmail(trimmedEmail)
      setEmailSent(true)
    } catch (error) {
      // Error already handled by store (sets error state, shows toast)
      console.error('Password reset request failed:', error)
    }
  }

  // Consolidated loading state
  const isLoading = isAuthenticating || isSubmitting

  return (
    <>
      {!emailSent ? (
        <>
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[var(--color-navy)] mb-2">
              ¿Olvidaste tu Contraseña?
            </h1>
            <p className="text-[var(--color-text-secondary)]">
              Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu
              contraseña
            </p>
          </div>

          {/* Error Banner */}
          <AuthErrorBanner error={error} />

          {/* Form */}
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

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isLoading}
              loadingText="Enviando..."
              disabled={isLoading}
              className="w-full"
            >
              Enviar Enlace
            </Button>
          </form>
        </>
      ) : (
        <>
          {/* Success State */}
          <div className="text-center">
            {/* Success Icon */}
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            {/* Success Message */}
            <h2 className="text-2xl font-bold text-[var(--color-navy)] mb-2">Revisa tu Correo</h2>
            <p className="text-[var(--color-text-secondary)] mb-4">
              Enviamos un enlace de restablecimiento a{' '}
              <strong className="text-[var(--color-navy)]">{submittedEmail}</strong>
            </p>
            <p className="text-sm text-[var(--color-text-light)] mb-6">
              Haz clic en el enlace del correo para restablecer tu contraseña. El enlace expirará
              en 1 hora.
            </p>

            {/* Instructions */}
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-teal-800 font-medium mb-2">Próximos pasos:</p>
              <ol className="text-sm text-teal-700 space-y-1 list-decimal list-inside">
                <li>Revisa tu bandeja de entrada</li>
                <li>Haz clic en el enlace del correo</li>
                <li>Ingresa tu nueva contraseña</li>
              </ol>
            </div>

            {/* Back to Sign In */}
            <Link to="/login">
              <Button variant="ghost" className="w-full">
                Volver a Iniciar Sesión
              </Button>
            </Link>
          </div>
        </>
      )}
    </>
  )
}
