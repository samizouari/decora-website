import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import db from '../database/connection';

const router = express.Router();

// Validation pour les catégories
const categoryValidation = [
  body('name').notEmpty().withMessage('Le nom de la catégorie est requis'),
  body('description').optional().isString().withMessage('La description doit être une chaîne de caractères'),
  body('parent_id').optional().isInt({ min: 1 }).withMessage('parent_id doit être un entier positif')
];

// GET /api/categories - Récupérer toutes les catégories (à plat)
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await db.query('SELECT * FROM categories ORDER BY name') as any;
    return res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/categories/tree - Récupérer l'arbre catégories -> sous-catégories
router.get('/tree', async (req: Request, res: Response) => {
  try {
    const result = await db.query('SELECT * FROM categories ORDER BY name') as any;
    const categories = result.rows;
    
    const byId: Record<number, any> = {};
    categories.forEach((c: any) => {
      byId[c.id] = { ...c, children: [] };
    });
    
    const roots: any[] = [];
    categories.forEach((c: any) => {
      if (c.parent_id) {
        if (byId[c.parent_id]) {
          byId[c.parent_id].children.push(byId[c.id]);
        } else {
          roots.push(byId[c.id]);
        }
      } else {
        roots.push(byId[c.id]);
      }
    });
    
    return res.json(roots);
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/categories/:id - Récupérer une catégorie par ID
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    const result = await db.query('SELECT * FROM categories WHERE id = $1', [id]) as any;
    const category = result.rows[0];
    
    if (!category) {
      return res.status(404).json({ error: 'Catégorie non trouvée' });
    }
    
    return res.json(category);
  } catch (error) {
    console.error('Erreur lors de la récupération de la catégorie:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/categories - Créer une nouvelle catégorie
router.post('/', categoryValidation, async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, description, image_url, parent_id } = req.body;

  try {
    const result = await db.query(
      'INSERT INTO categories (name, description, image_url, parent_id) VALUES ($1, $2, $3, $4) RETURNING id',
      [name, description, image_url, parent_id || null]
    ) as any;

    const categoryId = result.rows[0].id;

    const categoryResult = await db.query(
      'SELECT * FROM categories WHERE id = $1',
      [categoryId]
    ) as any;

    return res.status(201).json(categoryResult.rows[0]);
  } catch (error) {
    console.error('Erreur lors de la création de la catégorie:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/categories/:id - Mettre à jour une catégorie
router.put('/:id', categoryValidation, async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { name, description, image_url, parent_id } = req.body;

  try {
    const result = await db.query(
      `UPDATE categories 
       SET name = $1, description = $2, image_url = $3, parent_id = $4, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $5`,
      [name, description, image_url, parent_id || null, id]
    ) as any;

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Catégorie non trouvée' });
    }

    const categoryResult = await db.query(
      'SELECT * FROM categories WHERE id = $1',
      [id]
    ) as any;

    return res.json(categoryResult.rows[0]);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la catégorie:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/categories/:id - Supprimer une catégorie
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    // Get all category ids to delete (id + its direct children)
    const categoriesResult = await db.query(
      'SELECT id FROM categories WHERE id = $1 OR parent_id = $1', 
      [id]
    ) as any;
    
    const ids = categoriesResult.rows.map((r: any) => r.id);
    
    if (ids.length === 0) {
      return res.status(404).json({ error: 'Catégorie non trouvée' });
    }
    
    // Create placeholders for PostgreSQL ($1, $2, etc.)
    const placeholders = ids.map((_: any, index: number) => `$${index + 1}`).join(',');
    
    // Delete products referencing these categories
    await db.query(`DELETE FROM products WHERE category_id IN (${placeholders})`, ids);
    
    // Delete the subcategories first
    await db.query('DELETE FROM categories WHERE parent_id = $1', [id]);
    
    // Delete the category itself
    const result = await db.query('DELETE FROM categories WHERE id = $1', [id]) as any;
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Catégorie non trouvée' });
    }
    
    return res.json({ message: 'Catégorie et éléments associés supprimés avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la catégorie:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router; 