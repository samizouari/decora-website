import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Configuration du transporteur email
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Votre adresse Gmail
      pass: process.env.EMAIL_PASS  // Mot de passe d'application Gmail
    }
  });
};

// Interface pour les données de demande de devis
interface QuoteData {
  id: number;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  created_at: string;
}

// Fonction pour envoyer une notification de nouvelle demande de devis
export const sendQuoteNotification = async (quoteData: QuoteData): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    
    // Vérifier que les variables d'environnement sont configurées
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('❌ Variables d\'environnement email manquantes');
      return false;
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'decora.bur@gmail.com',
      subject: `🔔 Nouvelle demande de devis - ${quoteData.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Nouvelle Demande de Devis</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Decora - Aménagement de Bureaux</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-top: 0; border-bottom: 2px solid #667eea; padding-bottom: 10px;">
                📋 Détails de la demande
              </h2>
              
              <div style="margin: 20px 0;">
                <p style="margin: 8px 0;"><strong>🆔 ID de la demande:</strong> #${quoteData.id}</p>
                <p style="margin: 8px 0;"><strong>👤 Nom du client:</strong> ${quoteData.name}</p>
                <p style="margin: 8px 0;"><strong>📧 Email:</strong> <a href="mailto:${quoteData.email}" style="color: #667eea;">${quoteData.email}</a></p>
                ${quoteData.phone ? `<p style="margin: 8px 0;"><strong>📞 Téléphone:</strong> <a href="tel:${quoteData.phone}" style="color: #667eea;">${quoteData.phone}</a></p>` : ''}
                <p style="margin: 8px 0;"><strong>📅 Date de demande:</strong> ${new Date(quoteData.created_at).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
              </div>
              
              <div style="margin: 20px 0;">
                <h3 style="color: #333; margin-bottom: 10px;">📝 Sujet:</h3>
                <p style="background: #f8f9fa; padding: 15px; border-left: 4px solid #667eea; margin: 0;">
                  ${quoteData.subject}
                </p>
              </div>
              
              <div style="margin: 20px 0;">
                <h3 style="color: #333; margin-bottom: 10px;">💬 Message du client:</h3>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; white-space: pre-wrap; line-height: 1.6;">
${quoteData.message}
                </div>
              </div>
              
              <div style="margin: 30px 0; text-align: center;">
                <a href="https://decora-front.up.railway.app/admin" 
                   style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                  🔗 Accéder au Dashboard Admin
                </a>
              </div>
              
              <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
                <p>Cette notification a été envoyée automatiquement par le système Decora.</p>
                <p>Merci de traiter cette demande dans les plus brefs délais.</p>
              </div>
            </div>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email de notification envoyé avec succès:', info.messageId);
    return true;
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
    return false;
  }
};

// Fonction pour tester la configuration email
export const testEmailConfig = async (): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('❌ Variables d\'environnement email manquantes');
      return false;
    }

    // Test de connexion
    await transporter.verify();
    console.log('✅ Configuration email valide');
    return true;
    
  } catch (error) {
    console.error('❌ Erreur de configuration email:', error);
    return false;
  }
};
