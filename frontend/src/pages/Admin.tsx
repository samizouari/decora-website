import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from '../contexts/AuthContext';

interface DashboardStats {
  products: number;
  categories: number;
  orders: number;
  users: number;
  pendingOrders: number;
}

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, token } = useAuth();

  useEffect(() => {
    // Vérifier si l'utilisateur est admin
    if (!isAuthenticated || !isAdmin) {
      navigate('/login');
      return;
    }

    if (activeTab === 'dashboard') {
      fetchDashboardStats();
    }
  }, [activeTab, navigate, isAuthenticated, isAdmin]);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.ADMIN.DASHBOARD, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    // Le logout est maintenant géré par le contexte
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Administration Decora</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Connecté en tant qu'administrateur
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <nav className="flex space-x-8 mb-8">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              activeTab === 'dashboard'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              activeTab === 'products'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Produits
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              activeTab === 'categories'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Catégories
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              activeTab === 'orders'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Demandes de devis
          </button>
        </nav>

        {/* Content */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'dashboard' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Tableau de bord</h2>
              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Produits</p>
                        <p className="text-2xl font-semibold text-gray-900">{stats.products}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-6 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Catégories</p>
                        <p className="text-2xl font-semibold text-gray-900">{stats.categories}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 p-6 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Demandes de devis</p>
                        <p className="text-2xl font-semibold text-gray-900">{stats.orders}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 p-6 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Clients</p>
                        <p className="text-2xl font-semibold text-gray-900">{stats.users}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 p-6 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">En attente</p>
                        <p className="text-2xl font-semibold text-gray-900">{stats.pendingOrders}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'products' && (
            <div className="p-6">
              <ProductManagement />
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="p-6">
              <CategoryManagement />
            </div>
          )}

          {activeTab === 'quotes' && (
            <div className="p-6">
              <QuoteManagement />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const handleDeleteProduct = async (productId: number, fetchProducts: () => Promise<void>) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_ENDPOINTS.ADMIN.PRODUCTS}/${productId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      // Recharger la liste des produits
      await fetchProducts();
      toast.success('Produit supprimé avec succès');
    } else {
      const errorData = await response.json();
      toast.error(errorData.error || 'Erreur lors de la suppression');
    }
  } catch (error) {
    console.error('Erreur:', error);
    toast.error('Erreur lors de la suppression');
  }
};

const toggleProductVisibility = async (productId: number, isActive: boolean, fetchProducts: () => Promise<void>) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_ENDPOINTS.ADMIN.PRODUCTS}/${productId}/visibility`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ is_active: isActive })
    });

    if (response.ok) {
      // Recharger la liste des produits
      await fetchProducts();
      toast.success(`Produit ${isActive ? 'activé' : 'désactivé'} avec succès`);
    } else {
      const errorData = await response.json();
      toast.error(errorData.error || 'Erreur lors de la mise à jour de la visibilité');
    }
  } catch (error) {
    console.error('Erreur:', error);
    toast.error('Erreur lors de la mise à jour de la visibilité');
  }
};

// Composant de gestion des produits
const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.ADMIN.PRODUCTS, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.CATEGORIES_TREE);
      if (response.ok) {
        const data = await response.json();
        // Aplatir la hiérarchie pour l'affichage dans le select
        const flatCategories: any[] = [];
        const flattenCategories = (categories: any[], level = 0) => {
          categories.forEach((category: any) => {
            flatCategories.push({
              ...category,
              displayName: '  '.repeat(level) + category.name
            });
            if (category.children && category.children.length > 0) {
              flattenCategories(category.children, level + 1);
            }
          });
        };
        flattenCategories(data);
        setCategories(flatCategories);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Gestion des produits</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
        >
          Ajouter un produit
        </button>
      </div>

      {showForm && (
        <ProductForm
          categories={categories}
          onClose={() => {
            setShowForm(false);
            setEditingProduct(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setEditingProduct(null);
            fetchProducts();
          }}
          product={editingProduct}
        />
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Produit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Catégorie
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Visibilité
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product: any) => (
              <tr key={product.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {product.image_url && (
                      <img
                        className="h-10 w-10 rounded-full object-cover mr-3"
                        src={`/uploads${product.image_url?.replace('/uploads', '')}`}
                        alt={product.name}
                      />
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.description}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {product.category_name || 'Aucune catégorie'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => toggleProductVisibility(product.id, !product.is_active, fetchProducts)}
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      product.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {product.is_active ? 'Visible' : 'Masqué'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => {
                      setEditingProduct(product);
                      setShowForm(true);
                    }}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product.id, fetchProducts)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Composant de gestion des catégories
const CategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.CATEGORIES);
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.ADMIN.CATEGORIES}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchCategories();
      } else {
        toast.error('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Gestion des catégories</h2>
        <button
          onClick={() => {
            setEditingCategory(null);
            setShowForm(true);
          }}
          className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
        >
          Ajouter une catégorie
        </button>
      </div>

      {showForm && (
        <CategoryForm
          onClose={() => {
            setShowForm(false);
            setEditingCategory(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setEditingCategory(null);
            fetchCategories();
          }}
          category={editingCategory}
        />
      )}

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nom
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.map((category: any) => (
              <tr key={category.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {category.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {category.description || 'Aucune description'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => {
                      setEditingCategory(category);
                      setShowForm(true);
                    }}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Composant de gestion des demandes de devis
const QuoteManagement: React.FC = () => {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔍 [ADMIN] QuoteManagement component mounted, fetching quotes...');
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('🔍 [ADMIN] Fetching quotes from:', API_ENDPOINTS.ADMIN.QUOTES);
      const response = await fetch(API_ENDPOINTS.ADMIN.QUOTES, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('🔍 [ADMIN] Quotes response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 [ADMIN] Quotes data received:', data);
        setQuotes(data);
      } else {
        console.error('🔍 [ADMIN] Quotes response error:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des demandes de devis:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuoteStatus = async (id: number, status: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.ADMIN.QUOTES}/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        fetchQuotes();
      } else {
        toast.error('Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new': return 'Nouvelle demande';
      case 'processing': return 'En cours';
      case 'completed': return 'Devis envoyé';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  };

  console.log('🔍 [ADMIN] QuoteManagement render - loading:', loading, 'quotes count:', quotes.length);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        <p className="ml-3 text-gray-600">Chargement des demandes de devis...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Gestion des demandes de devis</h2>
        <div className="text-sm text-gray-600">
          {quotes.length} demande{quotes.length > 1 ? 's' : ''}
        </div>
      </div>

      {quotes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Aucune demande de devis pour le moment</p>
          <p className="text-gray-400 text-sm mt-2">Les demandes de devis apparaîtront ici une fois soumises</p>
          <div className="mt-4 text-xs text-gray-400">
            <p>Debug: quotes.length = {quotes.length}</p>
            <p>Debug: loading = {loading.toString()}</p>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sujet
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {quotes.map((quote: any) => (
                <tr key={quote.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{quote.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {quote.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {quote.email}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {quote.subject}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(quote.status)}`}>
                      {getStatusLabel(quote.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(quote.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <select
                        value={quote.status}
                        onChange={(e) => updateQuoteStatus(quote.id, e.target.value)}
                        className="text-xs border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="new">Nouvelle demande</option>
                        <option value="processing">En cours</option>
                        <option value="completed">Devis envoyé</option>
                        <option value="cancelled">Annulée</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Composant de formulaire de catégorie
const CategoryForm: React.FC<{
  onClose: () => void;
  onSuccess: () => void;
  category?: any;
}> = ({ onClose, onSuccess, category }) => {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const url = category 
        ? `${API_ENDPOINTS.ADMIN.CATEGORIES}/${category.id}`
        : API_ENDPOINTS.ADMIN.CATEGORIES;
      
      const response = await fetch(url, {
        method: category ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        onSuccess();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {category ? 'Modifier la catégorie' : 'Ajouter une catégorie'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nom *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Nom de la catégorie"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Description de la catégorie"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 disabled:opacity-50"
            >
              {loading ? 'Sauvegarde...' : (category ? 'Modifier' : 'Ajouter')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Composant de formulaire de produit
const ProductForm: React.FC<{
  categories: any[];
  onClose: () => void;
  onSuccess: () => void;
  product?: any;
}> = ({ categories, onClose, onSuccess, product }) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    category_id: product?.category_id || '',
    stock_quantity: product?.stock_quantity || '',
    dimensions: product?.dimensions || '',
    materials: product?.materials || ''
  });
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages(files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key as keyof typeof formData]) {
          formDataToSend.append(key, formData[key as keyof typeof formData]);
        }
      });
      
      // Ajouter les images
      images.forEach((image) => {
        formDataToSend.append('images', image);
      });

      const token = localStorage.getItem('token');
      const url = product 
        ? `${API_ENDPOINTS.ADMIN.PRODUCTS}/${product.id}`
        : API_ENDPOINTS.ADMIN.PRODUCTS;
      
      const response = await fetch(url, {
        method: product ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (response.ok) {
        onSuccess();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {product ? 'Modifier le produit' : 'Ajouter un produit'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nom *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                rows={3}
                placeholder="Description du produit..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Catégorie</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">Sélectionner une catégorie (optionnel)</option>
                {categories.map((category: any) => (
                  <option key={category.id} value={category.id}>
                    {category.displayName || category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Stock (optionnel)</label>
              <input
                type="number"
                value={formData.stock_quantity || ''}
                onChange={(e) => setFormData({...formData, stock_quantity: e.target.value ? parseInt(e.target.value) : null})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Quantité en stock (optionnel)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Dimensions</label>
              <input
                type="text"
                value={formData.dimensions}
                onChange={(e) => setFormData({...formData, dimensions: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="ex: L200xP100xH75 cm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Matériaux</label>
              <input
                type="text"
                value={formData.materials}
                onChange={(e) => setFormData({...formData, materials: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="ex: Bois massif, Acier"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Images (jusqu'à 10)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="mt-1 block w-full"
              />
              {images.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">{images.length} image(s) sélectionnée(s)</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {images.map((image, index) => (
                      <div key={index} className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {image.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Sauvegarde...' : (product ? 'Modifier' : 'Ajouter')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};


export default Admin; 