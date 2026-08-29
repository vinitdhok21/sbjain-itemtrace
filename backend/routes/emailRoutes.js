import express from 'express';
import { emailController } from '../controllers/emailController.js';

const router = express.Router();

// Alert Routes
router.post('/match', emailController.sendMatchAlert);
router.post('/message', emailController.sendMessageAlert);
router.post('/report', emailController.sendReportAlert);
router.post('/status', emailController.sendStatusAlert);
router.get('/status', emailController.getEmailStatus);

export default router;
