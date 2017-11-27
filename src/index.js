import 'babel-polyfill';

import config from 'config';
import express from 'express';
import http from 'http';

import bootstrap from './bootstrap';
import { log, normalizePort, ERROR_START } from './utils';

let server;
const app = express();

app.start = async () => {
  log.info('Starting Server...');
  const port = normalizePort(config.get('port'));
  app.set('port', port);
  bootstrap(app);
  server = http.createServer(app);

  server.on('error', (error) => {
    if (error.syscall !== 'listen') {
      throw error;
    }
    log.error(`Failed to start server: ${error}`);
    process.exit(ERROR_START);
  });

  server.on('listening', () => {
    if (process.env.NODE_ENV !== 'test') {
      const address = server.address();
      log.info(`Server listening ${address.address}:${address.port}`);
    }
  });

  server.listen(port);
};

app.start().catch((err) => {
  log.error(err);
});
export default app;