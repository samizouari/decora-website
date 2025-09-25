import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Détecter l'environnement
const isProduction = process.env.NODE_ENV === 'production';
const usePostgreSQL = process.env.DATABASE_URL; // Seulement si DATABASE_URL est définie

console.log('🔍 Database configuration:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('- Using PostgreSQL:', usePostgreSQL);

// Import conditionnel de sqlite3 (seulement en développement)
let sqlite3: any = null;
if (!usePostgreSQL) {
  try {
    sqlite3 = require('sqlite3');
  } catch (err) {
    console.warn('SQLite3 not available, falling back to PostgreSQL');
  }
}

let pool: Pool | null = null;
let sqliteDb: any = null;

if (usePostgreSQL) {
  // Configuration PostgreSQL pour la production
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isProduction ? { rejectUnauthorized: false } : false,
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
  });

  const initDb = async () => {
    try {
      const client = await pool!.connect();
      
      // SQL intégré directement dans le code
      const schema = `
-- Script d'initialisation PostgreSQL pour Railway
-- Ce script crée les tables nécessaires pour Decora

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des catégories
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des produits
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    image_url VARCHAR(500),
    stock_quantity INTEGER,
    dimensions VARCHAR(100),
    materials VARCHAR(200),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des images de produits
CREATE TABLE IF NOT EXISTS product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des commandes (demandes de devis)
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertion des données initiales
INSERT INTO users (username, email, password_hash, role) VALUES 
('admin', 'admin@decora.tn', '$2a$10$R8VPT3dxdURktO3zd9XZ9.u7ylwV97w8cX4Xj6qr8spxXKNH/UUfm', 'admin')
ON CONFLICT (username) DO UPDATE SET 
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role;

-- Insertion des catégories Decora
INSERT INTO categories (name, description) VALUES 
('Bureau opérationnel', 'Bureaux pour les opérations quotidiennes'),
('Mobilier modulaire', 'Mobilier modulaire et adaptable'),
('Bureau de direction', 'Bureaux pour les dirigeants'),
('Mobilier collectivités', 'Mobilier pour les espaces collectifs'),
('Mobilier d''accueil', 'Mobilier pour les zones d''accueil'),
('Mobilier de réunion', 'Mobilier pour les salles de réunion'),
('Mobilier détente', 'Mobilier pour les espaces de détente'),
('Fauteuil de direction', 'Fauteuils pour les dirigeants'),
('Fauteuil opérateur', 'Fauteuils pour les opérateurs'),
('Fauteuil Ergonomique', 'Fauteuils ergonomiques'),
('Siège visiteur et attente', 'Sièges pour les visiteurs')
ON CONFLICT (name) DO NOTHING;

-- Création des index pour les performances
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at (avec gestion des conflits)
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `;
      
      await client.query(schema);
      client.release();
      console.log('✅ PostgreSQL database initialized or already exists.');
    } catch (err) {
      console.error('❌ Error initializing PostgreSQL database:', err);
      process.exit(1);
    }
  };

  initDb();
} else {
  // Configuration SQLite pour le développement local
  const dbPath = path.join(__dirname, '../../database.sqlite');
  sqliteDb = new sqlite3.Database(dbPath);

  sqliteDb.on('error', (err: Error) => {
    console.error('❌ SQLite error:', err);
  });

  console.log('✅ SQLite database initialized for local development.');
}

export default {
  query: (text: string, params?: any[]) => {
    if (usePostgreSQL && pool) {
      return pool.query(text, params);
    } else if (sqliteDb) {
      return new Promise((resolve, reject) => {
        sqliteDb!.all(text, params || [], (err: Error | null, rows: any[]) => {
          if (err) reject(err);
          else resolve({ rows });
        });
      });
    }
    throw new Error('No database connection available');
  },
  getClient: () => {
    if (usePostgreSQL && pool) {
      return pool.connect();
    }
    throw new Error('getClient only available for PostgreSQL');
  },
  // Unified interface for both databases
  all: (query: string, params: any[], callback: (err: Error | null, rows: any[]) => void) => {
    if (usePostgreSQL && pool) {
      pool.query(query, params)
        .then(res => callback(null, res.rows))
        .catch(err => callback(err, []));
    } else if (sqliteDb) {
      sqliteDb.all(query, params, callback);
    } else {
      callback(new Error('No database connection available'), []);
    }
  },
  run: (query: string, params: any[], callback: (err: Error | null, result: any) => void) => {
    if (usePostgreSQL && pool) {
      pool.query(query, params)
        .then(res => callback(null, { changes: res.rowCount, lastID: res.rows[0]?.id }))
        .catch(err => callback(err, null));
    } else if (sqliteDb) {
      sqliteDb.run(query, params, function(this: any, err: Error | null) {
        callback(err, { changes: this.changes, lastID: this.lastID });
      });
    } else {
      callback(new Error('No database connection available'), null);
    }
  },
  get: (query: string, params: any[], callback: (err: Error | null, row: any) => void) => {
    if (usePostgreSQL && pool) {
      pool.query(query, params)
        .then(res => callback(null, res.rows[0] || null))
        .catch(err => callback(err, null));
    } else if (sqliteDb) {
      sqliteDb.get(query, params, callback);
    } else {
      callback(new Error('No database connection available'), null);
    }
  },
  // Add missing methods for compatibility
  prepare: (query: string) => {
    if (usePostgreSQL && pool) {
      // Mock prepare method - PostgreSQL doesn't need prepared statements like SQLite
      return {
        run: (params: any[], callback?: (err: Error | null) => void) => {
          pool!.query(query, params)
            .then(() => callback && callback(null))
            .catch(err => callback && callback(err));
        },
        get: (params: any[], callback: (err: Error | null, row: any) => void) => {
          pool!.query(query, params)
            .then(res => callback(null, res.rows[0] || null))
            .catch(err => callback(err, null));
        },
        all: (params: any[], callback: (err: Error | null, rows: any[]) => void) => {
          pool!.query(query, params)
            .then(res => callback(null, res.rows))
            .catch(err => callback(err, []));
        },
        finalize: (callback?: (err: Error | null) => void) => {
          // Mock finalize method - PostgreSQL doesn't need finalization
          if (callback) callback(null);
        }
      };
    } else if (sqliteDb) {
      return sqliteDb.prepare(query);
    } else {
      throw new Error('No database connection available');
    }
  },
  serialize: (callback: () => void) => {
    if (usePostgreSQL && pool) {
      // Mock serialize method - PostgreSQL handles transactions differently
      callback();
    } else if (sqliteDb) {
      sqliteDb.serialize(callback);
    } else {
      callback();
    }
  }
};