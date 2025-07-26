type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: string;
  context?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  private formatMessage(level: LogLevel, message: string, data?: unknown, context?: string): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : '';
    const dataStr = data ? ` | Data: ${JSON.stringify(data, null, 2)}` : '';
    
    return `${timestamp} ${level.toUpperCase()} ${contextStr} ${message}${dataStr}`;
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) {
      return true; // Log everything in development
    }
    
    if (this.isProduction) {
      // Only log warnings and errors in production
      return level === 'warn' || level === 'error';
    }
    
    return false;
  }

  private log(level: LogLevel, message: string, data?: unknown, context?: string): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const formattedMessage = this.formatMessage(level, message, data, context);
    
    switch (level) {
      case 'debug':
        console.debug(formattedMessage);
        break;
      case 'info':
        console.info(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'error':
        console.error(formattedMessage);
        break;
    }
  }

  debug(message: string, data?: unknown, context?: string): void {
    this.log('debug', message, data, context);
  }

  info(message: string, data?: unknown, context?: string): void {
    this.log('info', message, data, context);
  }

  warn(message: string, data?: unknown, context?: string): void {
    this.log('warn', message, data, context);
  }

  error(message: string, data?: unknown, context?: string): void {
    this.log('error', message, data, context);
  }

  // Helper methods for common logging scenarios
  apiRequest(method: string, url: string, data?: unknown): void {
    this.info(`API ${method} ${url}`, data, 'API');
  }

  apiResponse(method: string, url: string, status: number, data?: unknown): void {
    const level = status >= 400 ? 'error' : 'info';
    this.log(level, `API ${method} ${url} - Status: ${status}`, data, 'API');
  }

  userAction(action: string, userId: string, data?: unknown): void {
    this.info(`User action: ${action}`, { userId, ...data }, 'USER');
  }

  performance(operation: string, duration: number, data?: unknown): void {
    this.info(`Performance: ${operation} took ${duration}ms`, data, 'PERFORMANCE');
  }

  security(event: string, data?: unknown): void {
    this.warn(`Security event: ${event}`, data, 'SECURITY');
  }
}

// Create singleton instance
export const logger = new Logger();

// Export types for use in other files
export type { LogLevel, LogEntry }; 