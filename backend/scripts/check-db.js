const { Pool } = require('pg');

// Configuration base de données
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function checkDatabase() {
  console.log('🔍 Vérification de la base de données...');
  
  try {
    // Vérifier les catégories
    const categoriesResult = await pool.query('SELECT id, name, image_url FROM categories LIMIT 5');
    console.log('📁 Catégories:');
    categoriesResult.rows.forEach(cat => {
      console.log(`  - ${cat.name}: ${cat.image_url || 'Aucune image'}`);
    });
    
    // Vérifier les produits
    const productsResult = await pool.query('SELECT id, name, image_url FROM products LIMIT 5');
    console.log('📦 Produits:');
    productsResult.rows.forEach(prod => {
      console.log(`  - ${prod.name}: ${prod.image_url || 'Aucune image'}`);
    });
    
    // Vérifier les images de produits
    const productImagesResult = await pool.query('SELECT id, product_id, image_url FROM product_images LIMIT 10');
    console.log('🖼️ Images de produits:');
    productImagesResult.rows.forEach(img => {
      console.log(`  - ID ${img.id} (Produit ${img.product_id}): ${img.image_url}`);
    });
    
    // Compter le total
    const totalCategories = await pool.query('SELECT COUNT(*) as total FROM categories');
    const totalProducts = await pool.query('SELECT COUNT(*) as total FROM products');
    const totalProductImages = await pool.query('SELECT COUNT(*) as total FROM product_images');
    
    console.log(`\n📊 Totaux:`);
    console.log(`  - Catégories: ${totalCategories.rows[0].total}`);
    console.log(`  - Produits: ${totalProducts.rows[0].total}`);
    console.log(`  - Images de produits: ${totalProductImages.rows[0].total}`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  } finally {
    await pool.end();
  }
}

checkDatabase();
