#!/bin/bash

echo "🚂 Déploiement Decora sur Railway"
echo "================================="

# Vérifier que Git est initialisé
if [ ! -d ".git" ]; then
    echo "📁 Initialisation Git..."
    git init
    git add .
    git commit -m "Initial commit - Decora website ready for Railway"
    echo "✅ Git initialisé"
else
    echo "✅ Git déjà initialisé"
fi

# Vérifier les fichiers de configuration Railway
echo "🔍 Vérification des fichiers Railway..."
if [ -f "railway.json" ]; then
    echo "✅ railway.json (racine)"
else
    echo "❌ railway.json manquant"
fi

if [ -f "frontend/railway.json" ]; then
    echo "✅ frontend/railway.json"
else
    echo "❌ frontend/railway.json manquant"
fi

if [ -f "backend/railway.json" ]; then
    echo "✅ backend/railway.json"
else
    echo "❌ backend/railway.json manquant"
fi

# Vérifier les package.json
echo "📦 Vérification des package.json..."
if [ -f "package.json" ]; then
    echo "✅ package.json (racine)"
else
    echo "❌ package.json manquant"
fi

if [ -f "frontend/package.json" ]; then
    echo "✅ frontend/package.json"
else
    echo "❌ frontend/package.json manquant"
fi

if [ -f "backend/package.json" ]; then
    echo "✅ backend/package.json"
else
    echo "❌ backend/package.json manquant"
fi

echo ""
echo "🎯 Prochaines étapes :"
echo "1. Créer un repository sur GitHub"
echo "2. Aller sur railway.app"
echo "3. Se connecter avec GitHub"
echo "4. Déployer le backend (root: backend)"
echo "5. Ajouter PostgreSQL"
echo "6. Déployer le frontend (root: frontend)"
echo ""
echo "📖 Guide complet : README-RAILWAY-DEPLOYMENT.md"
echo "🚀 Votre site sera en ligne en 10 minutes !"
