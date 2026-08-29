import nodemailer from 'nodemailer';
import config from '../config/environment.js';

const ADMIN_EMAIL = config.adminEmail;
const EMAIL_FROM = config.email.from;
const CLIENT_URL = config.clientUrl;

// In-memory set to prevent duplicate email alerts within a short window
const sentAlertsCache = new Set();

/**
 * Configure Nodemailer Transporter
 * Falls back to console simulation if SMTP is not configured
 */
let transporter = null;

if (config.email.isConfigured) {
  transporter = nodemailer.createTransport(config.email.smtp);
}

/**
 * Clean and modern email wrapper template
 */
function generateEmailWrapper(title, preheader, bodyHtml, ctaText = null, ctaUrl = null) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; }
      .container { max-width: 580px; margin: 30px auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; }
      .header { background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); padding: 32px 28px; text-align: center; color: #ffffff; }
      .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
      .header p { margin: 6px 0 0 0; font-size: 13px; opacity: 0.9; }
      .content { padding: 32px 28px; }
      .card { background-color: #f1f5f9; border-radius: 14px; padding: 18px 20px; margin: 20px 0; border: 1px solid #e2e8f0; }
      .btn { display: inline-block; background-color: #4f46e5; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-size: 14px; font-weight: 700; margin-top: 10px; }
      .footer { background-color: #f8fafc; padding: 20px 28px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
      .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; }
      .badge-match { background-color: #dbeafe; color: #1e40af; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>SBJain ItemTrace</h1>
        <p>${preheader}</p>
      </div>
      <div class="content">
        ${bodyHtml}
        ${ctaText && ctaUrl ? `
          <div style="text-align: center; margin-top: 26px;">
            <a href="${ctaUrl}" class="btn">${ctaText}</a>
          </div>
        ` : ''}
      </div>
      <div class="footer">
        <p>This is an automated notification from SB Jain College Lost & Found System.</p>
        <p>Admin Contact: <a href="mailto:${ADMIN_EMAIL}" style="color: #4f46e5;">${ADMIN_EMAIL}</a></p>
      </div>
    </div>
  </body>
  </html>
  `;
}

/**
 * Send Email Generic Handler (Safe & Non-blocking)
 */
async function sendMailSafely({ to, subject, html, text, deduplicationKey = null }) {
  if (!to || to.trim() === '') {
    return { success: false, reason: 'Recipient email is missing' };
  }

  // Deduplication check
  if (deduplicationKey) {
    if (sentAlertsCache.has(deduplicationKey)) {
      console.log(`[EmailService] Skipping duplicate email alert: ${deduplicationKey}`);
      return { success: true, simulated: true, duplicateSkipped: true };
    }
    sentAlertsCache.add(deduplicationKey);
    // Expire cache key after 30 minutes
    setTimeout(() => sentAlertsCache.delete(deduplicationKey), 30 * 60 * 1000);
  }

  // If SMTP is not active, log clean simulated notification
  if (!transporter) {
    console.log('\n======================================================');
    console.log('📧 [EmailService SIMULATION] (SMTP not configured)');
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Time:    ${new Date().toISOString()}`);
    console.log('======================================================\n');
    return { success: true, simulated: true, message: 'Email simulated in development mode.' };
  }

  try {
    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      text: text || subject,
      html
    });

    console.log(`[EmailService] Email sent successfully to ${to}. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EmailService] Failed to send email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
}

export const emailService = {
  /**
   * 1. Send High-Match Smart Alert
   */
  async sendMatchAlert({ recipientEmail, recipientName, originalItem, matchedItem, matchScore }) {
    if (!recipientEmail) return { success: false, reason: 'No recipient email' };

    // Prevent self-notifications
    if (originalItem?.reported_by === matchedItem?.reported_by) {
      return { success: false, reason: 'Self-match notification skipped' };
    }

    const deduplicationKey = `match_${recipientEmail}_${originalItem?.id}_${matchedItem?.id}`;
    const subject = `🎯 [${matchScore}% Match Found] Potential match for your "${originalItem?.title}"`;
    const targetUrl = `${CLIENT_URL}/items/${matchedItem?.id}`;

    const bodyHtml = `
      <h2 style="font-size: 18px; color: #1e293b; margin-top: 0;">Hello ${recipientName || 'Student'},</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #475569;">
        Great news! A new <strong>${matchedItem?.type?.toUpperCase()}</strong> item report on campus closely matches your reported item with a 
        <span class="badge badge-match">${matchScore}% Confidence Score</span>.
      </p>

      <div class="card">
        <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">
          Matched Item Details
        </div>
        <div style="font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 4px;">
          ${matchedItem?.title}
        </div>
        <div style="font-size: 13px; color: #64748b;">
          <strong>Category:</strong> ${matchedItem?.category} &bull; <strong>Location:</strong> ${matchedItem?.location}
        </div>
        ${matchedItem?.description ? `
          <p style="font-size: 13px; color: #475569; margin: 10px 0 0 0; font-style: italic;">
            "${matchedItem.description.slice(0, 120)}..."
          </p>
        ` : ''}
      </div>

      <p style="font-size: 13px; line-height: 1.5; color: #64748b;">
        Please review the report and start a direct chat to coordinate a secure campus handover.
      </p>
    `;

    const html = generateEmailWrapper(
      subject,
      `New ${matchScore}% Smart Match on Campus`,
      bodyHtml,
      'View Matching Report',
      targetUrl
    );

    return sendMailSafely({
      to: recipientEmail,
      subject,
      html,
      deduplicationKey
    });
  },

  /**
   * 2. Send New Message / Chat Notification
   */
  async sendMessageAlert({ recipientEmail, recipientName, senderName, messagePreview, conversationId }) {
    if (!recipientEmail) return { success: false, reason: 'No recipient email' };

    const deduplicationKey = `msg_${recipientEmail}_${conversationId}_${Date.now().toString().slice(0, -4)}`;
    const subject = `💬 New message from ${senderName || 'a campus student'}`;
    const targetUrl = `${CLIENT_URL}/chat/${conversationId}`;

    const bodyHtml = `
      <h2 style="font-size: 18px; color: #1e293b; margin-top: 0;">Hello ${recipientName || 'Student'},</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #475569;">
        You have received a new message regarding an item on SBJain ItemTrace:
      </p>

      <div class="card">
        <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">
          ${senderName || 'Student'} wrote:
        </div>
        <p style="font-size: 14px; color: #1e293b; margin: 0; font-weight: 600;">
          "${messagePreview?.slice(0, 150) || 'Sent you a message'}"
        </p>
      </div>

      <p style="font-size: 13px; color: #64748b;">
        Reply to coordinate item details and safe verification.
      </p>
    `;

    const html = generateEmailWrapper(
      subject,
      `New chat message on SBJain ItemTrace`,
      bodyHtml,
      'Open Conversation',
      targetUrl
    );

    return sendMailSafely({
      to: recipientEmail,
      subject,
      html,
      deduplicationKey
    });
  },

  /**
   * 3. Send New Item Admin Alert (to dhokvinit@gmail.com)
   */
  async sendReportAdminAlert({ item, reporterName, reporterEmail }) {
    const subject = `📢 [New ${item?.type?.toUpperCase()} Item] "${item?.title}" reported on campus`;
    const targetUrl = `${CLIENT_URL}/items/${item?.id}`;

    const bodyHtml = `
      <h2 style="font-size: 18px; color: #1e293b; margin-top: 0;">Administrator Report Alert</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #475569;">
        A new <strong>${item?.type?.toUpperCase()}</strong> report has been submitted on SBJain ItemTrace.
      </p>

      <div class="card">
        <div style="font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 6px;">
          ${item?.title}
        </div>
        <div style="font-size: 13px; color: #64748b; line-height: 1.6;">
          <strong>Category:</strong> ${item?.category}<br>
          <strong>Location:</strong> ${item?.location}<br>
          <strong>Date:</strong> ${item?.date_occurred}<br>
          <strong>Reported by:</strong> ${reporterName || 'Student'} (${reporterEmail || 'N/A'})
        </div>
      </div>
    `;

    const html = generateEmailWrapper(
      subject,
      `Admin Campus Report Alert`,
      bodyHtml,
      'Inspect Item in Admin Dashboard',
      targetUrl
    );

    return sendMailSafely({
      to: ADMIN_EMAIL,
      subject,
      html,
      deduplicationKey: `admin_report_${item?.id}`
    });
  },

  /**
   * 4. Send Item Resolution / Claim Confirmation Alert
   */
  async sendStatusAlert({ recipientEmail, recipientName, item, status }) {
    if (!recipientEmail) return { success: false, reason: 'No recipient email' };

    const subject = `✅ Report Status Updated: "${item?.title}" is marked as ${status}`;
    const targetUrl = `${CLIENT_URL}/my-reports`;

    const bodyHtml = `
      <h2 style="font-size: 18px; color: #1e293b; margin-top: 0;">Hello ${recipientName || 'Student'},</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #475569;">
        Your report for <strong>"${item?.title}"</strong> has been successfully updated to 
        <strong style="text-transform: uppercase; color: #16a34a;">${status}</strong>.
      </p>
      <p style="font-size: 13px; color: #64748b;">
        Thank you for helping keep the SB Jain campus safe and organized!
      </p>
    `;

    const html = generateEmailWrapper(
      subject,
      `Report Status Update Confirmation`,
      bodyHtml,
      'View My Reports',
      targetUrl
    );

    return sendMailSafely({
      to: recipientEmail,
      subject,
      html,
      deduplicationKey: `status_${item?.id}_${status}`
    });
  },

  /**
   * Get Current Email Configuration Status
   */
  getStatus() {
    return {
      adminEmail: ADMIN_EMAIL,
      smtpConfigured: isSmtpConfigured,
      smtpHost: process.env.SMTP_HOST || 'None (Simulation Mode)',
      sender: EMAIL_FROM
    };
  }
};
