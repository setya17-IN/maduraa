/**
 * Global error handler middleware
 * Tangkap semua error yang tidak ter-handle di controller
 */
const errorHandler = (err, _req, res, _next) => {
    console.error('❌ Unhandled Error:', err.stack || err.message);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Terjadi kesalahan pada server';

    res.status(statusCode).json({
        status: 'error',
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};

export default errorHandler;
