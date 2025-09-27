// Configuration de l'API
const API_BASE_URL = 'https://backend-url.up.railway.app';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
  },
  ADMIN: {
    DASHBOARD: `${API_BASE_URL}/api/admin/dashboard`,
    PRODUCTS: `${API_BASE_URL}/api/admin/products`,
    CATEGORIES: `${API_BASE_URL}/api/admin/categories`,
    QUOTES: `${API_BASE_URL}/api/admin/quotes`,
  },
  PRODUCTS: `${API_BASE_URL}/api/products`,
  CATEGORIES: `${API_BASE_URL}/api/categories`,
  CATEGORIES_TREE: `${API_BASE_URL}/api/categories/tree`,
  QUOTES: `${API_BASE_URL}/api/quotes`,
};

// Fonction utilitaire pour construire les URLs complètes des images
export const getImageUrl = (imagePath: string): string => {
  if (!imagePath) return '';
  
  // Si l'URL est déjà complète (commence par http/https), la retourner telle quelle
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Si c'est une URL Cloudinary, la retourner telle quelle
  if (imagePath.includes('cloudinary.com')) {
    return imagePath;
  }
  
  // Sinon, préfixer avec l'URL de base de l'API (pour les anciennes images locales)
  return `${API_BASE_URL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
};

// Fonction utilitaire pour traiter un tableau d'images
export const getImageUrls = (images: string[]): string[] => {
  if (!images || !Array.isArray(images)) return [];
  return images.map(getImageUrl).filter(url => url !== '');
};

export default API_BASE_URL;
