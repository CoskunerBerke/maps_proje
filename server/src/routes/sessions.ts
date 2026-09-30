import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { sendRouteError } from '../utils/httpErrors';

const router = Router();

// GET /api/sessions
router.get('/', async (req: Request, res: Response) => {
  try {
    const sessions = await prisma.searchSession.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(sessions);
  } catch (error: any) {
    sendRouteError(res, error, 'Tarama geçmişi getirilirken hata oluştu');
  }
});

// GET /api/sessions/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const session = await prisma.searchSession.findUnique({
      where: { id },
      include: {
        businesses: true,
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Tarama oturumu bulunamadı.' });
    }

    res.json(session);
  } catch (error: any) {
    sendRouteError(res, error, 'Tarama oturumu getirilirken hata oluştu');
  }
});

// DELETE /api/sessions/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.searchSession.delete({
      where: { id },
    });
    res.json({ message: 'Tarama oturumu silindi.' });
  } catch (error: any) {
    sendRouteError(res, error, 'Tarama oturumu silinirken hata oluştu');
  }
});

export default router;
