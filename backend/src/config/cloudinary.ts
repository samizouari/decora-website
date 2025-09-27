import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'duzmzztqt',
  api_key: process.env.CLOUDINARY_API_KEY || '116148231676582',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'V5ri6YFWwbtFIrt5m5bAggJqHyE',
  secure: true
});

export default cloudinary;

// Fonction utilitaire pour uploader une image
export const uploadImage = async (filePath: string, folder: string = 'decora'): Promise<string> => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'auto',
      quality: 'auto',
      fetch_format: 'auto'
    });
    
    console.log('✅ Image uploadée sur Cloudinary:', result.secure_url);
    return result.secure_url;
  } catch (error) {
    console.error('❌ Erreur upload Cloudinary:', error);
    throw error;
  }
};

// Fonction utilitaire pour uploader depuis un buffer
export const uploadImageFromBuffer = async (buffer: Buffer, filename: string, folder: string = 'decora'): Promise<string> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'auto',
        quality: 'auto',
        fetch_format: 'auto',
        public_id: filename.replace(/\.[^/.]+$/, '') // Enlever l'extension
      },
      (error, result) => {
        if (error) {
          console.error('❌ Erreur upload Cloudinary:', error);
          reject(error);
        } else if (result) {
          console.log('✅ Image uploadée sur Cloudinary depuis buffer');
          resolve(result.secure_url);
        } else {
          reject(new Error('No result from Cloudinary'));
        }
      }
    ).end(buffer);
  });
};

// Fonction pour supprimer une image
export const deleteImage = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
    console.log('✅ Image supprimée de Cloudinary:', publicId);
  } catch (error) {
    console.error('❌ Erreur suppression Cloudinary:', error);
    throw error;
  }
};
