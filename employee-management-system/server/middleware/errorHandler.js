const errorHandler = (err, req, res, next) => {
  const isProd = process.env.NODE_ENV === 'production';

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: Object.values(err.errors || {}).map((item) => ({
        field: item.path,
        message: item.message,
      })),
      requestId: req.requestId,
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
      requestId: req.requestId,
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(400).json({
      success: false,
      message: `Duplicate value for ${field}`,
      requestId: req.requestId,
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Session expired please login again',
      requestId: req.requestId,
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      requestId: req.requestId,
    });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File too large maximum 2MB allowed',
      requestId: req.requestId,
    });
  }

  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid file type',
      requestId: req.requestId,
    });
  }

  if (err.name === 'MongoNetworkError' || err.name === 'MongoServerSelectionError') {
    return res.status(503).json({
      success: false,
      message: 'Database unavailable try again later',
      requestId: req.requestId,
    });
  }

  console.error('Unhandled error:', {
    requestId: req.requestId,
    message: err.message,
    stack: err.stack,
  });

  return res.status(err.statusCode || 500).json({
    success: false,
    message: isProd ? 'Something went wrong in production' : err.message,
    error: isProd ? undefined : err.stack,
    requestId: req.requestId,
  });
};

module.exports = errorHandler;