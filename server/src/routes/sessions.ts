import { Router, Request, Response } from 'express';
import { prisma } from '../db';

const router = Router();

// GET /api/sessions
router.get('/', async (req: Request, res: Response) => {
  try {
    const sessions = await prisma.searchSession.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(sessions);
  } catch (error: any) {
    res.status(500).json({ error: 'Tarama geçmişi getirilirken hata oluştu: ' + error.message });
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
    res.status(500).json({ error: 'Tarama oturumu getirilirken hata oluştu: ' + error.message });
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
    res.status(500).json({ error: 'Tarama oturumu silinirken hata oluştu: ' + error.message });
  }
});

export default router;
