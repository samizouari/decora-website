import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { API_ENDPOINTS } from '../config/api'
import { 
  User, 
  FileText, 
  Eye, 
  Clock, 
  TrendingUp,
  Package,
  Star,
  Settings
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Quote {
  id: number
  subject: string
  message: string
  status: 'new' | 'processing' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
}

interface ViewedProduct {
  id: number
  name: string
  description: string
  price: number
  image_url: string
  viewed_at: string
  category_name: string
}

const UserDashboard = () => {
  const { user, token } = useAuth()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [viewedProducts, setViewedProducts] = useState<ViewedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'quotes' | 'history' | 'profile'>('overview')

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      
      // Récupérer les demandes de devis de l'utilisateur
      const quotesResponse = await fetch(API_ENDPOINTS.QUOTES, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (quotesResponse.ok) {
        const quotesData = await quotesResponse.json()
        setQuotes(quotesData)
      }

      // Récupérer l'historique des produits consultés
      console.log('🔍 [DASHBOARD] Récupération de l\'historique des produits...');
      const historyResponse = await fetch(`${API_ENDPOINTS.PRODUCTS}/history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (historyResponse.ok) {
        const historyData = await historyResponse.json()
        console.log('🔍 [DASHBOARD] Historique reçu:', historyData);
        setViewedProducts(historyData)
      } else {
        console.error('❌ [DASHBOARD] Erreur lors de la récupération de l\'historique:', historyResponse.status);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
      toast.error('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800'
      case 'processing': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new': return 'Nouvelle demande'
      case 'processing': return 'En cours de traitement'
      case 'completed': return 'Devis envoyé'
      case 'cancelled': return 'Annulée'
      default: return status
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de votre espace personnel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Bonjour, {user?.first_name || user?.username} 👋
              </h1>
              <p className="text-gray-600">Bienvenue dans votre espace personnel Decora</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Membre depuis</p>
                <p className="font-medium">{formatDate(user?.created_at || '')}</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Vue d\'ensemble', icon: TrendingUp },
              { id: 'quotes', label: 'Mes demandes', icon: FileText },
              { id: 'history', label: 'Historique', icon: Clock },
              { id: 'profile', label: 'Profil', icon: Settings }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Contenu des onglets */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Demandes de devis</p>
                    <p className="text-2xl font-bold text-gray-900">{quotes.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Eye className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Produits consultés</p>
                    <p className="text-2xl font-bold text-gray-900">{viewedProducts.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">En cours</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {quotes.filter(q => q.status === 'processing').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Star className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Terminées</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {quotes.filter(q => q.status === 'completed').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dernières demandes de devis */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Dernières demandes de devis</h3>
              </div>
              <div className="p-6">
                {quotes.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Aucune demande de devis pour le moment</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Vos demandes de devis apparaîtront ici une fois soumises
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {quotes.slice(0, 3).map((quote) => (
                      <div key={quote.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{quote.subject}</p>
                          <p className="text-sm text-gray-600">{formatDate(quote.created_at)}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(quote.status)}`}>
                          {getStatusLabel(quote.status)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Produits récemment consultés */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Produits récemment consultés</h3>
              </div>
              <div className="p-6">
                {viewedProducts.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Aucun produit consulté récemment</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Votre historique de navigation apparaîtra ici
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {viewedProducts.slice(0, 6).map((product) => (
                      <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="aspect-w-16 aspect-h-9 mb-3">
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        </div>
                        <h4 className="font-medium text-gray-900 truncate">{product.name}</h4>
                        <p className="text-sm text-gray-600">{product.category_name}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Consulté le {formatDate(product.viewed_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'quotes' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Mes demandes de devis</h3>
            </div>
            <div className="p-6">
              {quotes.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Aucune demande de devis</p>
                  <p className="text-gray-400 mt-2">Soumettez votre première demande de devis</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {quotes.map((quote) => (
                    <div key={quote.id} className="border rounded-lg p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-gray-900">{quote.subject}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Créée le {formatDate(quote.created_at)}
                          </p>
                          {quote.updated_at !== quote.created_at && (
                            <p className="text-sm text-gray-600">
                              Mise à jour le {formatDate(quote.updated_at)}
                            </p>
                          )}
                          <div className="mt-3">
                            <p className="text-gray-700 whitespace-pre-wrap">{quote.message}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(quote.status)}`}>
                          {getStatusLabel(quote.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Historique des produits consultés</h3>
            </div>
            <div className="p-6">
              {viewedProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Aucun historique</p>
                  <p className="text-gray-400 mt-2">Votre historique de navigation apparaîtra ici</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {viewedProducts.map((product) => (
                    <div key={product.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                      <div className="aspect-w-16 aspect-h-9">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-48 object-cover"
                        />
                      </div>
                      <div className="p-4">
                        <h4 className="font-medium text-gray-900 mb-2">{product.name}</h4>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-blue-600">{product.price}€</span>
                          <span className="text-xs text-gray-500">
                            {formatDate(product.viewed_at)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">{product.category_name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Informations du profil</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nom d'utilisateur</label>
                    <p className="mt-1 text-sm text-gray-900">{user?.username}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Prénom</label>
                    <p className="mt-1 text-sm text-gray-900">{user?.first_name || 'Non renseigné'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nom</label>
                    <p className="mt-1 text-sm text-gray-900">{user?.last_name || 'Non renseigné'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                    <p className="mt-1 text-sm text-gray-900">{user?.phone || 'Non renseigné'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Rôle</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">{user?.role}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Membre depuis</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(user?.created_at || '')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserDashboard
