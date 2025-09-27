#!/bin/bash

# Script de démarrage robuste pour Railway
echo "🚀 Démarrage du serveur frontend..."

# Vérifier que le dossier dist existe
if [ ! -d "dist" ]; then
  echo "❌ Le dossier dist n'existe pas. Exécution du build..."
  npm run build
fi

# Démarrer le serveur avec gestion des signaux
echo "📡 Démarrage du serveur sur le port $PORT..."
exec npx serve dist -s -l $PORT --no-clipboard
