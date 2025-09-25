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
router.post('/', contactValidation, (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, phone, subject, message } = req.body;

  return db.run(
    'INSERT INTO contact_requests (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)',
    [name, email, phone, subject, message],
    function(err) {
      if (err) {
        console.error('Erreur lors de la création de la demande de contact:', err.message);
        return res.status(500).json({ error: 'Erreur serveur' });
      }

      return res.status(201).json({ 
        message: 'Demande de contact envoyée avec succès',
        id: this.lastID 
      });
    }
  );
});

// GET /api/contact - Récupérer toutes les demandes de contact (admin)
router.get('/', (req: Request, res: Response) => {
  return db.all(
    'SELECT * FROM contact_requests ORDER BY created_at DESC',
    (err, requests) => {
      if (err) {
        console.error('Erreur lors de la récupération des demandes de contact:', err.message);
        return res.status(500).json({ error: 'Erreur serveur' });
      }
      return res.json(requests);
    }
  );
});

// PUT /api/contact/:id - Mettre à jour le statut d'une demande
router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['new', 'in_progress', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Statut invalide' });
  }

  return db.run(
    'UPDATE contact_requests SET status = ? WHERE id = ?',
    [status, id],
    function(err) {
      if (err) {
        console.error('Erreur lors de la mise à jour du statut:', err.message);
        return res.status(500).json({ error: 'Erreur serveur' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Demande de contact non trouvée' });
      }

      return res.json({ message: 'Statut mis à jour avec succès' });
    }
  );
});

export default router; 