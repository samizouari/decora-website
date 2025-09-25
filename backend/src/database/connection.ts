import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Détecter l'environnement
const isProduction = process.env.NODE_ENV === 'production';
const usePostgreSQL = isProduction || process.env.DATABASE_URL;

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
      const schemaPath = path.join(__dirname, 'init-postgresql.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
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