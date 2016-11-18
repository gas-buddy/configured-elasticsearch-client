import assert from 'assert';
import es from 'elasticsearch';
import ElasticLogger from './ElasticLogger';

export default class ElasticClient {
  constructor(context, opts) {
    assert(opts, 'configured-elasticsearch-client must be passed arguments');
    assert(opts.hostname, 'configured-elasticsearch-client missing hostname setting');

    const config = Object.assign({}, opts, { log: ElasticLogger });
    // Make ES configs look more like ours to avoid pain.
    if (config.hostname) {
      config.host = config.hostname;
      delete config.hostname;
    }
    if (config.port && config.host) {
      config.host = `${config.host}:${config.port}`;
      delete config.port;
    }
    this.elastic = new es.Client(config);
    this.host = config.host;
  }

  async start(context) {
    assert(!this.started, 'start called multiple times on configured-elasticsearch-client instance');
    this.started = true;
    try {
      await this.elastic.ping({});
      if (context && context.logger && context.logger.info) {
        context.logger.info(`Connected to elasticsearch ${this.host}`);
      }
    } catch (esError) {
      if (context && context.logger && context.logger.error) {
        // eslint-disable-next-line max-len
        context.logger.error(`Elasticsearch connection '${this.host}' failed to ping, continuing without verified ES connection`, esError);
      }
    }
    return this.elastic;
  }

  stop() {
    assert(this.started, 'stop called multiple times on configured-elasticsearch-client instance');
    delete this.started;
  }
}
