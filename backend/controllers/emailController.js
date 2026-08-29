import { emailService } from '../services/emailService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_REGEX.test(email.trim());
}

export const emailController = {
  /**
   * POST /api/alerts/match
   * Trigger email alert on strong item match
   */
  sendMatchAlert: asyncHandler(async (req, res) => {
    const { recipientEmail, recipientName, originalItem, matchedItem, matchScore } = req.body;

    if (!isValidEmail(recipientEmail) || !matchedItem) {
      return res.status(400).json({
        success: false,
        message: 'A valid recipientEmail and matchedItem object are required'
      });
    }

    const result = await emailService.sendMatchAlert({
      recipientEmail: recipientEmail.trim().toLowerCase(),
      recipientName: typeof recipientName === 'string' ? recipientName.slice(0, 80) : 'Student',
      originalItem,
      matchedItem,
      matchScore: Math.min(100, Math.max(0, parseInt(matchScore, 10) || 75))
    });

    res.status(200).json({
      success: true,
      data: result
    });
  }),

  /**
   * POST /api/alerts/message
   * Trigger email alert when a user receives a new chat message
   */
  sendMessageAlert: asyncHandler(async (req, res) => {
    const { recipientEmail, recipientName, senderName, messagePreview, conversationId } = req.body;

    if (!isValidEmail(recipientEmail) || !conversationId) {
      return res.status(400).json({
        success: false,
        message: 'A valid recipientEmail and conversationId are required'
      });
    }

    const result = await emailService.sendMessageAlert({
      recipientEmail: recipientEmail.trim().toLowerCase(),
      recipientName: typeof recipientName === 'string' ? recipientName.slice(0, 80) : 'Student',
      senderName: typeof senderName === 'string' ? senderName.slice(0, 80) : 'Student',
      messagePreview: typeof messagePreview === 'string' ? messagePreview.slice(0, 200) : '',
      conversationId
    });

    res.status(200).json({
      success: true,
      data: result
    });
  }),

  /**
   * POST /api/alerts/report
   * Trigger admin alert when a new item is reported
   */
  sendReportAlert: asyncHandler(async (req, res) => {
    const { item, reporterName, reporterEmail } = req.body;

    if (!item || typeof item !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Valid item details are required'
      });
    }

    const result = await emailService.sendReportAdminAlert({
      item,
      reporterName: typeof reporterName === 'string' ? reporterName.slice(0, 80) : 'Student',
      reporterEmail: typeof reporterEmail === 'string' ? reporterEmail.slice(0, 120) : 'N/A'
    });

    res.status(200).json({
      success: true,
      data: result
    });
  }),

  /**
   * POST /api/alerts/status
   * Trigger confirmation alert on item status change
   */
  sendStatusAlert: asyncHandler(async (req, res) => {
    const { recipientEmail, recipientName, item, status } = req.body;

    if (!isValidEmail(recipientEmail) || !item || !status) {
      return res.status(400).json({
        success: false,
        message: 'A valid recipientEmail, item, and status are required'
      });
    }

    const result = await emailService.sendStatusAlert({
      recipientEmail: recipientEmail.trim().toLowerCase(),
      recipientName: typeof recipientName === 'string' ? recipientName.slice(0, 80) : 'Student',
      item,
      status: String(status).slice(0, 30)
    });

    res.status(200).json({
      success: true,
      data: result
    });
  }),

  /**
   * GET /api/alerts/status
   * Health and configuration check for email alerts
   */
  getEmailStatus: asyncHandler(async (req, res) => {
    const status = emailService.getStatus();
    res.status(200).json({
      success: true,
      status
    });
  })
};
