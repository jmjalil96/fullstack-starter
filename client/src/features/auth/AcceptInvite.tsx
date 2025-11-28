/**
 * Accept Invite Page
 * Public page for users to accept invitations and create their accounts
 */

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { Button } from '../../shared/components/ui/forms/Button'
import { Input } from '../../shared/components/ui/forms/Input'
import { useAuthStore } from '../../store/authStore'
import { useAcceptInvitation } from '../admin/users/hooks/useInvitationMutations'
import { useValidateInvitation } from '../admin/users/hooks/useInvitations'

import { AuthLayout } from './AuthLayout'

interface SignupFormData {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export function AcceptInvite() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { signUp, isAuthenticating, error: authError, clearError } = useAuthStore()
  const acceptMutation = useAcceptInvitation()
  const [step, setStep] = useState<'loading' | 'signup' | 'accepting' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Validate invitation token
  const { data: validation, isLoading: isValidating, isError } = useValidateInvitation(token || '')

  // Set step based on validation result
  useEffect(() => {
    if (isValidating) {
      setStep('loading')
      return
    }

    if (isError || !validation) {
      setStep('error')
      setErrorMessage('No se pudo validar la invitación. Intente de nuevo más tarde.')
      return
    }

    if (!validation.valid) {
      setStep('error')
      setErrorMessage(validation.reason || 'La invitación no es válida.')
      return
    }

    setStep('signup')
  }, [validation, isValidating, isError])

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    mode: 'onBlur',
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  })

  // Pre-fill form with invitation data (using reset per codebase pattern)
  useEffect(() => {
    if (validation?.valid) {
      reset({
        email: validation.email || '',
        name: validation.name || '',
        password: '',
        confirmPassword: '',
      })
    }
  }, [validation, reset])

  // Clear errors on type
  const formValues = watch()
  const errorRef = useRef(authError)

  useEffect(() => {
    errorRef.current = authError
  }, [authError])

  useEffect(() => {
    if (errorRef.current) clearError()
  }, [formValues, clearError])

  const onSubmit = async (data: SignupFormData) => {
    if (!token) return

    try {
      setStep('accepting')

      // Step 1: Create the user account
      await signUp(data.name, data.email, data.password)

      // Step 2: Accept the invitation (this links the user to the entity)
      await acceptMutation.mutateAsync(token)

      // Step 3: Redirect to dashboard
      navigate('/dashboard')
    } catch (error) {
      setStep('signup')
      console.error('Accept invitation failed:', error)
    }
  }

  const isLoading = isAuthenticating || isSubmitting || step === 'accepting'
  const password = watch('password')

  // Loading state
  if (step === 'loading') {
    return (
      <AuthLayout
        title="Validando Invitación"
        subtitle="Por favor espere mientras verificamos su invitación..."
      >
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-navy)]" />
          <p className="mt-4 text-gray-500 text-sm">Verificando...</p>
        </div>
      </AuthLayout>
    )
  }

  // Error state
  if (step === 'error') {
    return (
      <AuthLayout
        title="Invitación Inválida"
        subtitle="No pudimos procesar su invitación."
        backLink={{ to: '/login', label: 'Ir a Iniciar Sesión' }}
      >
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <p className="text-gray-600 mb-6">{errorMessage}</p>
          <p className="text-sm text-gray-400">
            Si cree que esto es un error, contacte al administrador que le envió la invitación.
          </p>
        </div>
      </AuthLayout>
    )
  }

  // Get invitation type label
  const typeLabels: Record<string, string> = {
    EMPLOYEE: 'Empleado',
    AGENT: 'Agente',
    AFFILIATE: 'Afiliado',
  }
  const invitationType = validation?.type ? typeLabels[validation.type] || validation.type : ''

  return (
    <AuthLayout
      title="Aceptar Invitación"
      subtitle={`Has sido invitado como ${invitationType}. Completa tu registro para comenzar.`}
      backLink={{ to: '/login', label: 'Ya tengo cuenta' }}
    >
      {(authError || acceptMutation.error) && (
        <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {authError || 'Error al aceptar la invitación. Intente de nuevo.'}
        </div>
      )}

      {/* Invitation Info Badge */}
      <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-blue-800">Invitación para: {validation?.email}</p>
            <p className="text-xs text-blue-600 mt-1">
              Tipo: {invitationType} • Expira: {validation?.expiresAt ? new Date(validation.expiresAt).toLocaleDateString('es-ES') : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Name Input */}
        <Input
          variant="light"
          label="Nombre Completo"
          type="text"
          placeholder="Juan Pérez"
          error={errors.name}
          {...register('name', { required: 'El nombre es requerido' })}
        />

        {/* Email Input (Read-only) */}
        <Input
          variant="light"
          label="Correo Electrónico"
          type="email"
          placeholder="nombre@empresa.com"
          error={errors.email}
          readOnly
          {...register('email', {
            required: 'El correo es requerido',
            pattern: { value: /^\S+@\S+$/i, message: 'Correo inválido' },
          })}
        />

        {/* Password Inputs (Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Password */}
          <Input
            variant="light"
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            error={errors.password}
            {...register('password', {
              required: 'Contraseña requerida',
              minLength: { value: 6, message: 'Mínimo 6 caracteres' },
            })}
          />

          {/* Confirm Password */}
          <Input
            variant="light"
            label="Confirmar"
            type="password"
            placeholder="••••••••"
            error={errors.confirmPassword}
            {...register('confirmPassword', {
              required: 'Confirma tu contraseña',
              validate: (val) => val === password || 'Las contraseñas no coinciden',
            })}
          />
        </div>

        {/* Terms & Conditions Checkbox */}
        <div className="flex items-start gap-2 pt-2">
          <input
            type="checkbox"
            id="terms"
            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[var(--color-navy)] focus:ring-[var(--color-navy)]"
            required
          />
          <label htmlFor="terms" className="text-xs text-gray-500 leading-relaxed">
            Acepto los{' '}
            <span className="text-[var(--color-navy)] font-bold cursor-pointer hover:underline">
              Términos de Servicio
            </span>{' '}
            y la{' '}
            <span className="text-[var(--color-navy)] font-bold cursor-pointer hover:underline">
              Política de Privacidad
            </span>
            .
          </label>
        </div>

        <Button type="submit" isLoading={isLoading} fullWidth>
          {step === 'accepting' ? 'Procesando...' : 'Crear Cuenta y Aceptar'}
        </Button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-[var(--color-navy)] font-bold hover:underline">
            Iniciar Sesión
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
