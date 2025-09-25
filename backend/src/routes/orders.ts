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
router.get('/', authMiddleware, (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { limit = 20, offset = 0 } = req.query;

  db.all(
    'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [userId, parseInt(limit as string), parseInt(offset as string)],
    (err, orders) => {
      if (err) {
        console.error('Erreur lors de la récupération des commandes:', err.message);
        return res.status(500).json({ error: 'Erreur serveur' });
      }
      return res.json(orders);
    }
  );
});

// GET /api/orders/:id - Récupérer une commande spécifique
router.get('/:id', authMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as any).user.id;

  return db.get(
    'SELECT * FROM orders WHERE id = ? AND user_id = ?',
    [id, userId],
    (err, order) => {
      if (err) {
        console.error('Erreur lors de la récupération de la commande:', err.message);
        return res.status(500).json({ error: 'Erreur serveur' });
      }
      
      if (!order) {
        return res.status(404).json({ error: 'Commande non trouvée' });
      }

      // Récupérer les articles de la commande
      return db.all(
        'SELECT * FROM order_items WHERE order_id = ?',
        [id],
        (err, items) => {
          if (err) {
            console.error('Erreur lors de la récupération des articles:', err.message);
            return res.status(500).json({ error: 'Erreur serveur' });
          }
          
          return res.json({ ...order, items });
        }
      );
    }
  );
});

// POST /api/orders - Créer une nouvelle commande
router.post('/', authMiddleware, orderValidation, (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { items, shipping_address, billing_address, notes } = req.body;
  const userId = (req as any).user.id;

  // Transaction pour créer la commande et les articles associés
  return db.serialize(() => {
    db.run('BEGIN TRANSACTION', [], () => {});

    // 1. Calculer le montant total et vérifier la disponibilité des produits
    const productIds = items.map((item: any) => item.product_id);
    const placeholders = productIds.map(() => '?').join(',');
    
    return db.all(`SELECT * FROM products WHERE id IN (${placeholders})`, productIds, (err, products: any[]) => {
      if (err) {
        console.error('Erreur lors de la vérification des produits:', err.message);
        db.run('ROLLBACK', [], () => {});
        return res.status(500).json({ error: 'Erreur serveur' });
      }

      let total_amount = 0;
      const productMap = new Map(products.map(p => [p.id, p]));

      for (const item of items) {
        const product = productMap.get(item.product_id);
        if (!product || product.stock_quantity < item.quantity) {
          db.run('ROLLBACK', [], () => {});
          return res.status(400).json({ error: `Produit ID ${item.product_id} non disponible en quantité suffisante.` });
        }
        total_amount += product.price * item.quantity;
      }
      
      // 2. Créer la commande
      return db.run(
        'INSERT INTO orders (user_id, total_amount, shipping_address, billing_address, notes) VALUES (?, ?, ?, ?, ?)',
        [userId, total_amount, shipping_address, billing_address, notes],
        function(err, result) {
          if (err) {
            console.error('Erreur lors de la création de la commande:', err.message);
            db.run('ROLLBACK', [], () => {});
            return res.status(500).json({ error: 'Erreur serveur' });
          }

          const orderId = result.lastID;

          // 3. Insérer les articles de la commande et mettre à jour le stock
          const itemStmt = db.prepare('INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)');
          const stockStmt = db.prepare('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?');
          
          for (const item of items) {
            const product = productMap.get(item.product_id);
            const unit_price = product.price;
            const total_price = unit_price * item.quantity;
            itemStmt.run([orderId, item.product_id, item.quantity, unit_price, total_price]);
            stockStmt.run([item.quantity, item.product_id]);
          }
          
          itemStmt.finalize();
          return stockStmt.finalize((err: Error | null) => {
            if (err) {
              console.error('Erreur lors de la finalisation des statements:', err.message);
              db.run('ROLLBACK', [], () => {});
              return res.status(500).json({ error: 'Erreur serveur' });
            }
            
            // 4. Valider la transaction
            return db.run('COMMIT', [], (err) => {
              if (err) {
                console.error('Erreur lors du commit de la transaction:', err.message);
                db.run('ROLLBACK', [], () => {});
                return res.status(500).json({ error: 'Erreur serveur' });
              }
              
              return res.status(201).json({ message: 'Commande créée avec succès', orderId });
            });
          });
        }
      );
    });
  });
});

export default router; 