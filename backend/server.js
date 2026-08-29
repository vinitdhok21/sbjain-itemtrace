import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './config/environment.js';
import healthRoutes from './routes/healthRoutes.js';
import emailRoutes from './routes/emailRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { generalLimiter, emailAlertLimiter } from './middleware/rateLimiter.js';

const app = express();

// 1. Security Headers via Helmet
app.use(helmet());

// 2. CORS configuration (Strict client origin binding)
const corsOptions = {
  origin: config.clientUrl,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// 3. Request Payload Size Limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 4. Request Logging in Development
if (config.isDevelopment) {
  app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.url}`);
    next();
  });
}

// 5. Apply Rate Limiters
app.use('/api', generalLimiter);
app.use('/api/alerts', emailAlertLimiter);

// 6. Mount API Routes
app.use('/api/health', healthRoutes);
app.use('/api/ready', healthRoutes);
app.use('/api/alerts', emailRoutes);

// 7. Fallback error-handling middlewares
app.use(notFound);
app.use(errorHandler);

// 8. Start Server
app.listen(config.port, () => {
  console.log(`🚀 SBJain ItemTrace Backend active on http://localhost:${config.port} [Mode: ${config.env}]`);
});
