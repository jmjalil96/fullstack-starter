import nodemailer from 'nodemailer'

import { env } from '../config/env.js'

/**
 * Email transporter configuration
 * Uses Inbucket (SMTP test server) in development
 * TODO: Add production config (Resend/SendGrid) via env vars
 * TODO: Add queue service (BullMQ) for async email processing
 */
export const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '2500', 10),
  secure: false,
  tls: {
    rejectUnauthorized: false,
  },
})

const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@capstone360.com'

/**
 * Invitation type for email templates
 */
export type InvitationEmailType = 'EMPLOYEE' | 'AGENT' | 'AFFILIATE'

/**
 * Send invitation email to a new user
 *
 * @param to - Recipient email address
 * @param token - Unique invitation token
 * @param type - Type of invitation (EMPLOYEE, AGENT, AFFILIATE)
 * @param inviteeName - Name of the person being invited
 * @param inviterName - Name of the person who created the invitation
 */
export async function sendInvitationEmail(
  to: string,
  token: string,
  type: InvitationEmailType,
  inviteeName: string,
  inviterName: string
): Promise<void> {
  const acceptUrl = `${env.CLIENT_URL}/invite/${token}`

  const templates = {
    EMPLOYEE: {
      subject: 'Has sido invitado a unirte a Capstone360 como empleado',
      heading: 'Bienvenido al equipo',
      message: `${inviterName} te ha invitado a unirte a Capstone360 como empleado.`,
      buttonText: 'Aceptar Invitación',
    },
    AGENT: {
      subject: 'Has sido invitado a unirte a Capstone360 como agente',
      heading: 'Únete como Agente',
      message: `${inviterName} te ha invitado a unirte al portal de agentes de Capstone360.`,
      buttonText: 'Aceptar Invitación',
    },
    AFFILIATE: {
      subject: 'Accede a tu portal de beneficios en Capstone360',
      heading: 'Acceso a tu Portal',
      message: `${inviterName} te ha invitado a acceder al portal de Capstone360 donde podrás gestionar tus beneficios de salud.`,
      buttonText: 'Crear mi Cuenta',
    },
  }

  const template = templates[type]

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1a365d 0%, #2d4a7c 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: #d4af37; margin: 0; font-size: 24px;">Capstone360</h1>
      </div>

      <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <h2 style="color: #1a365d; margin-top: 0;">${template.heading}</h2>

        <p>Hola ${inviteeName},</p>

        <p>${template.message}</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${acceptUrl}" style="display: inline-block; background: #d4af37; color: #1a365d; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
            ${template.buttonText}
          </a>
        </div>

        <p style="color: #6b7280; font-size: 14px;">
          Este enlace expirará en 7 días. Si no solicitaste esta invitación, puedes ignorar este correo.
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">

        <p style="color: #9ca3af; font-size: 12px; margin-bottom: 0;">
          Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
          <a href="${acceptUrl}" style="color: #2563eb; word-break: break-all;">${acceptUrl}</a>
        </p>
      </div>
    </body>
    </html>
  `

  await emailTransporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject: template.subject,
    html,
  })
}
