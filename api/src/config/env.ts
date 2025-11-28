import dotenv from 'dotenv'
import { z } from 'zod'

// Load .env file
dotenv.config()

// Define the schema for environment variables
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z
    .string()
    .default('3000')
    .transform(val => parseInt(val, 10))
    .pipe(z.number().min(1).max(65535)),
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  CORS_ALLOWED_ORIGINS: z
    .string()
    .default('http://localhost:5173,http://localhost:5174')
    .transform(val => val.split(',').map(origin => origin.trim())),
  CLAIM_NUMBER_SALT: z.string().optional(),
  TICKET_NUMBER_SALT: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),

  // Cloudflare R2 Storage (optional in development)
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_ENDPOINT: z.string().url().optional(),
  R2_PUBLIC_URL: z.string().url().optional(),
})
.refine(
  (data) => {
    // Require CLAIM_NUMBER_SALT in production
    if (data.NODE_ENV === 'production' && !data.CLAIM_NUMBER_SALT) {
      return false
    }
    return true
  },
  {
    message: 'CLAIM_NUMBER_SALT is required in production environment',
    path: ['CLAIM_NUMBER_SALT'],
  }
)
.refine(
  (data) => {
    // Require TICKET_NUMBER_SALT in production
    if (data.NODE_ENV === 'production' && !data.TICKET_NUMBER_SALT) {
      return false
    }
    return true
  },
  {
    message: 'TICKET_NUMBER_SALT is required in production environment',
    path: ['TICKET_NUMBER_SALT'],
  }
)
.refine(
  (data) => {
    // Require R2 configuration in production
    if (data.NODE_ENV === 'production') {
      return !!(
        data.R2_ACCOUNT_ID &&
        data.R2_ACCESS_KEY_ID &&
        data.R2_SECRET_ACCESS_KEY &&
        data.R2_BUCKET_NAME &&
        data.R2_ENDPOINT
      )
    }
    return true
  },
  {
    message: 'R2 storage configuration is required in production environment',
    path: ['R2_BUCKET_NAME'],
  }
)

// Validate and parse environment variables
const parseEnv = () => {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:')
      error.issues.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`)
      })
      process.exit(1)
    }
    throw error
  }
}

// Export validated and typed environment config
export const env = parseEnv()

// Export type for use in other parts of the application
export type Env = typeof env
