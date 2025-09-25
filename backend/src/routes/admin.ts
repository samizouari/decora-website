import express, { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import db from '../database/connection';

const router = express.Router();

// Configuration multer pour l'upload d'images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Seules les images (jpeg, jpg, png, webp) sont autorisées'));
    }
  }
});

// Upload multiple pour les images de produits
const uploadMultiple = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max per file
    files: 10 // Maximum 10 images par produit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Seules les images (jpeg, jpg, png, webp) sont autorisées'));
    }
  }
});

// Appliquer l'authentification admin à toutes les routes
router.use(authenticateToken, requireAdmin);

// GET /api/admin/dashboard - Statistiques du dashboard
router.get('/dashboard', (req: Request, res: Response) => {
  const queries = [
    'SELECT COUNT(*) as total_products FROM products',
    'SELECT COUNT(*) as total_categories FROM categories',
    'SELECT COUNT(*) as total_orders FROM orders',
    'SELECT COUNT(*) as total_users FROM users WHERE role = "customer"',
    'SELECT COUNT(*) as pending_orders FROM orders WHERE status = "pending"'
  ];

  return Promise.all(queries.map(query => 
    new Promise((resolve, reject) => {
      db.get(query, [], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    })
  )).then(results => {
    const [products, categories, orders, users, pendingOrders] = results as any[];
    return res.json({
      products: products.total_products,
      categories: categories.total_categories,
      orders: orders.total_orders,
      users: users.total_users,
      pendingOrders: pendingOrders.pending_orders
    });
  }).catch(err => {
    console.error('Erreur dashboard:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  });
});

// GET /api/admin/products - Récupérer tous les produits (y compris masqués) pour l'admin
router.get('/products', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  const query = `
    SELECT p.*, c.name as category_name 
    FROM products p 
    LEFT JOIN categories c ON p.category_id = c.id 
    ORDER BY p.created_at DESC
  `;

  db.all(query, [], (err, products) => {
    if (err) {
      console.error('Erreur lors de la récupération des produits:', err.message);
      return res.status(500).json({ error: 'Erreur serveur' });
    }

    // Pour chaque produit, récupérer ses images
    const productsWithImages = products.map(async (product: any) => {
      return new Promise((resolve, reject) => {
        db.all(
          'SELECT image_url FROM product_images WHERE product_id = ?',
          [product.id],
          (err, rows) => {
            if (err) {
              reject(err);
            } else {
              resolve({
                ...product,
                images: (rows as any[]).map(row => row.image_url)
              });
            }
          }
        );
      });
    });

    Promise.all(productsWithImages)
      .then(results => res.json(results))
      .catch(error => {
        console.error('Erreur lors de la récupération des images:', error);
        return res.status(500).json({ error: 'Erreur serveur' });
      });
    
    return; // Ajouter un return explicite
  });
});

// POST /api/admin/products - Créer un nouveau produit
router.post('/products', (req: Request, res: Response, next: NextFunction) => {
  // Wrap multer to catch its errors and return proper responses
  uploadMultiple.array('images', 10)(req, res, (err: any) => {
    if (err) {
      console.error('Erreur upload images (POST /products):', err);
      return res.status(400).json({ error: err.message || 'Fichiers invalides' });
    }
    return next();
  });
}, [
  body('name').notEmpty().withMessage('Le nom est requis')
], (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, description, price, category_id, stock_quantity, dimensions, materials } = req.body;
  const files = req.files as Express.Multer.File[];
  
  // Rendre le prix optionnel
  const productPrice = price ? parseFloat(price) : null;
  const productCategoryId = category_id ? parseInt(category_id) : null;
  const productStockQuantity = stock_quantity ? parseInt(stock_quantity) : 0;

  return db.run(
    `INSERT INTO products (name, description, price, category_id, stock_quantity, dimensions, materials) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [name, description, productPrice, productCategoryId, productStockQuantity, dimensions, materials],
    function(err, result) {
      if (err) {
        console.error('Erreur création produit:', err);
        return res.status(500).json({ error: 'Erreur serveur' });
      }

      const productId = result.lastID;

      // Insérer les images si elles existent
      if (files && files.length > 0) {
        const imageStmt = db.prepare('INSERT INTO product_images (product_id, image_url, display_order) VALUES (?, ?, ?)');
        
        files.forEach((file, index) => {
          const imageUrl = `/uploads/${file.filename}`;
          imageStmt.run([productId, imageUrl, index]);
        });
        
        imageStmt.finalize((err: Error | null) => {
          if (err) {
            console.error('Erreur insertion images:', err);
          }
        });
      }

      return res.status(201).json({
        message: 'Produit créé avec succès',
        productId: productId
      });
    }
  );
});

// PUT /api/admin/products/:id - Modifier un produit
router.put('/products/:id', (req: Request, res: Response, next: NextFunction) => {
  uploadMultiple.array('images', 10)(req, res, (err: any) => {
    if (err) {
      console.error('Erreur upload images (PUT /products/:id):', err);
      return res.status(400).json({ error: err.message || 'Fichiers invalides' });
    }
    return next();
  });
}, [
  body('name').notEmpty().withMessage('Le nom est requis')
], (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { name, description, price, category_id, stock_quantity, dimensions, materials } = req.body;
  const files = req.files as Express.Multer.File[];
  
  // Rendre le prix optionnel
  const productPrice = price ? parseFloat(price) : null;
  const productCategoryId = category_id ? parseInt(category_id) : null;
  const productStockQuantity = stock_quantity ? parseInt(stock_quantity) : 0;

  let query = `UPDATE products SET 
    name = ?, description = ?, price = ?, category_id = ?, 
    stock_quantity = ?, dimensions = ?, materials = ?, updated_at = CURRENT_TIMESTAMP`;
  let params: any[] = [name, description, productPrice, productCategoryId, productStockQuantity, dimensions, materials];

  query += ' WHERE id = ?';
  params.push(id);

  return db.run(query, params, function(err, result) {
    if (err) {
      console.error('Erreur modification produit:', err);
      return res.status(500).json({ error: 'Erreur serveur' });
    }

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    // Mettre à jour les images si elles existent
    if (files && files.length > 0) {
      // Supprimer les anciennes images
      db.run('DELETE FROM product_images WHERE product_id = ?', [id], (err) => {
        if (err) {
          console.error('Erreur suppression anciennes images:', err);
        }
        
        // Insérer les nouvelles images
        const imageStmt = db.prepare('INSERT INTO product_images (product_id, image_url, display_order) VALUES (?, ?, ?)');
        
        files.forEach((file, index) => {
          const imageUrl = `/uploads/${file.filename}`;
          imageStmt.run([id, imageUrl, index]);
        });
        
        imageStmt.finalize((err: Error | null) => {
          if (err) {
            console.error('Erreur insertion nouvelles images:', err);
          }
        });
      });
    }

    return res.json({ message: 'Produit modifié avec succès' });
  });
});

// DELETE /api/admin/products/:id - Supprimer un produit
router.delete('/products/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  return db.run('DELETE FROM products WHERE id = ?', [id], function(err, result) {
    if (err) {
      console.error('Erreur suppression produit:', err);
      return res.status(500).json({ error: 'Erreur serveur' });
    }

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    return res.json({ message: 'Produit supprimé avec succès' });
  });
});

// POST /api/admin/categories - Créer une nouvelle catégorie
router.post('/categories', upload.single('image'), [
  body('name').notEmpty().withMessage('Le nom est requis'),
  body('description').notEmpty().withMessage('La description est requise')
], (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, description } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  return db.run(
    'INSERT INTO categories (name, description, image_url) VALUES (?, ?, ?)',
    [name, description, imageUrl],
    function(err, result) {
      if (err) {
        console.error('Erreur création catégorie:', err);
        return res.status(500).json({ error: 'Erreur serveur' });
      }

      return res.status(201).json({
        message: 'Catégorie créée avec succès',
        categoryId: result.lastID
      });
    }
  );
});

// PUT /api/admin/categories/:id - Modifier une catégorie
router.put('/categories/:id', upload.single('image'), [
  body('name').notEmpty().withMessage('Le nom est requis'),
  body('description').notEmpty().withMessage('La description est requise')
], (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { name, description } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

  let query = 'UPDATE categories SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP';
  let params: any[] = [name, description];

  if (imageUrl) {
    query += ', image_url = ?';
    params.push(imageUrl);
  }

  query += ' WHERE id = ?';
  params.push(id);

  return db.run(query, params, function(err, result) {
    if (err) {
      console.error('Erreur modification catégorie:', err);
      return res.status(500).json({ error: 'Erreur serveur' });
    }

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Catégorie non trouvée' });
    }

    return res.json({ message: 'Catégorie modifiée avec succès' });
  });
});

// DELETE /api/admin/categories/:id - Supprimer une catégorie
router.delete('/categories/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  return db.run('DELETE FROM categories WHERE id = ?', [id], function(err, result) {
    if (err) {
      console.error('Erreur suppression catégorie:', err);
      return res.status(500).json({ error: 'Erreur serveur' });
    }

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Catégorie non trouvée' });
    }

    return res.json({ message: 'Catégorie supprimée avec succès' });
  });
});

// GET /api/admin/orders - Liste des commandes
router.get('/orders', (req: Request, res: Response) => {
  const query = `
    SELECT o.*, u.first_name, u.last_name, u.email
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC
  `;

  return db.all(query, [], (err, orders) => {
    if (err) {
      console.error('Erreur récupération commandes:', err);
      return res.status(500).json({ error: 'Erreur serveur' });
    }

    return res.json(orders);
  });
});

// PUT /api/admin/orders/:id/status - Modifier le statut d'une commande
router.put('/orders/:id/status', [
  body('status').isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('Statut invalide')
], (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { status } = req.body;

  return db.run(
    'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [status, id],
    function(err, result) {
      if (err) {
        console.error('Erreur modification statut commande:', err);
        return res.status(500).json({ error: 'Erreur serveur' });
      }

      if (result.changes === 0) {
        return res.status(404).json({ error: 'Commande non trouvée' });
      }

      return res.json({ message: 'Statut de la commande modifié avec succès' });
    }
  );
});

// PUT /api/admin/products/:id/visibility - Modifier la visibilité d'un produit
router.put('/products/:id/visibility', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { is_active } = req.body;

  if (typeof is_active !== 'boolean') {
    return res.status(400).json({ error: 'Le paramètre is_active doit être un booléen' });
  }

  const query = 'UPDATE products SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
  
  db.run(query, [is_active ? 1 : 0, id], function(err, result) {
    if (err) {
      console.error('Erreur lors de la mise à jour de la visibilité:', err.message);
      return res.status(500).json({ error: 'Erreur serveur' });
    }

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    return res.json({ 
      message: `Produit ${is_active ? 'activé' : 'désactivé'} avec succès`,
      is_active: is_active
    });
  });
  
  return; // Ajouter un return explicite
});

export default router; 