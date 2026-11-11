/**
 * Middleware factory untuk validasi field yang wajib diisi
 * @param {string[]} requiredFields - Array nama field yang wajib
 */
export const validateRequired = (requiredFields) => {
  return (req, res, next) => {
    const missingFields = requiredFields.filter((field) => {
      const value = (req.body || {})[field];
      return (
        value === undefined || value === null || (typeof value === 'string' && value.trim() === '')
      );
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

export const authorizeRoles =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ status: 'error', message: 'Akses tidak diizinkan' });
    }
    return next();
  };

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password) {
    return res.status(400).json({ status: 'error', message: 'Email dan password wajib diisi' });
  }
  return next();
};

export const validatePagination = (req, res, next) => {
  for (const key of ['page', 'limit']) {
    if (
      req.query[key] !== undefined &&
      (!/^\d+$/.test(req.query[key]) || Number(req.query[key]) < 1)
    ) {
      return res
        .status(400)
        .json({ status: 'error', message: `${key} harus berupa bilangan positif` });
    }
  }
  if (Number(req.query.limit || 20) > 100) {
    return res.status(400).json({ status: 'error', message: 'limit maksimal 100' });
  }
  return next();
};

export const validateProduct = (req, res, next) => {
  const body = req.body || {};
  if (
    body.name !== undefined &&
    (typeof body.name !== 'string' || !body.name.trim() || body.name.trim().length > 150)
  ) {
    return res
      .status(400)
      .json({ status: 'error', message: 'Nama produk wajib berupa teks maksimal 150 karakter' });
  }
  for (const key of ['selling_price', 'purchase_price']) {
    if (body[key] !== undefined && (!Number.isFinite(Number(body[key])) || Number(body[key]) < 0)) {
      return res
        .status(400)
        .json({ status: 'error', message: `${key} harus berupa angka non-negatif` });
    }
  }
  if (
    body.stock !== undefined &&
    (!Number.isInteger(Number(body.stock)) || Number(body.stock) < 0)
  ) {
    return res
      .status(400)
      .json({ status: 'error', message: 'stock harus berupa bilangan bulat non-negatif' });
  }
  if (body.category_id !== undefined && body.category_id !== null) {
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (typeof body.category_id !== 'string' || !uuidPattern.test(body.category_id)) {
      return res
        .status(400)
        .json({ status: 'error', message: 'category_id harus berupa UUID yang valid' });
    }
  }
  return next();
};

export const validateCategory = (req, res, next) => {
  const { name } = req.body || {};
  if (typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 100) {
    return res
      .status(400)
      .json({ status: 'error', message: 'Nama kategori wajib berupa teks maksimal 100 karakter' });
  }
  return next();
};

export const validateTransaction = (req, res, next) => {
  const { items } = req.body || {};
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!Array.isArray(items) || items.length === 0 || items.length > 100) {
    return res
      .status(400)
      .json({ status: 'error', message: 'Transaksi harus memiliki 1–100 item' });
  }
  if (
    items.some(
      (item) =>
        !item ||
        !uuidPattern.test(item.product_id) ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1,
    )
  ) {
    return res.status(400).json({
      status: 'error',
      message: 'Setiap item harus memiliki product_id UUID dan quantity bilangan bulat positif',
    });
  }
  return next();
};

export const validateReportQuery = (req, res, next) => {
  const { type, start_date: startDate, end_date: endDate } = req.query;
  const validDate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
  };
  if (type !== undefined && !['daily', 'weekly', 'monthly'].includes(type)) {
    return res
      .status(400)
      .json({ status: 'error', message: 'type harus daily, weekly, atau monthly' });
  }
  if (
    (startDate && !endDate) ||
    (!startDate && endDate) ||
    (startDate && (!validDate(startDate) || !validDate(endDate) || startDate > endDate))
  ) {
    return res
      .status(400)
      .json({ status: 'error', message: 'Rentang tanggal laporan tidak valid' });
  }
  if (startDate && type) {
    return res
      .status(400)
      .json({ status: 'error', message: 'Gunakan type atau rentang tanggal, jangan keduanya' });
  }
  return next();
};
