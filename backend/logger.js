// Simple logger for backend
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

class Logger {
  formatMessage(level, message, data, context) {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` | Data: ${JSON.stringify(data)}` : '';
    const contextStr = context ? ` | Context: ${context}` : '';
    return `[${timestamp}] ${level.toUpperCase()}${contextStr}: ${message}${dataStr}`;
  }

  shouldLog(level) {
    if (isDevelopment) return true;
    if (isProduction) {
      return level === 'warn' || level === 'error';
    }
    return true;
  }

  log(level, message, data, context) {
    if (!this.shouldLog(level)) return;
    
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
      default:
        console.log(formattedMessage);
    }
  }

  debug(message, data, context) {
    this.log('debug', message, data, context);
  }

  info(message, data, context) {
    this.log('info', message, data, context);
  }

  warn(message, data, context) {
    this.log('warn', message, data, context);
  }

  error(message, data, context) {
    this.log('error', message, data, context);
  }

  // Helper methods for common scenarios
  apiRequest(method, endpoint, data, context) {
    this.info(`API ${method} ${endpoint}`, data, context);
  }

  apiResponse(method, endpoint, statusCode, data, context) {
    this.info(`API ${method} ${endpoint} - ${statusCode}`, data, context);
  }

  userAction(userId, action, data, context) {
    this.info(`User action: ${action}`, { userId, ...data }, context);
  }

  performance(operation, duration, data, context) {
    this.info(`Performance: ${operation} took ${duration}ms`, data, context);
  }

  security(event, data, context) {
    this.warn(`Security event: ${event}`, data, context);
  }
}

const logger = new Logger();
module.exports = logger; 