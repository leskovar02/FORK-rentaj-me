import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { dovoliIzvor } from '../src/middleware/cors.js';

const IZVOR = 'https://frontend.example';

function aplikacija() {
  const app = express();
  app.use(dovoliIzvor(IZVOR));
  app.post('/api/test', (req, res) => res.json({ ok: true }));
  return app;
}

describe('middleware dovoliIzvor (CORS)', () => {
  it('dovoljen izvor dobi glave CORS s piškotki', async () => {
    const odgovor = await request(aplikacija()).post('/api/test').set('Origin', IZVOR);
    expect(odgovor.status).toBe(200);
    expect(odgovor.headers['access-control-allow-origin']).toBe(IZVOR);
    expect(odgovor.headers['access-control-allow-credentials']).toBe('true');
    expect(odgovor.headers.vary).toContain('Origin');
  });

  it('preflight dovoljenega izvora vrne 204 z metodami in glavami', async () => {
    const odgovor = await request(aplikacija())
      .options('/api/test')
      .set('Origin', IZVOR)
      .set('Access-Control-Request-Method', 'POST');
    expect(odgovor.status).toBe(204);
    expect(odgovor.headers['access-control-allow-methods']).toContain('POST');
    expect(odgovor.headers['access-control-allow-headers']).toBe('Content-Type');
  });

  it('drug izvor ne dobi glav CORS', async () => {
    const odgovor = await request(aplikacija())
      .post('/api/test')
      .set('Origin', 'https://napadalec.example');
    expect(odgovor.headers['access-control-allow-origin']).toBeUndefined();
    expect(odgovor.headers['access-control-allow-credentials']).toBeUndefined();
  });

  it('zahteva brez izvora (npr. curl) gre naprej brez glav CORS', async () => {
    const odgovor = await request(aplikacija()).post('/api/test');
    expect(odgovor.status).toBe(200);
    expect(odgovor.headers['access-control-allow-origin']).toBeUndefined();
  });
});
