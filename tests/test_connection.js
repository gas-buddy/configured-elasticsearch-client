import tap from 'tap';
import winston from 'winston';
import Elastic from '../src/index';

tap.test('test_connection', async (t) => {
  const config = {
    name: 'test-elastic',
    hostname: process.env.ELASTIC_HOST || 'elastic',
  };
  const elastic = new Elastic(winston, config);
  await elastic.start({});
  t.ok(elastic, 'Should have a connect method');
  await elastic.stop();
});

tap.test('test_multiple_connection', async (t) => {
  const config = {
    name: 'test-elastic-multiple',
    hosts: [
      process.env.ELASTIC_URL || 'http://elastic:9200',
    ],
  };
  const elastic = new Elastic(winston, config);
  await elastic.start({});
  t.ok(elastic, 'Should have connect method');
  await elastic.stop();
});
