import { useState, useEffect } from 'react';
import { ShoppingCart, Trash2, Mail, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CartItem {
  id: number;
  name: string;
  description: string;
  images?: string[];
  image_url?: string;
  dimensions?: string;
  materials?: string;
  category?: {
    name: string;
  };
}

const Cart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCartItems();
  }, []);

  const loadCartItems = () => {
    // Pour l'instant, on simule des données du panier
    // Dans une vraie application, cela viendrait du localStorage ou d'une API
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
    setLoading(false);
  };

  const removeFromCart = (id: number) => {
    const updatedCart = cartItems.filter(item => item.id !== id);
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('cart');
  };

  const sendQuoteRequest = () => {
    if (cartItems.length === 0) {
      alert('Votre panier est vide');
      return;
    }

    const subject = `Demande de devis - ${cartItems.length} produit${cartItems.length > 1 ? 's' : ''}`;
    const body = `Bonjour,

Je souhaiterais recevoir un devis pour les produits suivants :

${cartItems.map((item, index) => `
${index + 1}. ${item.name}
   - Description : ${item.description}
   ${item.dimensions ? `- Dimensions : ${item.dimensions}` : ''}
   ${item.materials ? `- Matériaux : ${item.materials}` : ''}
   ${item.category ? `- Catégorie : ${item.category.name}` : ''}
`).join('')}

Pouvez-vous me faire parvenir un devis détaillé pour ces produits ?

Cordialement,
[Votre nom]`;

    const mailtoLink = `mailto:decora.bur@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
  };

  if (loading) {
    return (
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link
              to="/products"
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Retour aux produits
            </Link>
            <h1 className="text-3xl font-serif font-bold text-gray-900">
              Mon panier
            </h1>
          </div>
          {cartItems.length > 0 && (
            <button
              onClick={clearCart}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Vider le panier
            </button>
          )}
        </div>

        {cartItems.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Votre panier est vide</h2>
            <p className="text-gray-600 mb-6">Ajoutez des produits pour demander un devis</p>
            <Link
              to="/products"
              className="inline-flex items-center px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Voir les produits
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Liste des produits */}
            <div className="lg:col-span-2">
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-start space-x-4">
                      {/* Image du produit */}
                      <div className="flex-shrink-0">
                        <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden">
                          {item.images && item.images.length > 0 ? (
                            <img
                              src={item.images[0]}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <ShoppingCart className="h-8 w-8" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Informations du produit */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {item.name}
                            </h3>
                            <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                              {item.description}
                            </p>
                            {item.category && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-600 mb-2">
                                {item.category.name}
                              </span>
                            )}
                            <div className="text-sm text-gray-500 space-y-1">
                              {item.dimensions && (
                                <div>Dimensions: {item.dimensions}</div>
                              )}
                              {item.materials && (
                                <div>Matériaux: {item.materials}</div>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-600 hover:text-red-800 p-2"
                            title="Supprimer du panier"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Résumé et actions */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Résumé de votre demande
                </h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Produits sélectionnés</span>
                    <span className="font-medium">{cartItems.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type de demande</span>
                    <span className="font-medium">Devis personnalisé</span>
                  </div>
                </div>

                <div className="border-t pt-4 mb-6">
                  <p className="text-sm text-gray-600 mb-4">
                    Nous vous enverrons un devis personnalisé par email dans les plus brefs délais.
                  </p>
                </div>

                <button
                  onClick={sendQuoteRequest}
                  className="w-full bg-primary-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-600 transition-colors flex items-center justify-center mb-3"
                >
                  <Mail className="h-5 w-5 mr-2" />
                  Demander un devis
                </button>

                <button
                  onClick={() => {
                    // Valider le panier - pour l'instant on fait la même chose que demander un devis
                    sendQuoteRequest();
                  }}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Valider le panier
                </button>

                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500">
                    Ou contactez-nous directement :<br />
                    <a 
                      href="mailto:decora.bur@gmail.com"
                      className="text-primary-500 hover:text-primary-600"
                    >
                      decora.bur@gmail.com
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart 