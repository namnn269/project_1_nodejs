class AppError extends Error {
  constructor(message, statusCode, status) {
    super(message || 'Unsuccessfully');
    this.statusCode = statusCode || 500;
    this.status = status || 'Fail';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
