const { Pool } = require('pg');
const path = require('path');

// Charger les variables d'environnement
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

console.log('🔍 DATABASE_URL:', process.env.DATABASE_URL ? 'Configuré' : 'Non configuré');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function testQuotes() {
  try {
    console.log('🔍 Test de connexion à la base de données...');
    
    // Test de connexion
    const client = await pool.connect();
    console.log('✅ Connexion réussie');
    
    // Vérifier toutes les commandes
    console.log('\n📊 Vérification des commandes...');
    const ordersResult = await client.query('SELECT COUNT(*) as total FROM orders');
    console.log(`Total des commandes: ${ordersResult.rows[0].total}`);
    
    // Vérifier les commandes récentes
    const recentOrders = await client.query(`
      SELECT id, name, email, subject, status, created_at 
      FROM orders 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log('\n📋 Dernières commandes:');
    if (recentOrders.rows.length > 0) {
      recentOrders.rows.forEach((order, index) => {
        console.log(`${index + 1}. ID: ${order.id}, Nom: ${order.name}, Email: ${order.email}, Statut: ${order.status}, Date: ${order.created_at}`);
      });
    } else {
      console.log('Aucune commande trouvée');
    }
    
    // Test de la requête utilisée par l'admin
    console.log('\n🔍 Test de la requête admin...');
    const adminQuery = `
      SELECT o.*, 
             COALESCE(u.first_name, o.name) as name,
             COALESCE(u.last_name, '') as last_name,
             COALESCE(u.email, o.email) as email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `;
    
    const adminResult = await client.query(adminQuery);
    console.log(`Résultat de la requête admin: ${adminResult.rows.length} entrées`);
    
    if (adminResult.rows.length > 0) {
      console.log('Premiers résultats admin:');
      adminResult.rows.slice(0, 3).forEach((row, index) => {
        console.log(`${index + 1}. ID: ${row.id}, Nom: ${row.name}, Email: ${row.email}, Statut: ${row.status}`);
      });
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await pool.end();
  }
}

testQuotes();
