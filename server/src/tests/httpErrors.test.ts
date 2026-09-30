import { describe, it, expect, vi } from 'vitest';
import { sendRouteError } from '../utils/httpErrors';

describe('Hata yanıtları (sendRouteError)', () => {
  function mockRes() {
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
  }

  it('Prisma kayıt bulunamadı hatasında 404 dönmelidir', () => {
    const res = mockRes();
    sendRouteError(res, { code: 'P2025', name: 'PrismaClientKnownRequestError' }, 'Silinemedi');
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('Prisma hata detaylarını (dosya yolu, sorgu) istemciye göndermemelidir', () => {
    const res = mockRes();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    sendRouteError(
      res,
      { name: 'PrismaClientValidationError', message: 'Invalid `prisma.business.findMany()` invocation in /home/x/src/routes/businesses.ts:253' },
      'CSV dışa aktarılırken hata oluştu'
    );
    spy.mockRestore();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'CSV dışa aktarılırken hata oluştu' });
  });

  it('Harici API hata mesajlarını korumalıdır', () => {
    const res = mockRes();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    sendRouteError(res, new Error('Vercel API Hatası: 403 - forbidden'), 'Otomasyon sırasında hata oluştu');
    spy.mockRestore();
    expect(res.json).toHaveBeenCalledWith({ error: 'Otomasyon sırasında hata oluştu: Vercel API Hatası: 403 - forbidden' });
  });

  it('Zod hatasında 400 dönmelidir', () => {
    const res = mockRes();
    sendRouteError(res, { name: 'ZodError', errors: [] }, 'x');
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
