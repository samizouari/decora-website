import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role: string;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté au chargement
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
      } catch (error) {
        console.error('Erreur lors du parsing des données utilisateur:', error);
        // Nettoyer les données corrompues
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    
    setLoading(false);
  }, []);

  const login = async (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    
    // Synchroniser les consultations locales avec le serveur
    await syncLocalViews(newToken);
  };

  // Fonction pour synchroniser les consultations locales avec le serveur
  const syncLocalViews = async (authToken: string) => {
    try {
      const viewedProducts = JSON.parse(localStorage.getItem('viewedProducts') || '[]');
      
      if (viewedProducts.length === 0) {
        console.log('🔍 [SYNC] Aucune consultation locale à synchroniser');
        return;
      }
      
      console.log('🔍 [SYNC] Synchronisation de', viewedProducts.length, 'consultations locales');
      
      // Envoyer chaque consultation au serveur
      for (const view of viewedProducts) {
        try {
          const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/products/${view.productId}/view`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            console.log('✅ [SYNC] Consultation synchronisée:', view.productId);
          } else {
            console.error('❌ [SYNC] Erreur synchronisation:', view.productId, response.status);
          }
        } catch (error) {
          console.error('❌ [SYNC] Erreur lors de la synchronisation:', view.productId, error);
        }
      }
      
      // Vider le localStorage après synchronisation
      localStorage.removeItem('viewedProducts');
      console.log('✅ [SYNC] Synchronisation terminée, localStorage vidé');
      
    } catch (error) {
      console.error('❌ [SYNC] Erreur lors de la synchronisation des consultations:', error);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.role === 'admin',
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
