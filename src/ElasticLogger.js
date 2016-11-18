import winston from 'winston';

export default class Logger {
  constructor() {
    this.logger = winston;
  }

  error(error) {
    this.logger.error(error.message);
  }

  warning(...messages) {
    this.logger.warn(`elastic: ${messages.join(' ')}`);
  }

  info(...messages) {
    this.logger.info(`elastic: ${messages.join(' ')}`);
  }

  debug(...messages) {
    this.logger.debug(`elastic: ${messages.join(' ')}`);
  }

  // eslint-disable-next-line class-methods-use-this
  trace(/* httpMethod, requestUrl, requestBody, responseBody, responseStatus */) {
    // No action yet
  }
}
