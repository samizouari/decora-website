import { useState } from 'react'
import { Send, Phone, Mail, MapPin } from 'lucide-react'
import { API_ENDPOINTS } from '../config/api'
import toast from 'react-hot-toast'

const Quote = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    projectType: '',
    budget: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const subject = `Demande de devis - ${formData.projectType || 'Projet personnalisé'}`
      const message = `Bonjour,

Je souhaiterais recevoir un devis pour mon projet d'aménagement de bureau.

Informations du projet :
- Type de projet : ${formData.projectType || 'Non spécifié'}
- Budget estimé : ${formData.budget || 'Non spécifié'}
- Entreprise : ${formData.company || 'Non spécifiée'}

Description détaillée :
${formData.message}

Cordialement,
${formData.name}`

      const response = await fetch(API_ENDPOINTS.QUOTES, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          subject: subject,
          message: message
        })
      })

      if (response.ok) {
        toast.success('Votre demande de devis a été envoyée avec succès !')
        setFormData({
          name: '',
          email: '',
          phone: '',
          company: '',
          projectType: '',
          budget: '',
          message: ''
        })
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Erreur lors de l\'envoi de la demande')
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error)
      toast.error('Erreur lors de l\'envoi de la demande')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif font-bold text-gray-900 mb-4">
            Demande de Devis
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Obtenez un devis personnalisé pour votre projet d'aménagement de bureau professionnel
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Formulaire */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Informations sur votre projet
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Entreprise
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de projet *
                </label>
                <select
                  required
                  value={formData.projectType}
                  onChange={(e) => setFormData({...formData, projectType: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Sélectionnez un type de projet</option>
                  <option value="bureau-operatif">Bureau opérationnel</option>
                  <option value="bureau-direction">Bureau de direction</option>
                  <option value="mobilier-accueil">Mobilier d'accueil</option>
                  <option value="mobilier-reunion">Mobilier de réunion</option>
                  <option value="open-space">Open space</option>
                  <option value="cafeteria">Cafétéria</option>
                  <option value="autre">Autre</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget estimé
                </label>
                <select
                  value={formData.budget}
                  onChange={(e) => setFormData({...formData, budget: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Sélectionnez votre budget</option>
                  <option value="<5000">Moins de 5 000 DT</option>
                  <option value="5000-10000">5 000 - 10 000 DT</option>
                  <option value="10000-25000">10 000 - 25 000 DT</option>
                  <option value="25000-50000">25 000 - 50 000 DT</option>
                  <option value=">50000">Plus de 50 000 DT</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description du projet *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  placeholder="Décrivez votre projet en détail..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-primary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={20} className="mr-2" />
                {isSubmitting ? 'Envoi en cours...' : 'Envoyer la demande'}
              </button>
            </form>
          </div>

          {/* Informations de contact */}
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Pourquoi nous choisir ?
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 mr-3"></div>
                  <span className="text-gray-600">Plans d'études en 2D et 3D gratuits</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 mr-3"></div>
                  <span className="text-gray-600">Conseils personnalisés par nos experts</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 mr-3"></div>
                  <span className="text-gray-600">Large gamme de mobilier professionnel</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 mr-3"></div>
                  <span className="text-gray-600">Installation et service après-vente</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Contactez-nous directement
              </h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Phone className="text-primary-600 mr-3" size={20} />
                  <span className="text-gray-600">+216 XX XXX XXX</span>
                </div>
                <div className="flex items-center">
                  <Mail className="text-primary-600 mr-3" size={20} />
                  <span className="text-gray-600">decora.bur@gmail.com</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="text-primary-600 mr-3" size={20} />
                  <span className="text-gray-600">Tunis, Tunisie</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Quote
