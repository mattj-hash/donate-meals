import sendgrid from '@sendgrid/mail';
import { getConfig } from '@/lib/config';

export type EmailAttachment = {
  filename: string;
  type: string;
  content: Buffer;
  disposition?: 'attachment' | 'inline';
};

export async function sendEmail(params: {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  attachments?: EmailAttachment[];
  replyTo?: string;
}) {
  const config = getConfig();
  if (!config.SENDGRID_API_KEY) {
    throw new Error('SENDGRID_API_KEY is missing.');
  }

  sendgrid.setApiKey(config.SENDGRID_API_KEY);

  await sendgrid.send({
    to: params.to,
    from: config.EMAIL_FROM,
    subject: params.subject,
    text: params.text,
    html: params.html,
    replyTo: params.replyTo,
    attachments: params.attachments?.map((attachment) => ({
      filename: attachment.filename,
      type: attachment.type,
      content: attachment.content.toString('base64'),
      disposition: attachment.disposition ?? 'attachment'
    }))
  });
}
