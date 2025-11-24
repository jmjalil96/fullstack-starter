import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '../../shared/components/ui/forms/Button'
import { Input } from '../../shared/components/ui/forms/Input'
import { useAuthStore } from '../../shared/store/authStore'

import { AuthLayout } from './AuthLayout'

interface ForgotPasswordData {
  email: string
}

export function ForgotPassword() {
  const { requestPasswordReset, isAuthenticating, error, clearError } = useAuthStore()
  const [isSuccess, setIsSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordData>({
    mode: 'onBlur',
    defaultValues: { email: '' },
  })

  const emailValue = watch('email')
  const errorRef = useRef(error)

  useEffect(() => {
    errorRef.current = error
  }, [error])

  useEffect(() => {
    if (errorRef.current) clearError()
  }, [emailValue, clearError])

  const onSubmit = async (data: ForgotPasswordData) => {
    try {
      await requestPasswordReset(data.email.trim())
      setIsSuccess(true)
    } catch {
      // Error handled by store
    }
  }

  const isLoading = isAuthenticating || isSubmitting

  // Success screen
  if (isSuccess) {
    return (
      <AuthLayout
        title="Revisa tu Correo"
        subtitle={`Hemos enviado instrucciones a ${emailValue}.`}
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
          <p className="text-sm text-gray-500 mb-8">
            Si no recibes el correo en unos minutos, revisa tu carpeta de spam.
          </p>
          <Button onClick={() => setIsSuccess(false)} variant="outline" fullWidth>
            Intentar con otro correo
          </Button>
        </div>
      </AuthLayout>
    )
  }

  // Form screen
  return (
    <AuthLayout
      title="Recuperar Contraseña"
      subtitle="Ingresa tu correo corporativo y te enviaremos las instrucciones."
      backLink={{ to: '/login', label: 'Volver al Inicio' }}
    >
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
        {/* Email Input */}
        <Input
          variant="light"
          label="Correo Corporativo"
          type="email"
          placeholder="nombre@empresa.com"
          error={errors.email}
          {...register('email', {
            required: 'El correo es requerido',
            pattern: { value: /^\S+@\S+$/i, message: 'Correo inválido' },
          })}
        />

        <Button type="submit" isLoading={isLoading} fullWidth>
          Enviar Instrucciones
        </Button>
      </form>
    </AuthLayout>
  )
}
