import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../database/connection';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

// Validation pour l'inscription
const registerValidation = [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  body('first_name').notEmpty().withMessage('Le prénom est requis'),
  body('last_name').notEmpty().withMessage('Le nom de famille est requis')
];

// Validation pour la connexion
const loginValidation = [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Le mot de passe est requis')
];

// POST /api/auth/register - Inscription
router.post('/register', registerValidation, (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password, first_name, last_name, phone } = req.body;

  return db.get('SELECT id FROM users WHERE email = ?', [email], (err, user) => {
    if (err) {
      console.error('Erreur lors de la vérification de l\'utilisateur:', err);
      return res.status(500).json({ error: 'Erreur serveur' });
    }

    if (user) {
      return res.status(400).json({ error: 'Un utilisateur avec cet email existe déjà' });
    }

    return bcrypt.hash(password, 12).then(hashedPassword => {
      return db.run(
        'INSERT INTO users (email, password, first_name, last_name, phone) VALUES (?, ?, ?, ?, ?)',
        [email, hashedPassword, first_name, last_name, phone],
        function(err, result) {
          if (err) {
            console.error('Erreur lors de la création de l\'utilisateur:', err);
            return res.status(500).json({ error: 'Erreur serveur' });
          }

          const token = jwt.sign(
            { userId: result.lastID, email, role: 'customer' },
            JWT_SECRET,
            { expiresIn: '24h' }
          );

          return res.status(201).json({
            message: 'Utilisateur créé avec succès',
            token,
            user: {
              id: result.lastID,
              email,
              first_name,
              last_name,
              role: 'customer'
            }
          });
        }
      );
    }).catch(error => {
      console.error('Erreur lors du hashage du mot de passe:', error);
      return res.status(500).json({ error: 'Erreur serveur' });
    });
  });
});

// POST /api/auth/login - Connexion
router.post('/login', loginValidation, async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Utiliser l'API PostgreSQL async/await
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/auth/me - Récupérer les informations de l'utilisateur connecté
router.get('/me', async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    const result = await db.query(
      'SELECT id, email, username, role FROM users WHERE id = $1',
      [decoded.userId]
    );
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    return res.json(user);
  } catch (error) {
    return res.status(401).json({ error: 'Token invalide' });
  }
});

export default router; 