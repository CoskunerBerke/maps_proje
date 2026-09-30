import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { sendRouteError } from '../utils/httpErrors';
import { ExcludedBrandSchema } from '../schemas/validation';

const router = Router();

// GET /api/excluded-brands
router.get('/', async (req: Request, res: Response) => {
  try {
    const brands = await prisma.excludedBrand.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(brands);
  } catch (error: any) {
    sendRouteError(res, error, 'Marka listesi getirilirken hata oluştu');
  }
});

// POST /api/excluded-brands
router.post('/', async (req: Request, res: Response) => {
  try {
    const validated = ExcludedBrandSchema.parse(req.body);

    const existing = await prisma.excludedBrand.findUnique({
      where: { name: validated.name },
    });

    if (existing) {
      return res.status(400).json({ error: 'Bu marka zaten listede var.' });
    }

    const brand = await prisma.excludedBrand.create({
      data: { name: validated.name },
    });

    res.status(201).json(brand);
  } catch (error: any) {
    sendRouteError(res, error, 'Marka eklenirken hata oluştu');
  }
});

// DELETE /api/excluded-brands/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.excludedBrand.delete({
      where: { id },
    });
    res.json({ message: 'Marka başarıyla kaldırıldı.' });
  } catch (error: any) {
    sendRouteError(res, error, 'Marka silinirken hata oluştu');
  }
});

export default router;
