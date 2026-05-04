import 'reflect-metadata';
import dotenv from 'dotenv';

dotenv.config();

import { createApp } from './app';
import { bootstrap } from './bootstrap';
import { Logger } from '@erp/shared/utils';

const PORT = parseInt(process.env.PORT || '3000', 10);

async function main() {
  const app = createApp();
  const { close } = await bootstrap(app);

  const server = app.listen(PORT, () => {
    Logger.info(`Gateway started on port ${PORT}`, { env: process.env.NODE_ENV });
  });

  const shutdown = async (signal: string) => {
    Logger.info(`Received ${signal}, shutting down gracefully...`);
    server.close();
    await close();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  Logger.error('Failed to start gateway', { error: err.message });
  process.exit(1);
});
