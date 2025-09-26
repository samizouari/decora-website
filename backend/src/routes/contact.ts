import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import db from '../database/connection';

const router = express.Router();

// Validation pour les demandes de contact
const contactValidation = [
  body('name').notEmpty().withMessage('Le nom est requis'),
  body('email').isEmail().withMessage('Email invalide'),
  body('subject').notEmpty().withMessage('Le sujet est requis'),
  body('message').notEmpty().withMessage('Le message est requis')
];

// POST /api/contact - Créer une nouvelle demande de contact
router.post('/', contactValidation, async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, phone, subject, message } = req.body;

  try {
    const result = await db.query(
      'INSERT INTO contact_requests (name, email, phone, subject, message) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [name, email, phone, subject, message]
    ) as any;

    return res.status(201).json({ 
      message: 'Demande de contact envoyée avec succès',
      id: result.rows[0].id 
    });
  } catch (error) {
    console.error('Erreur lors de la création de la demande de contact:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/contact - Récupérer toutes les demandes de contact (admin)
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await db.query('SELECT * FROM contact_requests ORDER BY created_at DESC') as any;
    return res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des demandes de contact:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/contact/:id - Mettre à jour le statut d'une demande
router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['new', 'in_progress', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Statut invalide' });
  }

  try {
    const result = await db.query(
      'UPDATE contact_requests SET status = $1 WHERE id = $2',
      [status, id]
    ) as any;

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Demande de contact non trouvée' });
    }

    return res.json({ message: 'Statut mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router; 