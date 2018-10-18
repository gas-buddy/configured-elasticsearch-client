import assert from 'assert';
import es from 'elasticsearch';
import { EventEmitter } from 'events';
import ElasticLogger from './ElasticLogger';
import { getApiProxy, ESPROP } from './apiProxy';

export default class ConfiguredElasticClient extends EventEmitter {
  constructor(context, opts) {
    super();
    assert(opts, 'configured-elasticsearch-client must be passed arguments');
    assert(opts.hostname || opts.hosts, 'configured-elasticsearch-client missing hostname setting or hosts array');

    this.logger = context.logger;
    this.service = context.service;

    const config = Object.assign({}, opts, {
      log: function logger() {
        const baseLogger = new ElasticLogger(context.logger);
        Object.assign(this, baseLogger);
        Object.setPrototypeOf(this, Object.getPrototypeOf(baseLogger));
      },
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
    if (config.host) {
      this.host = config.host;
    } else if (config.hosts) {
      ([this.host] = config.hosts);
    }

    if (!config.apiVersion) {
      // Default to our current version
      config.apiVersion = '5.6';
    }

    this[ESPROP] = new es.Client(config);
  }

  // You should call this right before making a query,
  // and then we will fire start/finish/error on outbound requests
  queryWithContext(req, operationName) {
    return getApiProxy(this, req, operationName);
  }

  get elastic() {
    if (['development', 'test'].includes(process.env.NODE_ENV || 'development')) {
      assert(false, '*** DO NOT ACCESS elastic search client directly - call queryWithContext');
    }
    return this[ESPROP];
  }

  async start(context) {
    assert(!this.started, 'start called multiple times on configured-elasticsearch-client instance');
    this.started = true;
    try {
      await this.elastic.queryWithContext(context).ping({});
      this.logger.info('Connected to elasticsearch', { host: this.host });
    } catch (esError) {
      this.logger.error('Elasticsearch failed to ping, continuing without verified ES connection', {
        host: this.host,
        ...this.service.wrapError(esError),
      });
    }
    return this;
  }

  stop() {
    assert(this.started, 'stop called multiple times on configured-elasticsearch-client instance');
    delete this.started;
  }
}
