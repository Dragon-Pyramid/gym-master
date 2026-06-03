import * as brevo from '@getbrevo/brevo';
import { brevoEmail } from '@/interfaces/brevoEmail.interface';

const DEFAULT_SENDER_NAME = 'Gym Master';
const DEFAULT_SENDER_EMAIL = 'no-reply@gymmaster.local';

export async function sendEmail({ to, subject, htmlContent }: brevoEmail) {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    console.warn('BREVO_API_KEY no está configurada. Email no enviado.', {
      subject,
      recipients: to.map((recipient) => recipient.email),
    });
    return { skipped: true };
  }

  const apiInstance = new brevo.TransactionalEmailsApi();
  apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);

  const smtpEmail = new brevo.SendSmtpEmail();
  smtpEmail.subject = subject;
  smtpEmail.to = to;
  smtpEmail.htmlContent = htmlContent;
  smtpEmail.sender = {
    name: process.env.BREVO_SENDER_NAME || DEFAULT_SENDER_NAME,
    email: process.env.BREVO_SENDER_EMAIL || DEFAULT_SENDER_EMAIL,
  };

  try {
    const response = await apiInstance.sendTransacEmail(smtpEmail);
    console.log('Email transaccional enviado por Brevo', {
      subject,
      recipients: to.map((recipient) => recipient.email),
    });
    return response;
  } catch (error) {
    console.error('Error enviando email por Brevo:', error);
    throw error;
  }
}
