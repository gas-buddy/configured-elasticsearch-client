export default class Logger {
  constructor(logger) {
    this.logger = logger;
  }

  error(error) {
    this.logger.error(`elastic: ${error.message}`, error);
  }

  warning(message, meta) {
    this.logger.warn(`elastic: ${message}`, meta);
  }

  info(message, meta) {
    this.logger.info(`elastic: ${message}`, meta);
  }

  debug(message, meta) {
    // Squelch the logs we will already do
    if (message !== 'starting request' && message !== 'Request complete') {
      this.logger.debug(`elastic: ${message}`, meta);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  trace(/* httpMethod, requestUrl, requestBody, responseBody, responseStatus */) {
    // No action yet
  }

  close() {
    this.logger.debug('elastic: close logger');
  }
}
