import { rateLimit } from 'express-rate-limit';

const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req, res) =>
    res.status(429).json({
      status: 'error',
      message: 'Terlalu banyak percobaan login. Silakan coba lagi nanti.',
    }),
});

export default loginRateLimit;
