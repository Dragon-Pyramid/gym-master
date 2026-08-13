import 'server-only';

import { BrevoClient } from '@getbrevo/brevo';
import { brevoEmail } from '@/interfaces/brevoEmail.interface';

const DEFAULT_SENDER_NAME = 'Gym Master';
const DEFAULT_SENDER_EMAIL = 'no-reply@gymmaster.local';

export async function sendEmail({
  to,
  subject,
  htmlContent,
}: brevoEmail) {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    console.warn(
      'BREVO_API_KEY no está configurada. Email no enviado.',
      {
        subject,
        recipientCount: to.length,
      },
    );

    return { skipped: true };
  }

  const client = new BrevoClient({
    apiKey,
  });

  try {
    const response =
      await client.transactionalEmails.sendTransacEmail({
        subject,
        to,
        htmlContent,
        sender: {
          name:
            process.env.BREVO_SENDER_NAME ||
            DEFAULT_SENDER_NAME,
          email:
            process.env.BREVO_SENDER_EMAIL ||
            DEFAULT_SENDER_EMAIL,
        },
      });

    console.log(
      'Email transaccional enviado por Brevo',
      {
        subject,
        recipientCount: to.length,
      },
    );

    return response;
  } catch (error: unknown) {
    const safeError =
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
          }
        : {
            name: 'UnknownError',
            message: 'Error no identificado',
          };

    console.error(
      'Error enviando email por Brevo:',
      safeError,
    );

    throw error;
  }
}
