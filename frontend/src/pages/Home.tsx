import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle } from 'lucide-react'

const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 to-primary-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-8">
              <img 
                src="/Logo decora.png" 
                alt="Logo Decora" 
                className="h-20 mx-auto mb-6"
                onError={(e) => {
                  // Fallback si l'image n'est pas trouvée
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-gray-900 mb-6">
              Votre aménagement de mobilier de bureau
              <span className="text-primary-600"> professionnel</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Nous sommes là pour vous conseiller et transformer vos locaux en espaces de travail moderne, design et dynamique.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/products" 
                className="btn-primary inline-flex items-center justify-center"
              >
                Découvrir nos produits
                <ArrowRight size={20} className="ml-2" />
              </Link>
              <Link 
                to="/quote" 
                className="btn-secondary inline-flex items-center justify-center"
              >
                Demander un devis
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Présentation Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-serif font-bold text-gray-900 mb-6">
                Présentation
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  Votre aménagement de mobilier de bureau professionnel n'aura jamais été aussi efficace ! 
                  Nous sommes là pour vous conseiller et transformer vos locaux en espaces de travail moderne, 
                  design et dynamique.
                </p>
                <p>
                  Chez Décora, nous préférons construire un tel projet conjointement avec nos clients : 
                  nous écoutons vos problématiques et nous vous apportons les meilleures solutions.
                </p>
                <p>
                  Nous relevons chaque défi et nous aimons le challenge. Notre réseau de partenaires, 
                  sérieux et compétents, constitué de professionnels du bâtiment et d'architectes, 
                  vous apporteront des conseils précieux pour optimiser au mieux votre espace de travail.
                </p>
              </div>
            </div>
            <div className="bg-primary-50 rounded-lg p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Nos services
              </h3>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <CheckCircle className="text-primary-600 mr-3" size={20} />
                  <span className="text-gray-600">Plans d'études en 2D et 3D</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="text-primary-600 mr-3" size={20} />
                  <span className="text-gray-600">Conseils personnalisés</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="text-primary-600 mr-3" size={20} />
                  <span className="text-gray-600">Installation sur site</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="text-primary-600 mr-3" size={20} />
                  <span className="text-gray-600">Service après-vente</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Nos gammes de produits */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold text-gray-900 mb-4">
              NOS GAMMES DE PRODUITS
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Une large sélection de mobilier de bureau qui allie qualité et modernité
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Bureaux</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Bureau opérationnel</li>
                <li>• Bureau de direction</li>
                <li>• Mobilier modulaire</li>
                <li>• Mobilier collectivités</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Mobilier spécialisé</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Mobilier d'accueil</li>
                <li>• Mobilier de réunion</li>
                <li>• Mobilier détente</li>
                <li>• Cafétéria</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sièges</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Fauteuil de direction</li>
                <li>• Fauteuil opérateur</li>
                <li>• Fauteuil ergonomique</li>
                <li>• Siège visiteur et attente</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Rangements</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Armoires Design</li>
                <li>• Bibliothèques</li>
                <li>• Armoires & Rangement Bureau</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Réunion</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Tables de Réunion</li>
                <li>• Réunion Média</li>
                <li>• Réunions Hautes</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Accueil</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Banques d'Accueil</li>
                <li>• Fauteuils et Canapés</li>
                <li>• Tables basses</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-serif font-bold text-white mb-4">
            Prêt à transformer votre espace de travail ?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Contactez-nous pour un devis personnalisé et découvrez comment nous pouvons optimiser votre espace.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/quote" 
              className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
            >
              Demander un devis
              <ArrowRight size={20} className="ml-2" />
            </Link>
            <Link 
              to="/contact" 
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors inline-flex items-center justify-center"
            >
              Nous contacter
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home 