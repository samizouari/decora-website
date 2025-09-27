#!/bin/bash

# Script de démarrage robuste pour Railway
echo "🚀 Démarrage du serveur frontend..."

# Vérifier que le dossier dist existe
if [ ! -d "dist" ]; then
  echo "❌ Le dossier dist n'existe pas. Exécution du build..."
  npm run build
fi

# Fonction de nettoyage
cleanup() {
  echo "🛑 Arrêt du serveur..."
  kill $SERVER_PID 2>/dev/null
  exit 0
}

# Capturer les signaux de terminaison
trap cleanup SIGTERM SIGINT

# Démarrer le serveur
echo "📡 Démarrage du serveur sur le port $PORT..."
npx http-server dist -p $PORT -a 0.0.0.0 --cors -S -C &
SERVER_PID=$!

# Attendre que le serveur démarre
sleep 2

# Vérifier que le serveur fonctionne
if kill -0 $SERVER_PID 2>/dev/null; then
  echo "✅ Serveur démarré avec succès (PID: $SERVER_PID)"
else
  echo "❌ Échec du démarrage du serveur"
  exit 1
fi

# Attendre indéfiniment
wait $SERVER_PID
