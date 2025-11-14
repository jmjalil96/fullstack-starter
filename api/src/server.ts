import { app } from './app.js'
import { env } from './config/env.js'
import { logger } from './shared/middleware/logger.js'

const server = app.listen(env.PORT, '0.0.0.0', () => {
  logger.info(`Server running on http://0.0.0.0:${env.PORT}`)
  logger.info(`Environment: ${env.NODE_ENV}`)
})

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully`)
  server.close(() => {
    logger.info('Server closed')
    process.exit(0)
  })

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout')
    process.exit(1)
  }, 10000)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))
