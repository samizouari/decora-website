const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'duzmzztqt',
  api_key: process.env.CLOUDINARY_API_KEY || '116148231676582',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'V5ri6YFWwbtFIrt5m5bAggJqHyE',
  secure: true
});

// Configuration base de données
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function migrateImages() {
  console.log('🚀 Début de la migration vers Cloudinary...');
  
  try {
    // 1. Migrer les images de catégories
    console.log('📁 Migration des images de catégories...');
    const categoriesResult = await pool.query('SELECT id, name, image_url FROM categories WHERE image_url IS NOT NULL');
    
    for (const category of categoriesResult.rows) {
      if (category.image_url && category.image_url.startsWith('/uploads/')) {
        const localPath = path.join(__dirname, '..', category.image_url);
        
        if (fs.existsSync(localPath)) {
          try {
            const result = await cloudinary.uploader.upload(localPath, {
              folder: 'decora/categories',
              resource_type: 'auto',
              quality: 'auto',
              fetch_format: 'auto',
              public_id: `category-${category.id}`
            });
            
            await pool.query('UPDATE categories SET image_url = $1 WHERE id = $2', [result.secure_url, category.id]);
            console.log(`✅ Catégorie ${category.name} migrée: ${result.secure_url}`);
          } catch (error) {
            console.error(`❌ Erreur migration catégorie ${category.name}:`, error.message);
          }
        } else {
          console.warn(`⚠️ Fichier non trouvé: ${localPath}`);
        }
      }
    }
    
    // 2. Migrer les images de produits
    console.log('📁 Migration des images de produits...');
    const productsResult = await pool.query('SELECT id, name, image_url FROM products WHERE image_url IS NOT NULL');
    
    for (const product of productsResult.rows) {
      if (product.image_url && product.image_url.startsWith('/uploads/')) {
        const localPath = path.join(__dirname, '..', product.image_url);
        
        if (fs.existsSync(localPath)) {
          try {
            const result = await cloudinary.uploader.upload(localPath, {
              folder: 'decora/products',
              resource_type: 'auto',
              quality: 'auto',
              fetch_format: 'auto',
              public_id: `product-${product.id}`
            });
            
            await pool.query('UPDATE products SET image_url = $1 WHERE id = $2', [result.secure_url, product.id]);
            console.log(`✅ Produit ${product.name} migré: ${result.secure_url}`);
          } catch (error) {
            console.error(`❌ Erreur migration produit ${product.name}:`, error.message);
          }
        } else {
          console.warn(`⚠️ Fichier non trouvé: ${localPath}`);
        }
      }
    }
    
    // 3. Migrer les images de la table product_images
    console.log('📁 Migration des images de product_images...');
    const productImagesResult = await pool.query('SELECT id, product_id, image_url FROM product_images WHERE image_url IS NOT NULL');
    
    for (const productImage of productImagesResult.rows) {
      if (productImage.image_url && productImage.image_url.startsWith('/uploads/')) {
        const localPath = path.join(__dirname, '..', productImage.image_url);
        
        if (fs.existsSync(localPath)) {
          try {
            const result = await cloudinary.uploader.upload(localPath, {
              folder: 'decora/products',
              resource_type: 'auto',
              quality: 'auto',
              fetch_format: 'auto',
              public_id: `product-${productImage.product_id}-${productImage.id}`
            });
            
            await pool.query('UPDATE product_images SET image_url = $1 WHERE id = $2', [result.secure_url, productImage.id]);
            console.log(`✅ Image produit ${productImage.id} migrée: ${result.secure_url}`);
          } catch (error) {
            console.error(`❌ Erreur migration image produit ${productImage.id}:`, error.message);
          }
        } else {
          console.warn(`⚠️ Fichier non trouvé: ${localPath}`);
        }
      }
    }
    
    console.log('🎉 Migration terminée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  } finally {
    await pool.end();
  }
}

// Exécuter la migration
migrateImages();
