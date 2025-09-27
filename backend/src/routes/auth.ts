import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../database/connection';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

// Validation pour l'inscription
const registerValidation = [
  body('username').isLength({ min: 3 }).withMessage('Le nom d\'utilisateur doit contenir au moins 3 caractères'),
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
router.post('/register', registerValidation, async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password, first_name, last_name, phone, company } = req.body;

  try {
    // Vérifier si l'utilisateur existe déjà (email ou username)
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2', 
      [email, username]
    ) as any;
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Un utilisateur avec cet email ou nom d\'utilisateur existe déjà' });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Créer l'utilisateur
    const result = await db.query(
      'INSERT INTO users (username, email, password_hash, first_name, last_name, phone, role) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, created_at',
      [username, email, hashedPassword, first_name, last_name, phone, 'user']
    ) as any;

    const userId = result.rows[0].id;
    const createdAt = result.rows[0].created_at;

    const token = jwt.sign(
      { userId, email, role: 'user' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      message: 'Utilisateur créé avec succès',
      token,
      user: {
        id: userId,
        username,
        email,
        first_name,
        last_name,
        phone,
        role: 'user',
        created_at: createdAt
      }
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
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
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]) as any;
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
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        role: user.role,
        created_at: user.created_at
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
      'SELECT id, email, username, first_name, last_name, phone, role, created_at FROM users WHERE id = $1',
      [decoded.userId]
    ) as any;
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