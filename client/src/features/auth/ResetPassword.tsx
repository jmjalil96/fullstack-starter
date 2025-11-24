import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { Button } from '../../shared/components/ui/forms/Button'
import { Input } from '../../shared/components/ui/forms/Input'
import { useAuthStore } from '../../store/authStore'

import { AuthLayout } from './AuthLayout'

interface ResetPasswordData {
  password: string
  confirmPassword: string
}

export function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const { resetPassword, isAuthenticating, error, clearError } = useAuthStore()
  const [isSuccess, setIsSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordData>({
    mode: 'onBlur',
    defaultValues: { password: '', confirmPassword: '' },
  })

  const formValues = watch()
  const password = watch('password')
  const errorRef = useRef(error)

  useEffect(() => {
    errorRef.current = error
  }, [error])

  useEffect(() => {
    if (errorRef.current) clearError()
  }, [formValues, clearError])

  const onSubmit = async (data: ResetPasswordData) => {
    if (!token) return

    try {
      // Don't trim password - whitespace can be valid
      await resetPassword(token, data.password)
      setIsSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch {
      // Error handled by store
    }
  }

  const isLoading = isAuthenticating || isSubmitting

  // Invalid token screen
  if (!token) {
    return (
      <AuthLayout
        title="Enlace Inválido"
        subtitle="No se encontró el token de recuperación."
        backLink={{ to: '/login', label: 'Volver al Inicio' }}
      >
        <div className="text-center py-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
            <svg
              className="h-8 w-8 text-red-600"
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
          <p className="text-sm text-gray-500 mb-8">
            Por favor solicita un nuevo enlace de recuperación.
          </p>
          <Button onClick={() => navigate('/forgot-password')} fullWidth>
            Solicitar Nuevo Enlace
          </Button>
        </div>
      </AuthLayout>
    )
  }

  // Success screen
  if (isSuccess) {
    return (
      <AuthLayout
        title="¡Contraseña Actualizada!"
        subtitle="Tu contraseña ha sido restablecida correctamente."
        backLink={{ to: '/login', label: 'Volver al Inicio' }}
      >
        <div className="text-center py-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm text-gray-500 mb-6">Redirigiendo al inicio de sesión...</p>
          <Button onClick={() => navigate('/login')} fullWidth>
            Ir a Iniciar Sesión
          </Button>
        </div>
      </AuthLayout>
    )
  }

  // Form screen
  return (
    <AuthLayout title="Nueva Contraseña" subtitle="Ingresa tu nueva contraseña segura.">
      {error && (
        <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Password Input */}
        <Input
          variant="light"
          label="Nueva Contraseña"
          type="password"
          placeholder="••••••••"
          error={errors.password}
          {...register('password', {
            required: 'Contraseña requerida',
            minLength: { value: 6, message: 'Mínimo 6 caracteres' },
          })}
        />

        {/* Confirm Password Input */}
        <Input
          variant="light"
          label="Confirmar Contraseña"
          type="password"
          placeholder="••••••••"
          error={errors.confirmPassword}
          {...register('confirmPassword', {
            required: 'Confirma tu contraseña',
            validate: (val) => val === password || 'Las contraseñas no coinciden',
          })}
        />

        <Button type="submit" isLoading={isLoading} fullWidth>
          Restablecer Contraseña
        </Button>
      </form>
    </AuthLayout>
  )
}
