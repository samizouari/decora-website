const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuration base de données
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function fixMissingImages() {
  console.log('🔍 Recherche des images manquantes...');
  
  try {
    // Récupérer toutes les images de product_images
    const productImagesResult = await pool.query('SELECT id, product_id, image_url FROM product_images WHERE image_url LIKE \'/uploads/%\'');
    
    console.log(`📊 Total d'images à vérifier: ${productImagesResult.rows.length}`);
    
    const missingImages = [];
    const existingImages = [];
    
    for (const productImage of productImagesResult.rows) {
      const localPath = path.join(__dirname, '..', productImage.image_url);
      
      if (!fs.existsSync(localPath)) {
        missingImages.push(productImage);
        console.log(`❌ Manquante: ${productImage.image_url}`);
      } else {
        existingImages.push(productImage);
        console.log(`✅ Existe: ${productImage.image_url}`);
      }
    }
    
    console.log(`\n📊 Résumé:`);
    console.log(`  - Images existantes: ${existingImages.length}`);
    console.log(`  - Images manquantes: ${missingImages.length}`);
    
    if (missingImages.length > 0) {
      console.log(`\n🗑️ Suppression des références aux images manquantes...`);
      
      for (const missingImage of missingImages) {
        await pool.query('DELETE FROM product_images WHERE id = $1', [missingImage.id]);
        console.log(`🗑️ Supprimé: ID ${missingImage.id} - ${missingImage.image_url}`);
      }
      
      console.log(`✅ ${missingImages.length} références supprimées`);
    }
    
    // Vérifier s'il reste des images existantes à migrer
    const remainingImages = await pool.query('SELECT COUNT(*) as total FROM product_images WHERE image_url LIKE \'/uploads/%\'');
    console.log(`\n📊 Images restantes à migrer: ${remainingImages.rows[0].total}`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  } finally {
    await pool.end();
  }
}

fixMissingImages();
