import winston from 'winston';

function log(req, client, level, message, meta) {
  const gb = client.contextServiceProperty;
  if (req && req[gb] && req[gb].logger) {
    req[gb].logger[level](message, meta);
  } else if (client && client.logger && client.logger[level]) {
    client.logger[level](message, meta);
  } else {
    winston[level](message, meta);
  }
}

/**
 * I don't love this, but I want proper logging. So we override all the methods that we use
 * and log. The elasticsearch module goes through what seems like great effort to make it almost
 * impossible to do proper logging or metrics management.
 */
export default function getApiProxy(client, req, operationName) {
  const callInfo = {
    client,
    context: req,
    operationName,
  };

  return new Proxy(client.elastic, {
    get(target, name) {
      const exFn = target[name];
      if (typeof exFn === 'function') {
        // If this property is a function, proxy it
        return function genericESProxy(...args) {
          const rz = exFn.apply(target, args);

          // If this thing returns a promise and args is 1 long, assume it's an ES query
          if (args.length === 1 && rz && typeof rz.then === 'function') {
            if (!req) {
              log(req, client, 'warn',
                `elasticsearch request called without query context. Use client.queryWithContext(req, 'myLogicalName').${name}(...)`,
                { stack: new Error().stack });
            }
            const logInfo = {
              operationName: operationName || name,
            };
            client.emit('start', callInfo);
            log(req, client, 'info', 'elasticsearch start', logInfo);
            rz.then((resolved) => {
              callInfo.result = resolved;
              log(req, client, 'info', 'elasticsearch complete', logInfo);
              client.emit('finish', callInfo);
              return resolved;
            }).catch((error) => {
              callInfo.error = logInfo.error = error;
              log(req, client, 'error', 'elasticsearch failed', logInfo);
              client.emit('error', callInfo);
              throw error;
            });
          }

          return rz;
        };
      }
      return target[name];
    },
  });
}
