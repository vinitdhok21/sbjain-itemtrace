/**
 * Email Alert Service (Frontend Client)
 * Communicates with backend email alert dispatcher in a safe, non-blocking manner.
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const emailAlertService = {
  /**
   * Send match alert email to matched item reporter
   */
  async sendMatchEmailAlert({ recipientEmail, recipientName, originalItem, matchedItem, matchScore }) {
    if (!recipientEmail || !matchedItem) return;

    try {
      fetch(`${BACKEND_URL}/api/alerts/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail,
          recipientName,
          originalItem,
          matchedItem,
          matchScore
        })
      }).catch((err) => {
        console.warn('[EmailAlertService] Non-blocking match alert dispatch:', err.message);
      });
    } catch (err) {
      console.warn('[EmailAlertService] Non-blocking match alert dispatch caught:', err.message);
    }
  },

  /**
   * Send unread message email notification
   */
  async sendMessageEmailAlert({ recipientEmail, recipientName, senderName, messagePreview, conversationId }) {
    if (!recipientEmail || !conversationId) return;

    try {
      fetch(`${BACKEND_URL}/api/alerts/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail,
          recipientName,
          senderName,
          messagePreview,
          conversationId
        })
      }).catch((err) => {
        console.warn('[EmailAlertService] Non-blocking message alert dispatch:', err.message);
      });
    } catch (err) {
      console.warn('[EmailAlertService] Non-blocking message alert dispatch caught:', err.message);
    }
  },

  /**
   * Send new report alert to admin (dhokvinit@gmail.com)
   */
  async sendReportAdminEmailAlert({ item, reporterName, reporterEmail }) {
    if (!item) return;

    try {
      fetch(`${BACKEND_URL}/api/alerts/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item,
          reporterName,
          reporterEmail
        })
      }).catch((err) => {
        console.warn('[EmailAlertService] Non-blocking admin alert dispatch:', err.message);
      });
    } catch (err) {
      console.warn('[EmailAlertService] Non-blocking admin alert dispatch caught:', err.message);
    }
  },

  /**
   * Send report status change confirmation alert
   */
  async sendStatusEmailAlert({ recipientEmail, recipientName, item, status }) {
    if (!recipientEmail || !item || !status) return;

    try {
      fetch(`${BACKEND_URL}/api/alerts/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail,
          recipientName,
          item,
          status
        })
      }).catch((err) => {
        console.warn('[EmailAlertService] Non-blocking status alert dispatch:', err.message);
      });
    } catch (err) {
      console.warn('[EmailAlertService] Non-blocking status alert dispatch caught:', err.message);
    }
  }
};
