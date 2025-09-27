const { Pool } = require('pg');

// Configuration base de données
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function checkMigration() {
  console.log('🔍 Vérification de la migration...');
  
  try {
    // Vérifier les images de catégories
    const categoriesResult = await pool.query('SELECT COUNT(*) as total FROM categories WHERE image_url LIKE \'%cloudinary%\'');
    console.log('📁 Catégories avec images Cloudinary:', categoriesResult.rows[0].total);
    
    // Vérifier les images de produits
    const productsResult = await pool.query('SELECT COUNT(*) as total FROM products WHERE image_url LIKE \'%cloudinary%\'');
    console.log('📦 Produits avec images Cloudinary:', productsResult.rows[0].total);
    
    // Vérifier les images de product_images
    const productImagesResult = await pool.query('SELECT COUNT(*) as total FROM product_images WHERE image_url LIKE \'%cloudinary%\'');
    console.log('🖼️ Images de produits Cloudinary:', productImagesResult.rows[0].total);
    
    // Vérifier les images locales restantes
    const localCategoriesResult = await pool.query('SELECT COUNT(*) as total FROM categories WHERE image_url LIKE \'/uploads/%\'');
    console.log('📁 Catégories avec images locales:', localCategoriesResult.rows[0].total);
    
    const localProductsResult = await pool.query('SELECT COUNT(*) as total FROM products WHERE image_url LIKE \'/uploads/%\'');
    console.log('📦 Produits avec images locales:', localProductsResult.rows[0].total);
    
    const localProductImagesResult = await pool.query('SELECT COUNT(*) as total FROM product_images WHERE image_url LIKE \'/uploads/%\'');
    console.log('🖼️ Images de produits locales:', localProductImagesResult.rows[0].total);
    
    // Afficher quelques exemples d'URLs Cloudinary
    const examplesResult = await pool.query('SELECT image_url FROM product_images WHERE image_url LIKE \'%cloudinary%\' LIMIT 3');
    console.log('🔗 Exemples d\'URLs Cloudinary:');
    examplesResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.image_url}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  } finally {
    await pool.end();
  }
}

checkMigration();
