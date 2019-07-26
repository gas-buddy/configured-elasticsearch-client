import tap from 'tap';
import Elastic from '../src/index';

const fakeContext = {
  logger: console,
  service: {
    wrapError(e) {
      return e;
    },
  },
  headers: {
    correlationid: 123456789,
  },
};

tap.test('test_connection', async (t) => {
  const config = {
    name: 'test-elastic',
    hostname: process.env.ELASTIC_HOST || 'http://elastic:9200',
  };
  const elastic = new Elastic(fakeContext, config);
  await elastic.start(fakeContext);

  t.ok(elastic, 'Should have a connect method');
  await elastic.stop();
});
