/**
 * Simple Console Logger
 *
 * Lightweight logger for hooks library
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

class Logger {
  private minLevel: LogLevel = 'info'

  setMinLevel(level: LogLevel): void {
    this.minLevel = level
  }

  debug(message: string, context?: LogContext, feature?: string): void {
    if (this.shouldLog('debug')) {
      this.log('debug', message, context, feature)
    }
  }

  info(message: string, context?: LogContext, feature?: string): void {
    if (this.shouldLog('info')) {
      this.log('info', message, context, feature)
    }
  }

  warn(message: string, context?: LogContext, feature?: string): void {
    if (this.shouldLog('warn')) {
      this.log('warn', message, context, feature)
    }
  }

  error(message: string, context?: LogContext, feature?: string): void {
    if (this.shouldLog('error')) {
      this.log('error', message, context, feature)
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error']
    return levels.indexOf(level) >= levels.indexOf(this.minLevel)
  }

  private log(level: LogLevel, message: string, context?: LogContext, feature?: string): void {
    const prefix = feature ? `[${feature}]` : '[Hooks]'
    const logFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log

    if (context && Object.keys(context).length > 0) {
      logFn(`${prefix} ${message}`, context)
    } else {
      logFn(`${prefix} ${message}`)
    }
  }
}

export const logger: Logger = new Logger()

// Set minimum level based on environment (if available)
if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
  logger.setMinLevel('debug')
} else {
  logger.setMinLevel('info')
}
