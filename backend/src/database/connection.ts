import { Pool } from 'pg';

// Configuration pour Railway PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test de connexion
pool.on('connect', () => {
  console.log('✅ Connexion PostgreSQL Railway établie');
});

pool.on('error', (err) => {
  console.error('❌ Erreur PostgreSQL Railway:', err);
});

// Fonction pour exécuter des requêtes
export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};

// Fonction pour fermer la connexion
export const close = () => {
  return pool.end();
};

// Export par défaut pour compatibilité avec le code existant
export default {
  all: (sql: string, params: any[] = [], callback: (err: any, rows: any[]) => void) => {
    pool.query(sql, params)
      .then(result => callback(null, result.rows))
      .catch(err => callback(err, []));
  },
  run: (sql: string, params: any[] = [], callback?: (err: any) => void) => {
    pool.query(sql, params)
      .then(() => callback && callback(null))
      .catch(err => callback && callback(err));
  },
  get: (sql: string, params: any[] = [], callback: (err: any, row: any) => void) => {
    pool.query(sql, params)
      .then(result => callback(null, result.rows[0] || null))
      .catch(err => callback(err, null));
  }
};