/* eslint-disable no-console */
const AppError = require('../utils/appError');

const handleJWTerror = () =>
  new AppError('Invalid Token. Please log in again!', 401);

const handleJWTexpireserror = () => {
  return new AppError('Your token has expired,Please login again', 401);
};

const handleCastErrorDB = (err) => {
  //console.log('in here');
  const message = `Invalid ${err.path} : ${err.value}.`;

  return new AppError(message, 400);
};

const handleDuplicateFieldsValue = (err) => {
  // console.log('in here');
  //console.log(err.keyValue.name);

  const value = err.keyValue.name;
  // console.log(value);
  const message = `Duplicate field value "${value}", please add another value`;

  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);

  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const sendErrorDev = (err, req, res) => {
  console.log('development');
  //API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  //RENDERED WEBSITE
  console.error('ERROR:', err);
  res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
  console.log('production');
  //A) API
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    console.error('ERROR:', err);
    return res.status(err.statusCode).json({
      status: 500,
      message: 'SOMETHING WENT VERY WRONG!',
    });
  }
  //B) RENDERED WEBSITE
  //If its an operational error send this
  if (err.isOperational) {
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
  } else {
    //Else its a programming error, then send a very generic message
    console.error('ERROR:', err);
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: 'Try again later.',
    });
  }
};

module.exports = (err, req, res, next) => {
  //console.log(err.stack);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;
    console.log(error);
    if (error.path === '_id') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsValue(error);
    if (error._message === 'Validation failed')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTerror();
    if (error.name === 'TokenExpiredError') error = handleJWTexpireserror();
    sendErrorProd(error, req, res);
  }
};
