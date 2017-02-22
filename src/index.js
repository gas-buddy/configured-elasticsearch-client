import assert from 'assert';
import es from 'elasticsearch';
import { EventEmitter } from 'events';
import ElasticLogger from './ElasticLogger';
import apiProxy from './apiProxy';

export default class ConfiguredElasticClient extends EventEmitter {
  constructor(context, opts) {
    super();
    assert(opts, 'configured-elasticsearch-client must be passed arguments');
    assert(opts.hostname, 'configured-elasticsearch-client missing hostname setting');

    this.logger = context.logger;

    const config = Object.assign({}, opts, {
      log: ElasticLogger,
    });

    // Make ES configs look more like ours to avoid pain.
    if (config.hostname) {
      config.host = config.hostname;
      delete config.hostname;
    }
    if (config.port && config.host) {
      config.host = `${config.host}:${config.port}`;
      delete config.port;
    }

    this.host = config.host;
    this.elastic = new es.Client(config);

    // You should call this right before making a query,
    // and then we will fire start/finish/error on outbound requests
    this.elastic.queryWithContext = (req, operationName) => apiProxy(this, req, operationName);
    this.contextServiceProperty = opts.contextServiceProperty || 'gb';
  }

  async start(context) {
    assert(!this.started, 'start called multiple times on configured-elasticsearch-client instance');
    this.started = true;
    try {
      await this.elastic.queryWithContext(context).ping({});
      if (context && context.logger && context.logger.info) {
        context.logger.info(`Connected to elasticsearch ${this.host}`);
      }
    } catch (esError) {
      if (context && context.logger && context.logger.error) {
        // eslint-disable-next-line max-len
        context.logger.error(`Elasticsearch connection '${this.host}' failed to ping, continuing without verified ES connection`, esError);
      }
    }
    return apiProxy(this);
  }

  stop() {
    assert(this.started, 'stop called multiple times on configured-elasticsearch-client instance');
    delete this.started;
  }
}
