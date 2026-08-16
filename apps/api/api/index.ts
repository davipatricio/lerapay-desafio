import type { INestApplication } from '@nestjs/common';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createApp } from '../dist/main';

let appPromise: Promise<INestApplication> | undefined;

function getApp(): Promise<INestApplication> {
  return (appPromise ??= createApp());
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await getApp();
  const express = app.getHttpAdapter().getInstance();
  express(req, res);
}
