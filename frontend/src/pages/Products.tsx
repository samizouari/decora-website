import { useState, useEffect } from 'react';
import { Search, Filter, Grid, List, Eye, ShoppingCart } from 'lucide-react';
import ImageGallery from '../components/ImageGallery';

interface Product {
  id: number;
  name: string;
  description: string;
  price?: number;
  category_id?: number;
  image_url?: string;
  images?: string[];
  stock_quantity: number;
  dimensions?: string;
  materials?: string;
  category?: {
    name: string;
  };
}

interface Category {
  id: number;
  name: string;
  description: string;
}

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === null || product.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: Product) => {
    // Ajouter le produit au panier (localStorage)
    const savedCart = localStorage.getItem('cart');
    const cart = savedCart ? JSON.parse(savedCart) : [];
    
    // Vérifier si le produit n'est pas déjà dans le panier
    const existingItem = cart.find((item: any) => item.id === product.id);
    if (!existingItem) {
      cart.push({
        id: product.id,
        name: product.name,
        description: product.description,
        images: product.images,
        image_url: product.image_url,
        dimensions: product.dimensions,
        materials: product.materials,
        category: categories.find(c => c.id === product.category_id)
      });
      localStorage.setItem('cart', JSON.stringify(cart));
      alert(`${product.name} ajouté au panier !`);
    } else {
      alert(`${product.name} est déjà dans votre panier !`);
    }
  };

  if (loading) {
    return (
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des produits...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif font-bold text-gray-900 mb-4">
            Notre Collection
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Découvrez notre sélection exclusive de rideaux, voilages, stores, tables et accessoires 
            pour transformer votre intérieur avec élégance et style.
          </p>
        </div>

        {/* Filtres et recherche */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Recherche */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-accent-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Filtre par catégorie */}
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
                className="border border-accent-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Toutes les catégories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Mode d'affichage */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-primary-500 text-white' : 'bg-accent-100 text-accent-600'}`}
              >
                <Grid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-primary-500 text-white' : 'bg-accent-100 text-accent-600'}`}
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Résultats */}
        <div className="mb-6">
          <p className="text-gray-600">
            {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} trouvé{filteredProducts.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Grille des produits */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <div key={product.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
                <div className="aspect-w-1 aspect-h-1 bg-gray-200">
                  <ImageGallery
                    images={product.images || (product.image_url ? [product.image_url] : [])}
                    alt={product.name}
                    className="w-full h-48"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-primary-600 bg-primary-100 px-2 py-1 rounded-full">
                      {categories.find(c => c.id === product.category_id)?.name || 'Aucune catégorie'}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {product.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      Sur demande
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => window.open(`/products/${product.id}`, '_blank')}
                        className="p-2 text-accent-600 hover:text-primary-500 transition-colors"
                        title="Voir les détails"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => addToCart(product)}
                        className="p-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                        title="Demander un devis"
                      >
                        <ShoppingCart className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Mode liste */
          <div className="space-y-4">
            {filteredProducts.map(product => (
              <div key={product.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-300">
                <div className="flex gap-6">
                  <div className="w-32 h-32 flex-shrink-0">
                    <ImageGallery
                      images={product.images || (product.image_url ? [product.image_url] : [])}
                      alt={product.name}
                      className="w-full h-full rounded-lg"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-primary-600 bg-primary-100 px-2 py-1 rounded-full">
                        {categories.find(c => c.id === product.category_id)?.name || 'Aucune catégorie'}
                      </span>
                      <span className="text-sm text-gray-500">
                        Demande de devis
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {product.name}
                    </h3>
                    <p className="text-gray-600 mb-3">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        {product.dimensions && `Dimensions: ${product.dimensions}`}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => window.open(`/products/${product.id}`, '_blank')}
                          className="px-4 py-2 text-accent-600 border border-accent-300 rounded-lg hover:border-primary-500 hover:text-primary-500 transition-colors"
                        >
                          <Eye className="h-4 w-4 inline mr-2" />
                          Détails
                        </button>
                        <button
                          onClick={() => addToCart(product)}
                          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                        >
                          <ShoppingCart className="h-4 w-4 inline mr-2" />
                          Demander un devis
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Message si aucun produit */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              Aucun produit trouvé avec ces critères.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};

export default Products; 