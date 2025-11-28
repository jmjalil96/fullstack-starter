import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '../../shared/components/ui/forms/Button'
import { Input } from '../../shared/components/ui/forms/Input'
import { useAuthStore } from '../../store/authStore'

import { AuthLayout } from './AuthLayout'

interface SignupFormData {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export function Signup() {
  const navigate = useNavigate()
  const { signUp, isAuthenticating, error, clearError } = useAuthStore()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    mode: 'onBlur',
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  })

  // Clear errors on type
  const formValues = watch()
  const errorRef = useRef(error)

  useEffect(() => {
    errorRef.current = error
  }, [error])

  useEffect(() => {
    if (errorRef.current) clearError()
  }, [formValues, clearError])

  const onSubmit = async (data: SignupFormData) => {
    try {
      await signUp(data.name, data.email, data.password)
      navigate('/dashboard')
    } catch (error) {
      console.error('Signup failed:', error)
    }
  }

  const isLoading = isAuthenticating || isSubmitting
  const password = watch('password')

  return (
    <AuthLayout
      title="Crear Cuenta"
      subtitle="Únete a la plataforma de gestión de salud corporativa líder."
      backLink={{ to: '/login', label: 'Volver a Iniciar Sesión' }}
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
          Registrarse
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
