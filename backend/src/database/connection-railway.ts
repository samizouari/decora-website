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

export default pool;

// Fonction pour exécuter des requêtes
export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};

// Fonction pour fermer la connexion
export const close = () => {
  return pool.end();
};
