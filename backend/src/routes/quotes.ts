import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import db from '../database/connection';
import { sendQuoteNotification } from '../services/emailService';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

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

  // Vérifier si l'utilisateur est connecté
  let userId = null;
  const token = req.headers.authorization?.split(' ')[1];
  
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      userId = decoded.userId;
    } catch (error) {
      // Token invalide, continuer sans utilisateur
    }
  }

  try {
    const result = await db.query(
      'INSERT INTO orders (name, email, phone, subject, message, status, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, created_at',
      [name, email, phone, subject, message, 'new', userId]
    ) as any;

    const quoteId = result.rows[0].id;
    const createdAt = result.rows[0].created_at;

    // Envoyer une notification email
    const emailSent = await sendQuoteNotification({
      id: quoteId,
      name,
      email,
      phone,
      subject,
      message,
      created_at: createdAt
    });

    if (emailSent) {
      console.log(`✅ Notification email envoyée pour la demande de devis #${quoteId}`);
    } else {
      console.log(`⚠️ Échec de l'envoi de l'email pour la demande de devis #${quoteId}`);
    }

    return res.status(201).json({ 
      message: 'Demande de devis envoyée avec succès',
      id: quoteId 
    });
  } catch (error) {
    console.error('Erreur lors de la création de la demande de devis:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/quotes - Récupérer les demandes de devis de l'utilisateur connecté
router.get('/', async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const userId = decoded.userId;

    const result = await db.query(
      'SELECT id, subject, message, status, created_at, updated_at FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    ) as any;

    return res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des demandes:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
