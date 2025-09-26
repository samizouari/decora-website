import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import db from '../database/connection';

const router = express.Router();

// Middleware pour vérifier le JWT (à implémenter)
const authMiddleware = (req: Request, res: Response, next: express.NextFunction) => {
  // Ici, on vérifierait le token JWT de l'utilisateur
  // Pour l'instant, on simule un utilisateur authentifié
  // (req as any).user = { id: 1, role: 'customer' }; 
  next();
};

// Validation pour la création de commande
const orderValidation = [
  body('items').isArray({ min: 1 }).withMessage('La commande doit contenir au moins un article'),
  body('items.*.product_id').isInt({ min: 1 }).withMessage('ID de produit invalide'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('La quantité doit être au moins 1'),
  body('shipping_address').notEmpty().withMessage('L\'adresse de livraison est requise')
];

// GET /api/orders - Récupérer les commandes d'un utilisateur
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { limit = 20, offset = 0 } = req.query;

  try {
    const result = await db.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [userId, parseInt(limit as string), parseInt(offset as string)]
    ) as any;

    return res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des commandes:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/orders/:id - Récupérer une commande spécifique
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as any).user.id;

  try {
    const orderResult = await db.query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [id, userId]
    ) as any;

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    const order = orderResult.rows[0];

    // Récupérer les articles de la commande
    const itemsResult = await db.query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [id]
    ) as any;

    return res.json({ ...order, items: itemsResult.rows });
  } catch (error) {
    console.error('Erreur lors de la récupération de la commande:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/orders - Créer une nouvelle commande
router.post('/', authMiddleware, orderValidation, async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { items, shipping_address, billing_address, notes } = req.body;
  const userId = (req as any).user.id;

  try {
    // 1. Calculer le montant total et vérifier la disponibilité des produits
    const productIds = items.map((item: any) => item.product_id);
    const placeholders = productIds.map((_: any, index: number) => `$${index + 1}`).join(',');
    
    const productsResult = await db.query(
      `SELECT * FROM products WHERE id IN (${placeholders})`, 
      productIds
    ) as any;

    const products = productsResult.rows;
    let total_amount = 0;
    const productMap = new Map(products.map((p: any) => [p.id, p]));

    for (const item of items) {
      const product = productMap.get(item.product_id) as any;
      if (!product || product.stock_quantity < item.quantity) {
        return res.status(400).json({ error: `Produit ID ${item.product_id} non disponible en quantité suffisante.` });
      }
      total_amount += product.price * item.quantity;
    }
    
    // 2. Créer la commande
    const orderResult = await db.query(
      'INSERT INTO orders (user_id, total_amount, shipping_address, billing_address, notes) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [userId, total_amount, shipping_address, billing_address, notes]
    ) as any;

    const orderId = orderResult.rows[0].id;

    // 3. Insérer les articles de la commande et mettre à jour le stock
    for (const item of items) {
      const product = productMap.get(item.product_id) as any;
      const unit_price = product.price;
      const total_price = unit_price * item.quantity;
      
      await db.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) VALUES ($1, $2, $3, $4, $5)',
        [orderId, item.product_id, item.quantity, unit_price, total_price]
      );
      
      await db.query(
        'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
        [item.quantity, item.product_id]
      );
    }
    
    return res.status(201).json({ message: 'Commande créée avec succès', orderId });
  } catch (error) {
    console.error('Erreur lors de la création de la commande:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router; 