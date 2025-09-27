import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Heart, Share2, Truck, Shield, RotateCcw } from 'lucide-react';
import ImageGallery from '../components/ImageGallery';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from '../contexts/AuthContext';

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

const ProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    if (id) {
      fetchProduct(parseInt(id));
    }
  }, [id]);

  // Fonction pour enregistrer la consultation du produit
  const trackProductView = async (productId: number) => {
    if (!isAuthenticated || !token) {
      console.log('🔍 [TRACK] Utilisateur non authentifié, pas de suivi');
      return;
    }
    
    try {
      console.log('🔍 [TRACK] Enregistrement de la consultation du produit:', productId);
      const response = await fetch(`${API_ENDPOINTS.PRODUCTS}/${productId}/view`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        console.log('✅ [TRACK] Consultation enregistrée avec succès');
      } else {
        console.error('❌ [TRACK] Erreur lors de l\'enregistrement:', response.status);
      }
    } catch (error) {
      console.error('❌ [TRACK] Erreur lors du suivi de la consultation:', error);
    }
  };

  const fetchProduct = async (productId: number) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.PRODUCTS}/${productId}`);
      if (response.ok) {
        const data = await response.json();
        setProduct(data);
        
        // Enregistrer la consultation du produit
        trackProductView(productId);
      } else {
        setError('Produit non trouvé');
      }
    } catch (error) {
      console.error('Erreur lors du chargement du produit:', error);
      setError('Erreur lors du chargement du produit');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    // Ajouter le produit au panier (localStorage)
    const savedCart = localStorage.getItem('cart');
    const cart = savedCart ? JSON.parse(savedCart) : [];
    
    // Vérifier si le produit n'est pas déjà dans le panier
    const existingItem = cart.find((item: any) => item.id === product?.id);
    if (!existingItem && product) {
      cart.push({
        id: product.id,
        name: product.name,
        description: product.description,
        images: product.images,
        image_url: product.image_url,
        dimensions: product.dimensions,
        materials: product.materials,
        category: product.category
      });
      localStorage.setItem('cart', JSON.stringify(cart));
      alert(`${product.name} ajouté au panier !`);
    } else if (product) {
      alert(`${product.name} est déjà dans votre panier !`);
    }
  };

  const handleRequestQuote = () => {
    const subject = `Demande de devis - ${product?.name}`;
    const body = `Bonjour,

Je suis intéressé(e) par le produit "${product?.name}" et souhaiterais recevoir un devis personnalisé.

Informations du produit :
- Nom : ${product?.name}
- Description : ${product?.description}
${product?.dimensions ? `- Dimensions : ${product.dimensions}` : ''}
${product?.materials ? `- Matériaux : ${product.materials}` : ''}

Pouvez-vous me faire parvenir un devis détaillé ?

Cordialement,
[Votre nom]`;

    // Rediriger vers la page de devis avec les informations pré-remplies
    const params = new URLSearchParams({
      product: product?.name || '',
      subject: subject,
      message: body
    });
    
    window.location.href = `/quote?${params.toString()}`;
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.name,
        text: product?.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Lien copié dans le presse-papiers !');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du produit...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Produit non trouvé</h1>
          <p className="text-gray-600 mb-6">{error || 'Ce produit n\'existe pas'}</p>
          <button
            onClick={() => navigate('/products')}
            className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors"
          >
            Retour aux produits
          </button>
        </div>
      </div>
    );
  }

  const images = product.images || (product.image_url ? [product.image_url] : []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/products')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Retour aux produits
            </button>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleShare}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                title="Partager"
              >
                <Share2 className="h-5 w-5" />
              </button>
              <button
                className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                title="Ajouter aux favoris"
              >
                <Heart className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Galerie d'images */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-2xl shadow-lg overflow-hidden">
              <ImageGallery
                images={images}
                alt={product.name}
                className="w-full h-full"
              />
            </div>
            
            {/* Miniatures */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImageIndex === index ? 'border-primary-500' : 'border-accent-200'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} - ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Informations du produit */}
          <div className="space-y-8">
            {/* En-tête */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-600">
                  {product.category?.name || 'Aucune catégorie'}
                </span>
              </div>
              
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {product.name}
              </h1>
              
              <p className="text-lg text-gray-600 leading-relaxed">
                {product.description}
              </p>
            </div>


            {/* Spécifications */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">Spécifications</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {product.dimensions && (
                  <div className="bg-white rounded-lg p-4 border">
                    <h4 className="font-medium text-gray-900 mb-2">Dimensions</h4>
                    <p className="text-gray-600">{product.dimensions}</p>
                  </div>
                )}
                {product.materials && (
                  <div className="bg-white rounded-lg p-4 border">
                    <h4 className="font-medium text-gray-900 mb-2">Matériaux</h4>
                    <p className="text-gray-600">{product.materials}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <div className="flex space-x-4">
                <button
                  onClick={handleRequestQuote}
                  className="flex-1 bg-primary-500 text-white py-4 px-6 rounded-xl font-semibold hover:bg-primary-600 transition-colors flex items-center justify-center"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Demander un devis
                </button>
                <button
                  onClick={handleAddToCart}
                  className="px-6 py-4 border-2 border-primary-500 text-primary-500 rounded-xl font-semibold hover:bg-primary-500 hover:text-white transition-colors"
                >
                  Ajouter au panier
                </button>
              </div>
            </div>

            {/* Garanties et services */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white rounded-lg border">
                <Truck className="h-8 w-8 text-primary-500 mx-auto mb-2" />
                <h4 className="font-medium text-gray-900 mb-1">Livraison gratuite</h4>
                <p className="text-sm text-gray-600">Partout en Tunisie</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border">
                <Shield className="h-8 w-8 text-primary-500 mx-auto mb-2" />
                <h4 className="font-medium text-gray-900 mb-1">Garantie</h4>
                <p className="text-sm text-gray-600">2 ans constructeur</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border">
                <RotateCcw className="h-8 w-8 text-primary-500 mx-auto mb-2" />
                <h4 className="font-medium text-gray-900 mb-1">Retour</h4>
                <p className="text-sm text-gray-600">30 jours</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section recommandations */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Produits similaires</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Placeholder pour produits similaires */}
            <div className="bg-white rounded-lg p-4 border text-center">
              <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
              <h3 className="font-medium text-gray-900 mb-2">Produit similaire</h3>
              <p className="text-sm text-gray-600">Bientôt disponible</p>
            </div>
            <div className="bg-white rounded-lg p-4 border text-center">
              <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
              <h3 className="font-medium text-gray-900 mb-2">Produit similaire</h3>
              <p className="text-sm text-gray-600">Bientôt disponible</p>
            </div>
            <div className="bg-white rounded-lg p-4 border text-center">
              <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
              <h3 className="font-medium text-gray-900 mb-2">Produit similaire</h3>
              <p className="text-sm text-gray-600">Bientôt disponible</p>
            </div>
            <div className="bg-white rounded-lg p-4 border text-center">
              <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
              <h3 className="font-medium text-gray-900 mb-2">Produit similaire</h3>
              <p className="text-sm text-gray-600">Bientôt disponible</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
