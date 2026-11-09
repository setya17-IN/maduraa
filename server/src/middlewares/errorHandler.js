/**
 * Global error handler middleware
 * Tangkap semua error yang tidak ter-handle di controller
 */
const errorHandler = (err, _req, res, _next) => {
  console.error('❌ Unhandled Error:', err.stack || err.message);

  const statusCode = err.statusCode || err.status || 500;
  const message = statusCode >= 500 ? 'Terjadi kesalahan pada server' : err.message;

  res.status(statusCode).json({
    status: 'error',
    message,
  });
};

export default errorHandler;
