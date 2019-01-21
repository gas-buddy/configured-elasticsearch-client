export const ESPROP = Symbol('ES Client Property');

function log(req, client, level, message, meta) {
  const logger = req?.gb?.logger || client?.logger;
  if (logger) {
    client.logger[level](message, meta);
  }
}

/**
 * I don't love this, but I want proper logging. So we override all the methods that we use
 * and log. The elasticsearch module goes through what seems like great effort to make it almost
 * impossible to do proper logging or metrics management.
 */
export function getApiProxy(client, req, operationName) {
  const callInfo = {
    client,
    context: req,
    operationName,
  };

  return new Proxy(client[ESPROP], {
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
            log(req, client, 'debug', 'elasticsearch start', logInfo);
            rz.then((resolved) => {
              callInfo.result = resolved;
              log(req, client, 'debug', 'elasticsearch complete', logInfo);
              client.emit('finish', callInfo);
            }).catch((error) => {
              callInfo.error = error;
              logInfo.error = error;
              log(req, client, 'error', 'elasticsearch failed', logInfo);
              client.emit('error', callInfo);
            });
          }

          return rz;
        };
      }
      return target[name];
    },
  });
}
