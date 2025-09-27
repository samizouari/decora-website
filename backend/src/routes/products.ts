import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import db from '../database/connection';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

const router = express.Router();

// Interface pour typer les produits
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category_id: number;
  image_url?: string;
  stock_quantity: number;
  dimensions?: string;
  materials?: string;
  is_active: number;
  created_at: string;
  updated_at: string;
  category_name?: string;
}

// Validation pour les produits
const productValidation = [
  body('name').notEmpty().withMessage('Le nom du produit est requis'),
  body('price').isFloat({ min: 0 }).withMessage('Le prix doit être un nombre positif'),
  body('category_id').isInt({ min: 1 }).withMessage('La catégorie est requise'),
  body('stock_quantity').isInt({ min: 0 }).withMessage('La quantité en stock doit être un nombre positif')
];

// GET /api/products - Récupérer tous les produits
router.get('/', async (req: Request, res: Response) => {
  try {
    console.log('🔍 [PRODUCTS] Début de la récupération des produits');
    const { category, search, limit = 20, offset = 0 } = req.query;
    
    let query = `
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.is_active = true
    `;
    const params: any[] = [];

    if (category) {
      query += ' AND c.name = $' + (params.length + 1);
      params.push(category);
    }

    if (search) {
      query += ' AND (p.name LIKE $' + (params.length + 1) + ' OR p.description LIKE $' + (params.length + 2) + ')';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY p.created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(parseInt(limit as string), parseInt(offset as string));

    console.log('🔍 [PRODUCTS] Requête SQL:', query);
    console.log('🔍 [PRODUCTS] Paramètres:', params);

    const result = await db.query(query, params) as any;
    const products = result.rows;
    
    console.log('🔍 [PRODUCTS] Nombre de produits trouvés:', products.length);
    
    // Récupérer les images pour chaque produit
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    for (const product of products) {
      const imagesResult = await db.query(
        'SELECT image_url FROM product_images WHERE product_id = $1 ORDER BY display_order',
        [product.id]
      ) as any;
      
      const productImages = imagesResult.rows.map((img: any) => 
        img.image_url.startsWith('http') ? img.image_url : `${baseUrl}${img.image_url}`
      );
      
      product.image_url = product.image_url && !product.image_url.startsWith('http') 
        ? `${baseUrl}${product.image_url}` 
        : product.image_url;
      product.images = productImages;
    }

    console.log('🔍 [PRODUCTS] Produits avec images:', products.length);
    return res.json(products);
  } catch (error) {
    console.error('❌ [PRODUCTS] Erreur lors de la récupération des produits:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/products/history - Récupérer l'historique des produits consultés
router.get('/history', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  console.log('🔍 [HISTORY] Authorization header:', authHeader);
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ [HISTORY] Header Authorization manquant ou mal formaté');
    return res.status(401).json({ error: 'Token manquant' });
  }
  
  const token = authHeader.split(' ')[1];
  console.log('🔍 [HISTORY] Token extrait:', token ? 'Présent' : 'Manquant');
  console.log('🔍 [HISTORY] Token length:', token ? token.length : 0);

  if (!token) {
    console.log('❌ [HISTORY] Token manquant');
    return res.status(401).json({ error: 'Token manquant' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const userId = decoded.userId;

    console.log('🔍 [HISTORY] Récupération historique pour user:', userId);

    const result = await db.query(`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.image_url,
        p.dimensions,
        p.materials,
        c.name as category_name,
        pv.viewed_at
      FROM product_views pv
      JOIN products p ON pv.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE pv.user_id = $1 AND p.is_active = true
      ORDER BY pv.viewed_at DESC
      LIMIT 20
    `, [userId]) as any;

    console.log('🔍 [HISTORY] Nombre de produits trouvés:', result.rows.length);
    if (result.rows.length > 0) {
      console.log('🔍 [HISTORY] Premiers produits:', result.rows.slice(0, 3).map((r: any) => ({
        id: r.id,
        name: r.name,
        viewed_at: r.viewed_at
      })));
    }

    return res.json(result.rows);
  } catch (error) {
    console.error('❌ [HISTORY] Erreur lors de la récupération de l\'historique:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/products/:id - Récupérer un produit par ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log('🔍 [PRODUCT] Récupération du produit ID:', id);
    
    const result = await db.query(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.id = $1 AND p.is_active = true`,
      [id]
    ) as any;
    
    const product = result.rows[0];
    
    if (!product) {
      console.log('❌ [PRODUCT] Produit non trouvé ID:', id);
      return res.status(404).json({ error: 'Produit non trouvé' });
    }
    
    console.log('🔍 [PRODUCT] Produit trouvé:', product.name);
    
    // Récupérer les images du produit
    const imagesResult = await db.query(
      'SELECT image_url FROM product_images WHERE product_id = $1 ORDER BY display_order',
      [id]
    ) as any;
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const productImages = imagesResult.rows.map((img: any) => 
      img.image_url.startsWith('http') ? img.image_url : `${baseUrl}${img.image_url}`
    );
    
    const productWithFullData = {
      ...product,
      image_url: product.image_url && !product.image_url.startsWith('http') 
        ? `${baseUrl}${product.image_url}` 
        : product.image_url,
      images: productImages
    };
    
    console.log('🔍 [PRODUCT] Produit avec images:', productImages.length);
    return res.json(productWithFullData);
  } catch (error) {
    console.error('❌ [PRODUCT] Erreur lors de la récupération du produit:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/products - Créer un nouveau produit
router.post('/', productValidation, async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, description, price, category_id, stock_quantity, image_url } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO products (name, description, price, category_id, stock_quantity, image_url) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [name, description, price, category_id, stock_quantity, image_url]
    ) as any;

    const productId = result.rows[0].id;

    const productResult = await db.query(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.id = $1`,
      [productId]
    ) as any;

    return res.status(201).json(productResult.rows[0]);
  } catch (error) {
    console.error('Erreur lors de la création du produit:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/products/:id - Mettre à jour un produit
router.put('/:id', productValidation, async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { name, description, price, category_id, stock_quantity, image_url } = req.body;

  try {
    const result = await db.query(
      `UPDATE products 
       SET name = $1, description = $2, price = $3, category_id = $4, 
           stock_quantity = $5, image_url = $6, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $7`,
      [name, description, price, category_id, stock_quantity, image_url, id]
    ) as any;

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    const productResult = await db.query(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.id = $1`,
      [id]
    ) as any;

    return res.json(productResult.rows[0]);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du produit:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/products/:id - Supprimer un produit (soft delete)
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      'UPDATE products SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    ) as any;

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    return res.json({ message: 'Produit supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du produit:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/products/category/:categoryId - Récupérer les produits par catégorie
router.get('/category/:categoryId', async (req: Request, res: Response) => {
  const { categoryId } = req.params;
  const { limit = 20, offset = 0 } = req.query;

  try {
    const result = await db.query(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.category_id = $1 AND p.is_active = true 
       ORDER BY p.created_at DESC 
       LIMIT $2 OFFSET $3`,
      [categoryId, parseInt(limit as string), parseInt(offset as string)]
    ) as any;

    return res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des produits par catégorie:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/products/:id/view - Enregistrer la consultation d'un produit
router.post('/:id/view', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  console.log('🔍 [VIEW] Authorization header:', authHeader);
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ [VIEW] Header Authorization manquant ou mal formaté');
    return res.status(401).json({ error: 'Token manquant' });
  }
  
  const token = authHeader.split(' ')[1];
  console.log('🔍 [VIEW] Token extrait:', token ? 'Présent' : 'Manquant');

  if (!token) {
    console.log('❌ [VIEW] Token manquant');
    return res.status(401).json({ error: 'Token manquant' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const userId = decoded.userId;
    const productId = parseInt(req.params.id);

    console.log('🔍 [VIEW] Enregistrement consultation - User:', userId, 'Product:', productId);

    // Vérifier que le produit existe
    const productCheck = await db.query('SELECT id FROM products WHERE id = $1', [productId]) as any;
    if (productCheck.rows.length === 0) {
      console.log('❌ [VIEW] Produit non trouvé:', productId);
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    // Enregistrer ou mettre à jour la consultation
    await db.query(`
      INSERT INTO product_views (user_id, product_id, viewed_at) 
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, product_id) 
      DO UPDATE SET viewed_at = CURRENT_TIMESTAMP
    `, [userId, productId]);

    console.log('✅ [VIEW] Consultation enregistrée pour user:', userId, 'product:', productId);
    return res.json({ message: 'Consultation enregistrée' });
  } catch (error) {
    console.error('❌ [VIEW] Erreur lors de l\'enregistrement de la consultation:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});


export default router; 