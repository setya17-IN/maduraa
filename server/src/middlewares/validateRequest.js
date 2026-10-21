/**
 * Middleware factory untuk validasi field yang wajib diisi
 * @param {string[]} requiredFields - Array nama field yang wajib
 */
export const validateRequired = (requiredFields) => {
  return (req, res, next) => {
    const missingFields = requiredFields.filter((field) => {
      const value = req.body[field];
      return value === undefined || value === null || value === '';
    });

    if (missingFields.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: `Field berikut wajib diisi: ${missingFields.join(', ')}`,
      });
    }

    next();
  };
};

/**
 * Middleware untuk validasi ID parameter berbentuk UUID
 */
export const validateIdParam = (req, res, next) => {
  const id = req.params.id;
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(id)) {
    return res.status(400).json({
      status: 'error',
      message: 'ID tidak valid, harus berupa UUID',
    });
  }
  next();
};
