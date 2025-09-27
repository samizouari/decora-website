import { Link } from 'react-router-dom'
import { ShoppingCart, User, Menu, X, LogOut, Settings } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

const Header = () => {
  const [isNavigationOpen, setIsNavigationOpen] = useState(false)
  const { isAuthenticated, isAdmin, user, logout } = useAuth()

  const navigationItems = [
    { path: '/', label: 'Accueil' },
    { path: '/products', label: 'Produits' },
    { path: '/quote', label: 'Demande de devis' },
    { path: '/contact', label: 'Contact' }
  ]

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3">
              <img 
                src="/logo-decora.png" 
                alt="Decora Logo" 
                className="h-10 w-auto"
              />
              <span className="text-xl font-serif font-semibold text-gray-900">Decora</span>
            </Link>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              <Link to="/cart" className="p-2 text-accent-600 hover:text-primary-500 transition-colors">
                <ShoppingCart size={20} />
              </Link>
              
              {/* User actions */}
              {isAuthenticated ? (
                <div className="flex items-center space-x-2">
                  {isAdmin && (
                    <Link to="/admin" className="p-2 text-accent-600 hover:text-primary-500 transition-colors" title="Administration">
                      <Settings size={20} />
                    </Link>
                  )}
                  <Link to="/dashboard" className="p-2 text-accent-600 hover:text-primary-500 transition-colors" title="Mon espace">
                    <User size={20} />
                  </Link>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>Bonjour, {user?.first_name || user?.username}</span>
                    <button 
                      onClick={logout}
                      className="p-2 text-accent-600 hover:text-primary-500 transition-colors"
                      title="Se déconnecter"
                    >
                      <LogOut size={20} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link to="/login" className="p-2 text-accent-600 hover:text-primary-500 transition-colors" title="Se connecter">
                    <User size={20} />
                  </Link>
                </div>
              )}
              
              {/* Menu hamburger */}
              <button
                className="p-2 text-accent-600 hover:text-primary-500 transition-colors"
                onClick={() => setIsNavigationOpen(!isNavigationOpen)}
              >
                {isNavigationOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Overlay */}
      {isNavigationOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setIsNavigationOpen(false)}>
          <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
            <div className="p-6">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-serif font-semibold text-gray-900">Menu</h2>
                <button
                  onClick={() => setIsNavigationOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <nav className="space-y-4">
                {navigationItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="block px-4 py-3 text-lg text-accent-600 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
                    onClick={() => setIsNavigationOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Header 