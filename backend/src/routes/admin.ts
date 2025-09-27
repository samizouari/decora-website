import express, { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import path from 'path';
import fs from 'fs';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import db from '../database/connection';
import cloudinary from '../config/cloudinary';

const router = express.Router();

// Configuration Cloudinary Storage
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    return {
      folder: 'decora',
      resource_type: 'auto',
      quality: 'auto',
      fetch_format: 'auto',
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' }, // Redimensionner si nécessaire
        { quality: 'auto' }
      ]
    };
  }
});

// Configuration multer pour l'upload d'images (fallback local)
const localStorage = multer.diskStorage({
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
  storage: cloudinaryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    // Validation spéciale pour les PDFs
    const isPDF = path.extname(file.originalname).toLowerCase() === '.pdf';
    const isValidPDFMime = file.mimetype === 'application/pdf' || file.mimetype === 'application/x-pdf';

    console.log('🔍 [UPLOAD] Fichier:', file.originalname);
    console.log('🔍 [UPLOAD] MIME type:', file.mimetype);
    console.log('🔍 [UPLOAD] Extension:', path.extname(file.originalname).toLowerCase());
    console.log('🔍 [UPLOAD] Is PDF:', isPDF);
    console.log('🔍 [UPLOAD] Valid PDF MIME:', isValidPDFMime);

    if ((mimetype && extname) || (isPDF && isValidPDFMime)) {
      console.log('✅ [UPLOAD] Fichier accepté:', file.originalname);
      return cb(null, true);
    } else {
      console.log('❌ [UPLOAD] Fichier rejeté:', file.originalname);
      cb(new Error('Seuls les fichiers (jpeg, jpg, png, webp, pdf) sont autorisés'));
    }
  }
});

// Upload multiple pour les images de produits
const uploadMultiple = multer({
  storage: cloudinaryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max per file
    files: 10 // Maximum 10 images par produit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    // Validation spéciale pour les PDFs
    const isPDF = path.extname(file.originalname).toLowerCase() === '.pdf';
    const isValidPDFMime = file.mimetype === 'application/pdf' || file.mimetype === 'application/x-pdf';

    console.log('🔍 [UPLOAD] Fichier:', file.originalname);
    console.log('🔍 [UPLOAD] MIME type:', file.mimetype);
    console.log('🔍 [UPLOAD] Extension:', path.extname(file.originalname).toLowerCase());
    console.log('🔍 [UPLOAD] Is PDF:', isPDF);
    console.log('🔍 [UPLOAD] Valid PDF MIME:', isValidPDFMime);

    if ((mimetype && extname) || (isPDF && isValidPDFMime)) {
      console.log('✅ [UPLOAD] Fichier accepté:', file.originalname);
      return cb(null, true);
    } else {
      console.log('❌ [UPLOAD] Fichier rejeté:', file.originalname);
      cb(new Error('Seuls les fichiers (jpeg, jpg, png, webp, pdf) sont autorisés'));
    }
  }
});

// Appliquer l'authentification admin à toutes les routes
router.use(authenticateToken, requireAdmin);

// GET /api/admin/dashboard - Statistiques du dashboard
router.get('/dashboard', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const queries = [
      'SELECT COUNT(*) as total_products FROM products',
      'SELECT COUNT(*) as total_categories FROM categories',
      'SELECT COUNT(*) as total_orders FROM orders',
      'SELECT COUNT(*) as total_users FROM users WHERE role = $1',
      'SELECT COUNT(*) as pending_orders FROM orders WHERE status = $1'
    ];

    const [productsResult, categoriesResult, ordersResult, usersResult, pendingOrdersResult] = await Promise.all([
      db.query(queries[0]) as any,
      db.query(queries[1]) as any,
      db.query(queries[2]) as any,
      db.query(queries[3], ['customer']) as any,
      db.query(queries[4], ['pending']) as any
    ]);

    return res.json({
      products: productsResult.rows[0].total_products,
      categories: categoriesResult.rows[0].total_categories,
      orders: ordersResult.rows[0].total_orders,
      users: usersResult.rows[0].total_users,
      pendingOrders: pendingOrdersResult.rows[0].pending_orders
    });
  } catch (error) {
    console.error('Erreur dashboard:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/admin/products - Récupérer tous les produits (y compris masqués) pour l'admin
router.get('/products', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      ORDER BY p.created_at DESC
    `;

    const result = await db.query(query) as any;
    const products = result.rows;

    // Pour chaque produit, récupérer ses images
    for (const product of products) {
      const imagesResult = await db.query(
        'SELECT image_url FROM product_images WHERE product_id = $1 ORDER BY created_at',
        [product.id]
      ) as any;
      product.images = imagesResult.rows.map((img: any) => img.image_url);
    }

    return res.json(products);
  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
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
], async (req: Request, res: Response) => {
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

  try {
    const result = await db.query(
      `INSERT INTO products (name, description, price, category_id, stock_quantity, dimensions, materials) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [name, description, productPrice, productCategoryId, productStockQuantity, dimensions, materials]
    ) as any;
    
    const productId = result.rows[0].id;

    // Insérer les images si elles existent
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const imageUrl = file.path;
        await db.query(
          'INSERT INTO product_images (product_id, image_url, display_order) VALUES ($1, $2, $3)',
          [productId, imageUrl, i]
        );
      }
    }

    return res.status(201).json({
      message: 'Produit créé avec succès',
      productId: productId
    });
  } catch (error) {
    console.error('Erreur création produit:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
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
], async (req: Request, res: Response) => {
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

  try {
    const query = `UPDATE products SET 
      name = $1, description = $2, price = $3, category_id = $4, 
      stock_quantity = $5, dimensions = $6, materials = $7, updated_at = CURRENT_TIMESTAMP
      WHERE id = $8`;
    
    const result = await db.query(query, [
      name, description, productPrice, productCategoryId, 
      productStockQuantity, dimensions, materials, id
    ]) as any;

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    // Mettre à jour les images si elles existent
    if (files && files.length > 0) {
      // Supprimer les anciennes images
      await db.query('DELETE FROM product_images WHERE product_id = $1', [id]);
      
      // Insérer les nouvelles images
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const imageUrl = file.path;
        await db.query(
          'INSERT INTO product_images (product_id, image_url, display_order) VALUES ($1, $2, $3)',
          [id, imageUrl, i]
        );
      }
    }

    return res.json({ message: 'Produit modifié avec succès' });
  } catch (error) {
    console.error('Erreur modification produit:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/admin/products/:id - Supprimer un produit
router.delete('/products/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await db.query('DELETE FROM products WHERE id = $1', [id]) as any;

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    return res.json({ message: 'Produit supprimé avec succès' });
  } catch (err) {
    console.error('Erreur suppression produit:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/admin/categories - Créer une nouvelle catégorie
router.post('/categories', upload.single('image'), [
  body('name').notEmpty().withMessage('Le nom est requis'),
  body('description').notEmpty().withMessage('La description est requise')
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, description } = req.body;
  const imageUrl = req.file ? req.file.path : null;

  try {
    const result = await db.query(
      'INSERT INTO categories (name, description, image_url) VALUES ($1, $2, $3) RETURNING id',
      [name, description, imageUrl]
    ) as any;

    return res.status(201).json({
      message: 'Catégorie créée avec succès',
      categoryId: result.rows[0].id
    });
  } catch (error) {
    console.error('Erreur création catégorie:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/admin/categories/:id - Modifier une catégorie
router.put('/categories/:id', upload.single('image'), [
  body('name').notEmpty().withMessage('Le nom est requis'),
  body('description').notEmpty().withMessage('La description est requise')
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { name, description } = req.body;
  const imageUrl = req.file ? req.file.path : undefined;

  try {
    let query: string;
    let params: any[];

    if (imageUrl) {
      query = 'UPDATE categories SET name = $1, description = $2, image_url = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4';
      params = [name, description, imageUrl, id];
    } else {
      query = 'UPDATE categories SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3';
      params = [name, description, id];
    }

    const result = await db.query(query, params) as any;

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Catégorie non trouvée' });
    }

    return res.json({ message: 'Catégorie modifiée avec succès' });
  } catch (error) {
    console.error('Erreur modification catégorie:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/admin/categories/:id - Supprimer une catégorie
router.delete('/categories/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await db.query('DELETE FROM categories WHERE id = $1', [id]) as any;

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Catégorie non trouvée' });
    }

    return res.json({ message: 'Catégorie supprimée avec succès' });
  } catch (error) {
    console.error('Erreur suppression catégorie:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/admin/orders - Liste des commandes
router.get('/orders', async (req: Request, res: Response) => {
  const query = `
    SELECT o.*, u.first_name, u.last_name, u.email
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC
  `;

  try {
    const result = await db.query(query) as any;
    return res.json(result.rows);
  } catch (error) {
    console.error('Erreur récupération commandes:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/admin/orders/:id/status - Modifier le statut d'une commande
router.put('/orders/:id/status', [
  body('status').isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('Statut invalide')
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { status } = req.body;

  try {
    const result = await db.query(
      'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [status, id]
    ) as any;

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    return res.json({ message: 'Statut de la commande modifié avec succès' });
  } catch (error) {
    console.error('Erreur modification statut commande:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/admin/quotes - Liste des demandes de devis (alias pour orders)
router.get('/quotes', async (req: Request, res: Response) => {
  console.log('🔍 [ADMIN QUOTES] Requête reçue');
  
  const query = `
    SELECT o.*, 
           COALESCE(u.first_name, o.name) as name,
           COALESCE(u.last_name, '') as last_name,
           COALESCE(u.email, o.email) as email
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC
  `;

  try {
    console.log('🔍 [ADMIN QUOTES] Exécution de la requête SQL...');
    const result = await db.query(query) as any;
    console.log('🔍 [ADMIN QUOTES] Nombre de devis trouvés:', result.rows.length);
    
    if (result.rows.length > 0) {
      console.log('🔍 [ADMIN QUOTES] Premiers devis:', result.rows.slice(0, 3).map((r: any) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        subject: r.subject,
        status: r.status,
        created_at: r.created_at
      })));
    } else {
      console.log('🔍 [ADMIN QUOTES] Aucun devis trouvé');
    }
    
    return res.json(result.rows);
  } catch (error) {
    console.error('❌ [ADMIN QUOTES] Erreur récupération devis:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/admin/quotes/:id - Modifier le statut d'un devis
router.put('/quotes/:id', [
  body('status').isIn(['new', 'processing', 'completed', 'cancelled']).withMessage('Statut invalide')
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { status } = req.body;

  try {
    const result = await db.query(
      'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [status, id]
    ) as any;

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Devis non trouvé' });
    }

    return res.json({ message: 'Statut du devis modifié avec succès' });
  } catch (error) {
    console.error('Erreur modification statut devis:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});


// PUT /api/admin/products/:id/visibility - Modifier la visibilité d'un produit
router.put('/products/:id/visibility', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { is_active } = req.body;

  if (typeof is_active !== 'boolean') {
    return res.status(400).json({ error: 'Le paramètre is_active doit être un booléen' });
  }

  try {
    const result = await db.query(
      'UPDATE products SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [is_active, id]
    ) as any;

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    return res.json({ 
      message: `Produit ${is_active ? 'activé' : 'désactivé'} avec succès`,
      is_active: is_active
    });
  } catch (err) {
    console.error('Erreur lors de la mise à jour de la visibilité:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router; 