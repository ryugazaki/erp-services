import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { requestIdMiddleware } from '@erp/core/http';
import { errorMiddleware } from '@erp/core/http';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));
  app.use(cookieParser());
  app.use(express.json());
  app.use(requestIdMiddleware);

  return app;
}

export { errorMiddleware };
