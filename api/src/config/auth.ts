import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'

import { emailTransporter } from '../lib/email.js'

import { db } from './database.js'
import { env } from './env.js'

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: 'postgresql',
  }),
  trustedOrigins: env.CORS_ALLOWED_ORIGINS,
  emailAndPassword: {
    enabled: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sendResetPassword: async ({ user, token }: { user: any; token: string }) => {
      // Build client-side reset URL with token
      const clientResetUrl = `${env.CLIENT_URL}/reset-password?token=${token}`

      await emailTransporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@capstone360.com',
        to: user.email,
        subject: 'Restablecer tu contraseña',
        html: `
          <h2>Restablecer tu Contraseña</h2>
          <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
          <a href="${clientResetUrl}">${clientResetUrl}</a>
          <p>Este enlace expirará en 1 hora.</p>
        `,
      })
    },
  },
  emailVerification: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sendVerificationEmail: async ({ user, token }: { user: any; token: string }) => {
      // Build client-side verification URL with token
      const clientVerifyUrl = `${env.CLIENT_URL}/verify-email?token=${token}`

      await emailTransporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@capstone360.com',
        to: user.email,
        subject: 'Verifica tu correo electrónico',
        html: `
          <h2>Verifica tu Correo</h2>
          <p>¡Bienvenido! Por favor verifica tu correo electrónico para completar tu registro:</p>
          <a href="${clientVerifyUrl}">${clientVerifyUrl}</a>
          <p>Este enlace expirará en 24 horas.</p>
        `,
      })
    },
  },
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
})
