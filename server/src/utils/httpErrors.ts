import { ErrorRequestHandler, Response } from 'express';

/**
 * Sends a consistent JSON error response.
 * - Zod validation errors -> 400
 * - Prisma "record not found" / missing relation -> 404
 * - Everything else -> 500
 *
 * Prisma error messages contain source file paths and query dumps, so they are
 * only logged on the server and never sent to the client. Other error messages
 * (e.g. Google / Gemini / Vercel API errors) are useful to the user and are kept.
 */
export function sendRouteError(res: Response, error: any, message: string) {
  if (error?.name === 'ZodError') {
    return res.status(400).json({ error: 'Geçersiz parametreler', details: error.errors });
  }

  if (error?.code === 'P2025' || error?.code === 'P2003') {
    return res.status(404).json({ error: 'Kayıt bulunamadı.' });
  }

  console.error(message, error);

  const isPrismaError = typeof error?.name === 'string' && error.name.startsWith('PrismaClient');
  const detail = !isPrismaError && error?.message ? ': ' + error.message : '';
  return res.status(500).json({ error: message + detail });
}

/**
 * Final Express error handler. Without it, errors raised by express.json()
 * (malformed JSON, body too large, ...) and errors that escape a route get
 * Express's default HTML error page, which includes the stack trace and
 * absolute server paths.
 */
export const jsonErrorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  // body-parser errors carry a 4xx status and a type such as "entity.parse.failed"
  const status = Number(error?.status ?? error?.statusCode);
  if (error?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'İstek gövdesi geçerli bir JSON değil.' });
  }
  if (status === 413) {
    return res.status(413).json({ error: 'İstek gövdesi çok büyük.' });
  }
  if (status >= 400 && status < 500) {
    return res.status(status).json({ error: 'Geçersiz istek.' });
  }

  console.error('Beklenmeyen sunucu hatası:', error);
  return res.status(500).json({ error: 'Beklenmeyen bir sunucu hatası oluştu.' });
};
