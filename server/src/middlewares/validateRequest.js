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
 * Middleware untuk validasi ID parameter harus angka positif
 */
export const validateIdParam = (req, res, next) => {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
        return res.status(400).json({
            status: 'error',
            message: 'ID tidak valid, harus berupa angka positif',
        });
    }
    req.params.id = id;
    next();
};
