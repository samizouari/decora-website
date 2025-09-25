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
router.get('/', (req: Request, res: Response) => {
  db.all(
    'SELECT * FROM categories ORDER BY name',
    [],
    (err, categories) => {
      if (err) {
        console.error('Erreur lors de la récupération des catégories:', err.message);
        return res.status(500).json({ error: 'Erreur serveur' });
      }
      return res.json(categories);
    }
  );
});

// GET /api/categories/tree - Récupérer l'arbre catégories -> sous-catégories
router.get('/tree', (req: Request, res: Response) => {
  db.all('SELECT * FROM categories', [], (err, categories: any[]) => {
    if (err) {
      console.error('Erreur lors de la récupération des catégories:', err.message);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
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
  });
});

// GET /api/categories/:id - Récupérer une catégorie par ID
router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  
  db.get(
    'SELECT * FROM categories WHERE id = ?',
    [id],
    (err, category) => {
      if (err) {
        console.error('Erreur lors de la récupération de la catégorie:', err.message);
        return res.status(500).json({ error: 'Erreur serveur' });
      }
      
      if (!category) {
        return res.status(404).json({ error: 'Catégorie non trouvée' });
      }
      
      return res.json(category);
    }
  );
});

// POST /api/categories - Créer une nouvelle catégorie
router.post('/', categoryValidation, (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, description, image_url, parent_id } = req.body;

  return db.run(
    'INSERT INTO categories (name, description, image_url, parent_id) VALUES (?, ?, ?, ?)',
    [name, description, image_url, parent_id || null],
    function(err, result) {
      if (err) {
        console.error('Erreur lors de la création de la catégorie:', err.message);
        return res.status(500).json({ error: 'Erreur serveur' });
      }

      return db.get(
        'SELECT * FROM categories WHERE id = ?',
        [result.lastID],
        (err, category) => {
          if (err) {
            console.error('Erreur lors de la récupération de la catégorie créée:', err.message);
            return res.status(500).json({ error: 'Erreur serveur' });
          }
          
          return res.status(201).json(category);
        }
      );
    }
  );
});

// PUT /api/categories/:id - Mettre à jour une catégorie
router.put('/:id', categoryValidation, (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { name, description, image_url, parent_id } = req.body;

  return db.run(
    `UPDATE categories 
     SET name = ?, description = ?, image_url = ?, parent_id = ?, updated_at = CURRENT_TIMESTAMP 
     WHERE id = ?`,
    [name, description, image_url, parent_id || null, id],
    function(err, result) {
      if (err) {
        console.error('Erreur lors de la mise à jour de la catégorie:', err.message);
        return res.status(500).json({ error: 'Erreur serveur' });
      }

      if (result.changes === 0) {
        return res.status(404).json({ error: 'Catégorie non trouvée' });
      }

      return db.get(
        'SELECT * FROM categories WHERE id = ?',
        [id],
        (err, category) => {
          if (err) {
            console.error('Erreur lors de la récupération de la catégorie mise à jour:', err.message);
            return res.status(500).json({ error: 'Erreur serveur' });
          }
          
          return res.json(category);
        }
      );
    }
  );
});

// DELETE /api/categories/:id - Supprimer une catégorie
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  // Cascade: delete products in this category and its subcategories, then delete subcategories, then category
  return db.serialize(() => {
    // Get all category ids to delete (id + its direct children)
    return db.all('SELECT id FROM categories WHERE id = ? OR parent_id = ?', [id, id], (err, rows: any[]) => {
      if (err) {
        console.error('Erreur lors de la récupération des sous-catégories:', err.message);
        return res.status(500).json({ error: 'Erreur serveur' });
      }
      const ids = rows.map(r => r.id);
      const placeholders = ids.map(() => '?').join(',');
      // Delete products referencing these categories
      return db.run(`DELETE FROM products WHERE category_id IN (${placeholders})`, ids, function(prodErr) {
        if (prodErr) {
          console.error('Erreur lors de la suppression des produits:', prodErr.message);
          return res.status(500).json({ error: 'Erreur serveur' });
        }
        // Delete the subcategories first
        return db.run(`DELETE FROM categories WHERE parent_id = ?`, [id], function(subErr) {
          if (subErr) {
            console.error('Erreur lors de la suppression des sous-catégories:', subErr.message);
            return res.status(500).json({ error: 'Erreur serveur' });
          }
          // Delete the category itself
          return db.run('DELETE FROM categories WHERE id = ?', [id], function(catErr, result) {
            if (catErr) {
              console.error('Erreur lors de la suppression de la catégorie:', catErr.message);
              return res.status(500).json({ error: 'Erreur serveur' });
            }
            if (result.changes === 0) {
              return res.status(404).json({ error: 'Catégorie non trouvée' });
            }
            return res.json({ message: 'Catégorie et éléments associés supprimés avec succès' });
          });
        });
      });
    });
  });
});

export default router; 