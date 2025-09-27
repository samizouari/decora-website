import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import db from '../database/connection';

const router = express.Router();

// POST /api/quotes - Créer une nouvelle demande de devis (public)
router.post('/', [
  body('name').notEmpty().withMessage('Le nom est requis'),
  body('email').isEmail().withMessage('Email invalide'),
  body('subject').notEmpty().withMessage('Le sujet est requis'),
  body('message').notEmpty().withMessage('Le message est requis')
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, phone, subject, message } = req.body;

  try {
    const result = await db.query(
      'INSERT INTO orders (name, email, phone, subject, message, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [name, email, phone, subject, message, 'new']
    ) as any;

    return res.status(201).json({ 
      message: 'Demande de devis envoyée avec succès',
      id: result.rows[0].id 
    });
  } catch (error) {
    console.error('Erreur lors de la création de la demande de devis:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
