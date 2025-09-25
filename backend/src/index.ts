import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';

// Routes
import productsRoutes from './routes/products';
import categoriesRoutes from './routes/categories';
import contactRoutes from './routes/contact';
import authRoutes from './routes/auth';
import ordersRoutes from './routes/orders';
import adminRoutes from './routes/admin';

// Database
import { initDatabase } from './database/init';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;
const aze = process.env.NODE_ENV === 'development'
// Middleware de sécurité
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001'];
    if (process.env.NODE_ENV === 'development' || !origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(compression());
app.use(morgan('combined'));

// Middleware pour parser le JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir les fichiers statiques (images uploadées)
const uploadsPath = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsPath, {
  setHeaders: (res, path) => {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

console.log(`📁 Dossier uploads configuré: ${uploadsPath}`);

// Routes API
app.use('/api/products', productsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/admin', adminRoutes);

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Decora API is running',
    timestamp: new Date().toISOString()
  });
});

// Route par défaut
app.get('/', (req, res) => {
  res.json({ 
    message: 'Bienvenue sur l\'API Decora - Spécialiste en rideaux et décoration',
    version: '1.0.0'
  });
});

// Gestion des erreurs 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Middleware de gestion d'erreurs global
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Erreur interne du serveur',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Une erreur est survenue'
  });
});

// Initialiser la base de données et démarrer le serveur
async function startServer() {
  try {
    // Seulement initialiser SQLite si PostgreSQL n'est pas utilisé
    if (!process.env.DATABASE_URL) {
      await initDatabase();
      console.log('✅ Base de données SQLite initialisée');
    } else {
      console.log('✅ Base de données PostgreSQL initialisée via connection.ts');
    }
    
    app.listen(PORT, () => {
      console.log(`🚀 Serveur Decora démarré sur le port ${PORT}`);
      console.log(`📱 API disponible sur http://localhost:${PORT}`);
      console.log(`🔗 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    });
  } catch (error) {
    console.error('❌ Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
}

startServer(); 