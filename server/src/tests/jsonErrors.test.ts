import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import express from 'express';
import { once } from 'events';
import type { AddressInfo } from 'net';
import type { Server } from 'http';

// The routes import Prisma; these tests never reach the database.
vi.mock('../db', () => ({ prisma: {} }));

import { createApp } from '../app';
import { jsonErrorHandler } from '../utils/httpErrors';

async function listen(app: express.Express): Promise<{ server: Server; baseUrl: string }> {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address() as AddressInfo;
  return { server, baseUrl: `http://127.0.0.1:${port}` };
}

describe('JSON hata yanıtları (jsonErrorHandler)', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    ({ server, baseUrl } = await listen(createApp()));
  });

  afterAll(() => {
    server.close();
  });

  it('Bozuk JSON gövdesinde yığın izi (stack trace) olmadan 400 JSON dönmelidir', async () => {
    const response = await fetch(`${baseUrl}/api/places/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"latitude": 39.9,',
    });
    const text = await response.text();

    expect(response.status).toBe(400);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(JSON.parse(text)).toEqual({ error: 'İstek gövdesi geçerli bir JSON değil.' });
    expect(text).not.toMatch(/SyntaxError|node_modules|\s+at\s/);
  });

  it('Çok büyük JSON gövdesinde 413 JSON dönmelidir', async () => {
    const response = await fetch(`${baseUrl}/api/businesses/x`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: 'a'.repeat(200 * 1024) }),
    });

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({ error: 'İstek gövdesi çok büyük.' });
  });

  it('Beklenmeyen hatalarda ayrıntı göstermeden 500 JSON dönmelidir', async () => {
    const app = express();
    app.get('/boom', () => {
      throw new Error('ENOENT: /home/kullanici/gizli/yol.db');
    });
    app.use(jsonErrorHandler);
    const local = await listen(app);
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      const response = await fetch(`${local.baseUrl}/boom`);
      const text = await response.text();

      expect(response.status).toBe(500);
      expect(JSON.parse(text)).toEqual({ error: 'Beklenmeyen bir sunucu hatası oluştu.' });
      expect(text).not.toContain('/home/kullanici');
      expect(spy).toHaveBeenCalled();
    } finally {
      spy.mockRestore();
      local.server.close();
    }
  });
});
