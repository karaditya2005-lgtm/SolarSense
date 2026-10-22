export const sendSuccess = (res, data = {}, statusCode = 200, meta = null) => {
  const payload = {
    success: true,
    data,
  };
  if (meta) {
    payload.meta = meta;
  }
  return res.status(statusCode).json(payload);
};

export const sendError = (res, error, statusCode = 500, requestId = null) => {
  const payload = {
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message || 'An unexpected error occurred',
      details: error.details || [],
      requestId: requestId || res.req?.id || null,
    },
  };
  return res.status(statusCode).json(payload);
};
