const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '..', 'database', 'decora.db');
const db = new sqlite3.Database(dbPath);

const parents = ['Bureaux', 'Tables', 'Chaises'];
const childrenMap = {
  'Bureaux': [
    'Bureau simple',
    'Bureau avec retour',
    'Bureau sur crédence',
    'Bureau opérateur',
    'Bureau cadre',
    'Bureau de direction',
  ],
  'Tables': [
    'Table basse',
    'Table de réunion',
  ],
  'Chaises': []
};

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, function(err, row) {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, function(err, rows) {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function ensureParent(name) {
  const existing = await get('SELECT id FROM categories WHERE name = ? AND (parent_id IS NULL OR parent_id = 0)', [name]);
  if (existing && existing.id) return existing.id;
  const res = await run('INSERT OR IGNORE INTO categories (name, description, parent_id) VALUES (?, ?, NULL)', [name, null]);
  const recheck = await get('SELECT id FROM categories WHERE name = ? AND (parent_id IS NULL OR parent_id = 0)', [name]);
  return recheck?.id;
}

async function ensureChild(parentId, name) {
  const existing = await get('SELECT id FROM categories WHERE name = ? AND parent_id = ?', [name, parentId]);
  if (existing && existing.id) return existing.id;
  const res = await run('INSERT OR IGNORE INTO categories (name, description, parent_id) VALUES (?, ?, ?)', [name, null, parentId]);
  const recheck = await get('SELECT id FROM categories WHERE name = ? AND parent_id = ?', [name, parentId]);
  return recheck?.id;
}

async function main() {
  try {
    // Build allowed set (parents + their children)
    const allowed = new Set();
    for (const p of parents) {
      allowed.add(p);
      for (const c of (childrenMap[p] || [])) {
        allowed.add(c);
      }
    }

    // Create/ensure parents and children
    const parentIds = {};
    for (const p of parents) {
      const pid = await ensureParent(p);
      parentIds[p] = pid;
    }
    for (const p of parents) {
      for (const c of (childrenMap[p] || [])) {
        await ensureChild(parentIds[p], c);
      }
    }

    // Collect categories to delete (not in allowed set)
    const allCats = await all('SELECT id, name FROM categories');
    const toDelete = allCats.filter(row => !allowed.has(row.name));
    const toDeleteIds = toDelete.map(r => r.id);

    if (toDeleteIds.length) {
      // Also include their direct children
      const children = await all(`SELECT id FROM categories WHERE parent_id IN (${toDeleteIds.map(()=>'?').join(',')})`, toDeleteIds);
      const childIds = children.map(r => r.id);
      const allIds = toDeleteIds.concat(childIds);
      const placeholders = allIds.map(()=>'?').join(',');

      // Delete products referencing these categories
      await run(`DELETE FROM products WHERE category_id IN (${placeholders})`, allIds);
      // Delete categories (children first via FK-less manual ordering)
      if (childIds.length) {
        await run(`DELETE FROM categories WHERE id IN (${childIds.map(()=>'?').join(',')})`, childIds);
      }
      await run(`DELETE FROM categories WHERE id IN (${placeholders})`, allIds);
      console.log(`Supprimé catégories non autorisées: ${toDelete.map(r=>r.name).join(', ')}`);
    } else {
      console.log('Aucune catégorie à supprimer.');
    }

    console.log('Synchronisation des catégories terminée.');
  } catch (e) {
    console.error('Erreur sync categories:', e);
    process.exit(1);
  } finally {
    db.close();
  }
}

main();


