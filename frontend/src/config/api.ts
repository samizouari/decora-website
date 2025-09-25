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
};

export default API_BASE_URL;
