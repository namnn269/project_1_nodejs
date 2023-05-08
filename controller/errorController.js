const AppError = require('../utils/appError');

const handleErrorDev = (err, res) => {
  console.log('in handle error dev');
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

const handleErrorProd = (err, res) => {
  console.log('in handle error prod');
  res
    .status(err.statusCode)
    .json({ status: err.status, message: err.message, stack: err.stack });
};

const handleCastError = (err) => {
  const message = `Can not cast ${err.path} (${err.value}) to type ${err.kind}`;
  return new AppError(message, 400, 'Fail');
};

const handleDuplicateError = (err) => {
  const keyValueError = err.keyValue;
  const key = Object.keys(keyValueError)[0];
  const value = keyValueError[key];
  const message = `Duplicate on field '${key}' with value '${value}'`;
  return new AppError(message, 403, 'fail');
};

const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = 'Validation error: '.concat(errors.join('; '));
  return new AppError(message, 400, 'fail');
};

const handleTokenExpiredError = (err) =>
  new AppError('Access token expired, please login again', 401);

const handleJsonWebTokenError = (err) => new AppError(err.message, 400, 'Fail');

const handleEmailError = (err) => new AppError('Error on sending email', 500);

module.exports = (err, req, res, next) => {
  err.status = err.status || 'Fail';
  err.statusCode = err.statusCode * 1 || 500;

  if (process.env.NODE_ENV === 'dev') {
    handleErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'prod') {
    if (err.name === 'CastError') err = handleCastError(err);
    else if (err.code === 11000) err = handleDuplicateError(err);
    else if (err.name === 'ValidationError') err = handleValidationError(err);
    else if (err.name === 'TokenExpiredError')
      err = handleTokenExpiredError(err);
    else if (err.name === 'JsonWebTokenError')
      err = handleJsonWebTokenError(err);
    else if (err.code === 'EENVELOPE') err = handleEmailError(err);
    handleErrorProd(err, res);
  }
};
