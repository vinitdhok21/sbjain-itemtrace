import asyncHandler from '../utils/asyncHandler.js';
import config from '../config/environment.js';

// @desc    Get API Health status
// @route   GET /api/health
// @access  Public
export const getHealth = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    environment: config.env,
    timestamp: new Date().toISOString()
  });
});

// @desc    Get API Readiness status
// @route   GET /api/health/ready
// @access  Public
export const getReady = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ready',
    services: {
      api: 'online',
      email: config.email.isConfigured ? 'smtp_connected' : 'simulation_mode'
    },
    environment: config.env,
    timestamp: new Date().toISOString()
  });
});
