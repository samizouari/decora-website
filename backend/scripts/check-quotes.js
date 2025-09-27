const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

console.log('🔍 DATABASE_URL:', process.env.DATABASE_URL ? 'Configuré' : 'Non configuré');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function checkQuotes() {
  try {
    console.log('🔍 Vérification des demandes de devis...');
    
    // Vérifier toutes les commandes
    const ordersResult = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    console.log(`📊 Total des commandes: ${ordersResult.rows.length}`);
    
    if (ordersResult.rows.length > 0) {
      console.log('📋 Dernières commandes:');
      ordersResult.rows.slice(0, 5).forEach((order, index) => {
        console.log(`${index + 1}. ID: ${order.id}, Nom: ${order.name}, Email: ${order.email}, Statut: ${order.status}, Date: ${order.created_at}`);
      });
    }
    
    // Vérifier les commandes avec user_id NULL (demandes de devis publiques)
    const quotesResult = await pool.query('SELECT * FROM orders WHERE user_id IS NULL ORDER BY created_at DESC');
    console.log(`📊 Demandes de devis publiques: ${quotesResult.rows.length}`);
    
    if (quotesResult.rows.length > 0) {
      console.log('📋 Demandes de devis publiques:');
      quotesResult.rows.forEach((quote, index) => {
        console.log(`${index + 1}. ID: ${quote.id}, Nom: ${quote.name}, Email: ${quote.email}, Sujet: ${quote.subject}, Statut: ${quote.status}`);
      });
    }
    
    // Test de la requête utilisée par l'admin
    const adminQuery = `
      SELECT o.*, 
             COALESCE(u.first_name, o.name) as name,
             COALESCE(u.last_name, '') as last_name,
             COALESCE(u.email, o.email) as email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `;
    
    const adminResult = await pool.query(adminQuery);
    console.log(`📊 Résultat de la requête admin: ${adminResult.rows.length} entrées`);
    
    if (adminResult.rows.length > 0) {
      console.log('📋 Résultat admin:');
      adminResult.rows.slice(0, 3).forEach((row, index) => {
        console.log(`${index + 1}. ID: ${row.id}, Nom: ${row.name}, Email: ${row.email}, Statut: ${row.status}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await pool.end();
  }
}

checkQuotes();
