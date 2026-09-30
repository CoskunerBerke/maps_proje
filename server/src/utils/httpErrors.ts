import { Response } from 'express';

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
