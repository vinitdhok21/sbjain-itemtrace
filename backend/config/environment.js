import dotenv from 'dotenv';

dotenv.config();

const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = parseInt(process.env.PORT, 10) || 5000;
const CLIENT_URL = process.env.CLIENT_URL || process.env.CORS_ORIGIN || 'http://localhost:5173';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'dhokvinit@gmail.com';

// Supabase Credentials
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Email & SMTP Configuration
const EMAIL_FROM = process.env.EMAIL_FROM || `"SBJain ItemTrace" <${ADMIN_EMAIL}>`;
const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = parseInt(process.env.SMTP_PORT, 10) || 587;
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';

// Diagnostic check during backend initialization
const isSmtpConfigured = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);

if (!isSmtpConfigured) {
  if (NODE_ENV === 'development') {
    console.info('ℹ️  [Config] SMTP credentials not set. Email alerts will safely run in terminal SIMULATION mode.');
  } else {
    console.warn('⚠️  [Config] SMTP credentials missing in production environment.');
  }
}

if (!SUPABASE_URL) {
  console.warn('⚠️  [Config] SUPABASE_URL is not defined in backend environment.');
}

export const config = {
  env: NODE_ENV,
  isProduction: NODE_ENV === 'production',
  isDevelopment: NODE_ENV === 'development',
  port: PORT,
  clientUrl: CLIENT_URL,
  adminEmail: ADMIN_EMAIL,
  supabase: {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
    serviceRoleKey: SUPABASE_SERVICE_ROLE_KEY
  },
  email: {
    from: EMAIL_FROM,
    isConfigured: isSmtpConfigured,
    smtp: {
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      }
    }
  }
};

export default config;
