# 🚂 Déploiement Decora sur Railway

## 🎯 Pourquoi Railway ?

✅ **Zero Configuration** - Déploiement automatique  
✅ **Base de données PostgreSQL incluse** - Pas de service externe  
✅ **Stockage persistant** - Uploads d'images qui persistent  
✅ **Full-stack** - Frontend + Backend dans un projet  
✅ **500h/mois gratuit** - Suffisant pour commencer  

## 🚀 Déploiement en 4 étapes

### 1️⃣ **Préparer le repository GitHub**
```bash
# Initialiser Git si pas déjà fait
git init
git add .
git commit -m "Decora website ready for Railway deployment"

# Créer un repository sur GitHub et le connecter
git remote add origin https://github.com/votre-username/decora-website.git
git push -u origin main
```

### 2️⃣ **Déployer le Backend sur Railway**
1. Aller sur [railway.app](https://railway.app)
2. Se connecter avec GitHub
3. Cliquer sur **"New Project"**
4. Sélectionner **"Deploy from GitHub repo"**
5. Choisir votre repository
6. Configurer :
   - **Root Directory** : `backend`
   - **Build Command** : `npm run build`
   - **Start Command** : `npm start`

### 3️⃣ **Ajouter PostgreSQL**
1. Dans le projet Railway, cliquer sur **"+ New"**
2. Sélectionner **"Database"** → **"PostgreSQL"**
3. Railway crée automatiquement la base de données
4. La variable `DATABASE_URL` est automatiquement configurée

### 4️⃣ **Déployer le Frontend**
1. Créer un **nouveau projet** Railway
2. Sélectionner le même repository
3. Configurer :
   - **Root Directory** : `frontend`
   - **Build Command** : `npm run build`
   - **Start Command** : `npm run preview`

## 🔧 Configuration des variables d'environnement

### Backend (Railway Dashboard)
```
NODE_ENV=production
JWT_SECRET=votre-secret-jwt-super-securise-123456
DATABASE_URL=${{Postgres.DATABASE_URL}}
PORT=${{PORT}}
```

### Frontend (Railway Dashboard)
```
VITE_API_URL=https://votre-backend.up.railway.app
NODE_ENV=production
```

## 📁 Structure du projet Railway
```
decora-website/
├── frontend/                    # React app
│   ├── railway.json            # Config Railway frontend
│   └── package.json
├── backend/                    # Express API
│   ├── railway.json            # Config Railway backend
│   ├── package.json
│   └── src/database/
│       ├── connection.ts       # PostgreSQL adapter
│       └── init-postgresql.sql # Script d'init
├── railway.json                # Config Railway racine
└── package.json                # Package racine
```

## 🗄️ Migration SQLite → PostgreSQL

Le projet est déjà configuré pour PostgreSQL :
- ✅ `backend/src/database/connection.ts` adapté
- ✅ `backend/package.json` avec `pg` au lieu de `sqlite3`
- ✅ Script d'initialisation PostgreSQL inclus

## 🎉 Résultat final

**URLs automatiques :**
- 🌐 **Frontend** : `https://decora-frontend-production.up.railway.app`
- 📡 **Backend** : `https://decora-backend-production.up.railway.app`
- 🗄️ **Base de données** : PostgreSQL incluse

## ⚡ Avantages Railway

| Feature | Railway | Autres plateformes |
|---------|---------|-------------------|
| Base de données | ✅ PostgreSQL inclus | ❌ Service externe |
| Stockage fichiers | ✅ Persistant | ❌ Pas persistant |
| Configuration | ✅ Zero-config | ❌ Configuration requise |
| Full-stack | ✅ Un projet | ❌ Deux projets |
| Coût | ✅ 500h gratuit | ❌ Payant |

## 🚀 Votre site sera en ligne en 10 minutes !

Railway est parfait pour Decora car :
- Pas de configuration complexe
- Base de données PostgreSQL incluse
- Uploads d'images qui persistent
- Déploiement full-stack simple
- Monitoring et logs intégrés
