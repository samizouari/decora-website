import { Link } from 'react-router-dom'
import { Mail, Phone, MapPin } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="bg-secondary-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo et description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <span className="text-xl font-serif font-semibold">Decora</span>
            </div>
            <p className="text-secondary-200 mb-4">
              Votre spécialiste en mobilier de bureau et décoration d'intérieur. 
              Nous vous accompagnons dans la création d'espaces professionnels élégants et fonctionnels.
            </p>
          </div>

          {/* Liens rapides */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Liens rapides</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/products" className="text-secondary-200 hover:text-white transition-colors">
                  Nos produits
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-secondary-200 hover:text-white transition-colors">
                  À propos
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-secondary-200 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <div className="space-y-2 text-secondary-200">
              <div className="flex items-center space-x-2">
                <Phone size={16} />
                <span>+216 XX XXX XXX</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail size={16} />
                <span>decora.bur@gmail.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin size={16} />
                <span>Tunis, Tunisie</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-secondary-700 mt-8 pt-8 text-center text-secondary-200">
          <p>&copy; 2024 Decora. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer 