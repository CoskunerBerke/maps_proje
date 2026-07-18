import { Router, Request, Response } from 'express';
import { prisma } from '../db';
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
    res.status(500).json({ error: 'Marka listesi getirilirken hata oluştu: ' + error.message });
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
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Geçersiz parametreler', details: error.errors });
    } else {
      res.status(500).json({ error: 'Marka eklenirken hata oluştu: ' + error.message });
    }
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
    res.status(500).json({ error: 'Marka silinirken hata oluştu: ' + error.message });
  }
});

export default router;
