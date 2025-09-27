const cloudinary = require('cloudinary').v2;

// Configuration Cloudinary
cloudinary.config({
  cloud_name: 'duzmzztqt',
  api_key: '116148231676582',
  api_secret: 'V5ri6YFWwbtFIrt5m5bAggJqHyE',
  secure: true
});

async function testCloudinary() {
  console.log('🧪 Test de connexion Cloudinary...');
  
  try {
    // Test de connexion
    const result = await cloudinary.api.ping();
    console.log('✅ Connexion Cloudinary réussie:', result);
    
    // Test d'upload d'une image
    const testImagePath = path.join(__dirname, '../uploads/image-1753002104135-796201760.png');
    
    if (fs.existsSync(testImagePath)) {
      console.log('📤 Test d\'upload d\'une image...');
      const uploadResult = await cloudinary.uploader.upload(testImagePath, {
        folder: 'decora/test',
        resource_type: 'auto',
        quality: 'auto',
        fetch_format: 'auto',
        public_id: 'test-migration'
      });
      
      console.log('✅ Upload réussi:', uploadResult.secure_url);
      
      // Supprimer l'image de test
      await cloudinary.uploader.destroy('decora/test/test-migration');
      console.log('🗑️ Image de test supprimée');
    } else {
      console.log('⚠️ Aucune image de test trouvée');
    }
    
  } catch (error) {
    console.error('❌ Erreur Cloudinary:', error);
  }
}

const fs = require('fs');
const path = require('path');

testCloudinary();
