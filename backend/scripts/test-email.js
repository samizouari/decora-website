const { testEmailConfig, sendQuoteNotification } = require('../dist/services/emailService');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function testEmail() {
  console.log('🔍 Test de la configuration email...');
  
  // Vérifier les variables d'environnement
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ Variables d\'environnement email manquantes !');
    console.error('Veuillez configurer EMAIL_USER et EMAIL_PASS dans votre fichier .env');
    console.error('Consultez env.email.example pour les instructions');
    return;
  }
  
  console.log('📧 EMAIL_USER:', process.env.EMAIL_USER);
  console.log('🔑 EMAIL_PASS:', process.env.EMAIL_PASS ? 'Configuré' : 'Non configuré');
  
  // Test de la configuration
  const configValid = await testEmailConfig();
  if (!configValid) {
    console.error('❌ Configuration email invalide');
    return;
  }
  
  // Test d'envoi d'email
  console.log('📤 Test d\'envoi d\'email de notification...');
  
  const testQuote = {
    id: 999,
    name: 'Test Client',
    email: 'test@example.com',
    phone: '+33 1 23 45 67 89',
    subject: 'Test de notification email',
    message: 'Ceci est un message de test pour vérifier que les notifications email fonctionnent correctement.\n\nMerci de traiter cette demande de test.',
    created_at: new Date().toISOString()
  };
  
  const emailSent = await sendQuoteNotification(testQuote);
  
  if (emailSent) {
    console.log('✅ Email de test envoyé avec succès !');
    console.log('📧 Vérifiez votre boîte de réception à decora.bur@gmail.com');
  } else {
    console.error('❌ Échec de l\'envoi de l\'email de test');
  }
}

testEmail().catch(console.error);
