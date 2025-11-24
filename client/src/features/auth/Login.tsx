import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '../../shared/components/ui/forms/Button'
import { Input } from '../../shared/components/ui/forms/Input'
import { useAuthStore } from '../../store/authStore'

import { AuthLayout } from './AuthLayout'

interface LoginFormData {
  email: string
  password: string
}

export function Login() {
  const navigate = useNavigate()
  const { signIn, isAuthenticating, error, clearError } = useAuthStore()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    mode: 'onBlur',
    defaultValues: { email: '', password: '' },
  })

  const emailValue = watch('email')
  const passwordValue = watch('password')
  const errorRef = useRef(error)

  useEffect(() => {
    errorRef.current = error
  }, [error])

  useEffect(() => {
    if (errorRef.current) clearError()
  }, [emailValue, passwordValue, clearError])

  const onSubmit = async (data: LoginFormData) => {
    try {
      await signIn(data.email.trim(), data.password)
      navigate('/dashboard')
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  const isLoading = isAuthenticating || isSubmitting

  return (
    <AuthLayout
      title="Bienvenido"
      subtitle="Ingresa tus credenciales para acceder al portal."
      backLink={{ to: '/', label: 'Volver al inicio' }}
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
        {/* Email Input */}
        <Input
          variant="light"
          label="Correo"
          type="email"
          placeholder="nombre@empresa.com"
          error={errors.email}
          {...register('email', {
            required: 'El correo es requerido',
            pattern: { value: /^\S+@\S+$/i, message: 'Correo inválido' },
          })}
        />

        {/* Password Input */}
        <div>
          <div className="flex justify-between items-center ml-1 mb-1.5">
            <span className="block text-xs font-bold text-[var(--color-navy)] uppercase tracking-wider">
              Contraseña
            </span>
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-[var(--color-teal)] hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <Input
            variant="light"
            type="password"
            placeholder="••••••••"
            error={errors.password}
            {...register('password', { required: 'Contraseña requerida' })}
          />
        </div>

        <Button type="submit" isLoading={isLoading} fullWidth className="mt-2">
          Ingresar
        </Button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          ¿No tienes cuenta?{' '}
          <Link to="/signup" className="text-[var(--color-navy)] font-bold hover:underline">
            Solicitar Acceso
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
