import { describe, it, expect, vi } from 'vitest';
import { localOnly, parseAllowedHosts, hostnameFromHostHeader } from '../utils/localOnly';

function runLocalOnly(headers: Record<string, string | undefined>, extraHosts: string[] = []) {
  const req: any = { headers };
  const res: any = {
    statusCode: 200,
    body: undefined,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
  };
  const next = vi.fn();
  localOnly(extraHosts)(req, res, next);
  return { res, next };
}

describe('Yerel erişim koruması (localOnly middleware)', () => {
  it('localhost / 127.0.0.1 / [::1] Host başlıklarına izin vermelidir', () => {
    for (const host of ['localhost:3001', '127.0.0.1:3001', '[::1]:3001', 'localhost']) {
      const { next } = runLocalOnly({ host });
      expect(next).toHaveBeenCalledTimes(1);
    }
  });

  it('Yabancı Host başlığını (DNS rebinding) 403 ile reddetmelidir', () => {
    const { res, next } = runLocalOnly({ host: 'evil.example:3001' });
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);

    expect(runLocalOnly({ host: 'localhost.evil.example' }).res.statusCode).toBe(403);
    expect(runLocalOnly({}).res.statusCode).toBe(403);
  });

  it('Başka bir siteden gelen Origin başlığını (CSRF) reddetmelidir', () => {
    expect(runLocalOnly({ host: 'localhost:3001', origin: 'https://evil.example' }).res.statusCode).toBe(403);
    expect(runLocalOnly({ host: 'localhost:3001', origin: 'null' }).res.statusCode).toBe(403);

    const { next } = runLocalOnly({ host: '127.0.0.1:3001', origin: 'http://localhost:5173' });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('ALLOWED_HOSTS ile ek host adlarına izin verilebilmelidir', () => {
    const extra = parseAllowedHosts(' Laptop.local , ');
    expect(extra).toEqual(['laptop.local']);
    const { next } = runLocalOnly({ host: 'laptop.local:3001', origin: 'http://laptop.local:5173' }, extra);
    expect(next).toHaveBeenCalledTimes(1);
    expect(hostnameFromHostHeader('[::1]:3001')).toBe('::1');
  });
});
