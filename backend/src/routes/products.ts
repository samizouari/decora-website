import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import db from '../database/connection';

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

// GET /api/products/:id - Récupérer un produit par ID
router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  
  return db.get(
    `SELECT p.*, c.name as category_name 
     FROM products p 
     LEFT JOIN categories c ON p.category_id = c.id 
     WHERE p.id = ? AND p.is_active = 1`,
    [id],
    (err, product) => {
      if (err) {
        console.error('Erreur lors de la récupération du produit:', err.message);
        return res.status(500).json({ error: 'Erreur serveur' });
      }
      
      if (!product) {
        return res.status(404).json({ error: 'Produit non trouvé' });
      }
      
      // Récupérer les images du produit
      return db.all(
        'SELECT image_url FROM product_images WHERE product_id = ? ORDER BY display_order',
        [id],
        (err, images: any[]) => {
          const baseUrl = `${req.protocol}://${req.get('host')}`;
          const typedProduct = product as Product;
          const productImages = images ? images.map(img => 
            img.image_url.startsWith('http') ? img.image_url : `${baseUrl}${img.image_url}`
          ) : [];
          
          const productWithFullData = {
            ...typedProduct,
            image_url: typedProduct.image_url && !typedProduct.image_url.startsWith('http') 
              ? `${baseUrl}${typedProduct.image_url}` 
              : typedProduct.image_url,
            images: productImages
          };
          
          return res.json(productWithFullData);
        }
      );
    }
  );
});

// POST /api/products - Créer un nouveau produit
router.post('/', productValidation, (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, description, price, category_id, stock_quantity, image_url } = req.body;

  return db.run(
    `INSERT INTO products (name, description, price, category_id, stock_quantity, image_url) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [name, description, price, category_id, stock_quantity, image_url],
    function(err, result) {
      if (err) {
        console.error('Erreur lors de la création du produit:', err.message);
        return res.status(500).json({ error: 'Erreur serveur' });
      }

      return db.get(
        `SELECT p.*, c.name as category_name 
         FROM products p 
         LEFT JOIN categories c ON p.category_id = c.id 
         WHERE p.id = ?`,
        [result.lastID],
        (err, product) => {
          if (err) {
            console.error('Erreur lors de la récupération du produit créé:', err.message);
            return res.status(500).json({ error: 'Erreur serveur' });
          }
          
          return res.status(201).json(product);
        }
      );
    }
  );
});

// PUT /api/products/:id - Mettre à jour un produit
router.put('/:id', productValidation, (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { name, description, price, category_id, stock_quantity, image_url } = req.body;

  return db.run(
    `UPDATE products 
     SET name = ?, description = ?, price = ?, category_id = ?, 
         stock_quantity = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP 
     WHERE id = ?`,
    [name, description, price, category_id, stock_quantity, image_url, id],
    function(err, result) {
      if (err) {
        console.error('Erreur lors de la mise à jour du produit:', err.message);
        return res.status(500).json({ error: 'Erreur serveur' });
      }

      if (result.changes === 0) {
        return res.status(404).json({ error: 'Produit non trouvé' });
      }

      return db.get(
        `SELECT p.*, c.name as category_name 
         FROM products p 
         LEFT JOIN categories c ON p.category_id = c.id 
         WHERE p.id = ?`,
        [id],
        (err, product) => {
          if (err) {
            console.error('Erreur lors de la récupération du produit mis à jour:', err.message);
            return res.status(500).json({ error: 'Erreur serveur' });
          }
          
          return res.json(product);
        }
      );
    }
  );
});

// DELETE /api/products/:id - Supprimer un produit (soft delete)
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  db.run(
    'UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [id],
    function(err, result) {
      if (err) {
        console.error('Erreur lors de la suppression du produit:', err.message);
        return res.status(500).json({ error: 'Erreur serveur' });
      }

      if (result.changes === 0) {
        return res.status(404).json({ error: 'Produit non trouvé' });
      }

      return res.json({ message: 'Produit supprimé avec succès' });
    }
  );
});

// GET /api/products/category/:categoryId - Récupérer les produits par catégorie
router.get('/category/:categoryId', (req: Request, res: Response) => {
  const { categoryId } = req.params;
  const { limit = 20, offset = 0 } = req.query;

  db.all(
    `SELECT p.*, c.name as category_name 
     FROM products p 
     LEFT JOIN categories c ON p.category_id = c.id 
     WHERE p.category_id = ? AND p.is_active = 1 
     ORDER BY p.created_at DESC 
     LIMIT ? OFFSET ?`,
    [categoryId, parseInt(limit as string), parseInt(offset as string)],
    (err, products) => {
      if (err) {
        console.error('Erreur lors de la récupération des produits par catégorie:', err.message);
        return res.status(500).json({ error: 'Erreur serveur' });
      }
      
      return res.json(products);
    }
  );
});

export default router; 