import db from './connection';

const run = (query: string) => {
  return new Promise<void>((resolve, reject) => {
    db.run(query, [], (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
};

export async function initDatabase(): Promise<void> {
  const queries = [
    `CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      parent_id INTEGER,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL,
      category_id INTEGER,
      image_url TEXT,
      stock_quantity INTEGER DEFAULT 0,
      dimensions TEXT,
      materials TEXT,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories (id)
    )`,
    `CREATE TABLE IF NOT EXISTS product_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      display_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      phone TEXT,
      role TEXT DEFAULT 'customer',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      shipping_address TEXT,
      billing_address TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`,
    `CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      product_id INTEGER,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders (id),
      FOREIGN KEY (product_id) REFERENCES products (id)
    )`,
    `CREATE TABLE IF NOT EXISTS contact_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'new',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  for (const query of queries) {
    await run(query);
  }

  // Ensure parent_id column exists on legacy databases
  await new Promise<void>((resolve) => {
    db.all(`PRAGMA table_info(categories)`, [], (err, rows: any[]) => {
      if (err) {
        return resolve();
      }
      const hasParentId = Array.isArray(rows) && rows.some((r: any) => r.name === 'parent_id');
      if (hasParentId) {
        return resolve();
      }
      db.run(`ALTER TABLE categories ADD COLUMN parent_id INTEGER`, [], () => resolve());
    });
  });

  await insertInitialData();
}

async function insertInitialData(): Promise<void> {
  return new Promise(async (resolve, reject) => {
    db.get('SELECT COUNT(*) as count FROM categories', [], async (err, row: any) => {
      if (err) return reject(err);
      if (row.count > 0) return resolve();

      console.log('Insertion des données initiales...');
      
      try {
        // Insert top-level categories
        await run(`
          INSERT INTO categories (name, description) VALUES
          ('Rideaux', 'Une large gamme de rideaux élégants pour toutes les pièces.'),
          ('Voilages', 'Voilages délicats pour un effet de transparence'),
          ('Stores', 'Stores modernes et fonctionnels'),
          ('Accessoires', 'Accessoires de décoration pour rideaux'),
          ('Tissus', 'Tissus de qualité pour rideaux personnalisés'),
          ('Canapés', 'Canapés confortables et design pour votre salon.'),
          ('Décoration', 'Objets de décoration pour sublimer votre intérieur.'),
          ('Chaises', 'Chaises pour tous les goûts et tous les usages.'),
          ('Bureau', 'Bureaux fonctionnels et esthétiques pour votre espace de travail.'),
          ('Tables', 'Tables de toutes tailles et de tous styles.')
          ON CONFLICT(name) DO NOTHING;
        `);

        // Set subcategories for "Tables"
        await new Promise<void>((resolveSub, rejectSub) => {
          db.get(`SELECT id FROM categories WHERE name = ?`, ['Tables'], (err: Error | null, row: { id: number } | undefined) => {
            if (err) return rejectSub(err);
            if (!row || typeof row.id !== 'number') return rejectSub(new Error('Tables not found'));
            const tablesId = row.id;
            const stmt = db.prepare(`INSERT OR IGNORE INTO categories (name, description, parent_id) VALUES (?, ?, ?)`);
            stmt.run(['Table basse', 'Tables basses modernes et pratiques.', tablesId]);
            stmt.run(['Table de réunion', 'Tables de réunion pour vos espaces professionnels.', tablesId]);
            stmt.finalize((e: Error | null) => e ? rejectSub(e) : resolveSub());
          });
        });

        // Insérer des produits initiaux
        const products = [
          { name: 'Rideau Velours Premium', description: 'Rideau en velours de luxe', price: 89.99, category_id: 1, stock_quantity: 50 },
          { name: 'Voilage Organza', description: 'Voilage délicat en organza', price: 45.99, category_id: 2, stock_quantity: 30 },
          { name: 'Store Vénitien Aluminium', description: 'Store vénitien moderne en aluminium', price: 120.00, category_id: 3, stock_quantity: 25 }
        ];

        const prodStmt = db.prepare('INSERT INTO products (name, description, price, category_id, stock_quantity) VALUES (?, ?, ?, ?, ?)');
        for (const prod of products) {
          prodStmt.run([prod.name, prod.description, prod.price, prod.category_id, prod.stock_quantity]);
        }
        prodStmt.finalize();

        // Créer un utilisateur admin par défaut
        const bcrypt = require('bcryptjs');
        bcrypt.hash('admin123', 12).then((hashedPassword: string) => {
          const adminStmt = db.prepare('INSERT INTO users (email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)');
          adminStmt.run(['admin@decora.com', hashedPassword, 'Admin', 'Decora', 'admin']);
          adminStmt.finalize((err: Error | null) => {
            if (err) return reject(err);
            console.log('Utilisateur admin créé: admin@decora.com / admin123');
            console.log('Données initiales insérées.');
            resolve();
          });
        }).catch((error: any) => {
          console.error('Erreur lors de la création de l\'admin:', error);
          reject(error);
        });
      } catch (error) {
        console.error('Erreur lors de l\'insertion des données initiales:', error);
        reject(error);
      }
    });
  });
} 