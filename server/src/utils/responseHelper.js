/**
 * Helper untuk response API yang konsisten
 */

export const successResponse = (res, message, data = null, statusCode = 200) => {
    const response = {
        status: 'success',
        message,
    };
    if (data !== null) {
        response.data = data;
    }
    return res.status(statusCode).json(response);
};

export const errorResponse = (res, message, statusCode = 500) => {
    return res.status(statusCode).json({
        status: 'error',
        message,
    });
};

export const paginatedResponse = (res, message, data, page, limit, total) => {
    return res.status(200).json({
        status: 'success',
        message,
        data,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit),
        },
    });
};
