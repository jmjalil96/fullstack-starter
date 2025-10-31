import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import nodemailer from 'nodemailer'

import { db } from './database.js'
import { env } from './env.js'

// Create email transporter for Inbucket (SMTP test server)
const transporter = nodemailer.createTransport({
  host: 'localhost',
  port: 2500,
  secure: false,
  tls: {
    rejectUnauthorized: false,
  },
})

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

      await transporter.sendMail({
        from: 'noreply@travelapp.com',
        to: user.email,
        subject: 'Reset your password',
        html: `
          <h2>Reset Your Password</h2>
          <p>Click the link below to reset your password:</p>
          <a href="${clientResetUrl}">${clientResetUrl}</a>
          <p>This link will expire in 1 hour.</p>
        `,
      })
    },
  },
  emailVerification: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sendVerificationEmail: async ({ user, token }: { user: any; token: string }) => {
      // Build client-side verification URL with token
      const clientVerifyUrl = `${env.CLIENT_URL}/verify-email?token=${token}`

      await transporter.sendMail({
        from: 'noreply@travelapp.com',
        to: user.email,
        subject: 'Verify your email address',
        html: `
          <h2>Verify Your Email</h2>
          <p>Welcome! Please verify your email address to complete your registration:</p>
          <a href="${clientVerifyUrl}">${clientVerifyUrl}</a>
          <p>This link will expire in 24 hours.</p>
        `,
      })
    },
  },
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
})
