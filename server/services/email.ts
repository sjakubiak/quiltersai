import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  console.warn('⚠️ RESEND_API_KEY not set - email notifications will be disabled');
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export interface FeedbackEmailData {
  name?: string;
  email: string;
  subject: string;
  message: string;
  category?: string;
  userId?: string;
}

export async function sendFeedbackEmail(data: FeedbackEmailData): Promise<boolean> {
  if (!resend) {
    console.warn('⚠️ Resend not configured - skipping email notification');
    return false;
  }

  try {
    const categoryEmoji: Record<string, string> = {
      bug: '🐛',
      feature: '✨',
      question: '❓',
      other: '💬',
    };

    const emoji = data.category ? categoryEmoji[data.category] || '💬' : '💬';
    const categoryLabel = data.category || 'other';

    await resend.emails.send({
      from: 'Quilter\'s AI <feedback@quiltersai.com>',
      to: 'sjakubiak@gmail.com',
      subject: `${emoji} [${categoryLabel.toUpperCase()}] ${data.subject}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #D6456B 0%, #FF6B9D 100%);
                color: white;
                padding: 30px;
                border-radius: 8px 8px 0 0;
                text-align: center;
              }
              .header h1 {
                margin: 0;
                font-size: 24px;
              }
              .badge {
                display: inline-block;
                background: rgba(255, 255, 255, 0.2);
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 12px;
                margin-top: 8px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              .content {
                background: #f8f9fa;
                padding: 30px;
                border-radius: 0 0 8px 8px;
              }
              .field {
                margin-bottom: 20px;
              }
              .field-label {
                font-size: 12px;
                text-transform: uppercase;
                color: #666;
                margin-bottom: 4px;
                font-weight: 600;
                letter-spacing: 0.5px;
              }
              .field-value {
                font-size: 14px;
                color: #333;
              }
              .message-box {
                background: white;
                padding: 20px;
                border-radius: 6px;
                border-left: 4px solid #D6456B;
                margin-top: 8px;
                white-space: pre-wrap;
              }
              .footer {
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
                font-size: 12px;
                color: #666;
                text-align: center;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${emoji} New Feedback Received</h1>
              <div class="badge">${categoryLabel}</div>
            </div>
            <div class="content">
              <div class="field">
                <div class="field-label">From</div>
                <div class="field-value">
                  ${data.name || 'Anonymous'} &lt;${data.email}&gt;
                </div>
              </div>
              
              <div class="field">
                <div class="field-label">Subject</div>
                <div class="field-value">${data.subject}</div>
              </div>
              
              <div class="field">
                <div class="field-label">Message</div>
                <div class="message-box">${data.message}</div>
              </div>
              
              ${data.userId ? `
              <div class="field">
                <div class="field-label">User ID</div>
                <div class="field-value" style="font-family: monospace; font-size: 12px;">
                  ${data.userId}
                </div>
              </div>
              ` : ''}
              
              <div class="footer">
                Sent from Quilter's AI Feedback System
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
New Feedback Received

Category: ${categoryLabel.toUpperCase()}
From: ${data.name || 'Anonymous'} <${data.email}>
Subject: ${data.subject}

Message:
${data.message}

${data.userId ? `User ID: ${data.userId}` : ''}
      `.trim(),
    });

    console.log(`✉️ Feedback email sent to sjakubiak@gmail.com`);
    return true;
  } catch (error) {
    console.error('Failed to send feedback email:', error);
    return false;
  }
}
