const express = require('express');
const morgan = require('morgan');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');

const tourRoutes = require('./routes/tourRoutes');
const userRoutes = require('./routes/userRoutes');
const globalErrorHandler = require('./controller/errorController');

const app = express();

const limiter = rateLimit.default({
  windowMs: 60 * 1000,
  max: 300,
  message: 'Only 3 request per 1 hour',
  statusCode: 403,
});

// set security HTTP headers
app.use(helmet.default());

// prevent too many requests
app.use(limiter);

// body parser, reading data from body and pass in to req.body
app.use(express.json({ limit: '10kb' }));

// prevent params pollution
app.use(hpp({ whitelist: ['email'] }));

// data sanitization against xss
app.use(xss());

// data sanitization against NoSQL query injection
app.use(mongoSanitize());

// log info request
if (process.env.NODE_ENV === 'dev') {
  app.use(morgan('dev'));
}

app.use('/api/v1/tours', tourRoutes);
app.use('/api/v1/users', userRoutes);

app.all('*', (req, res, next) => {
  res.status(404).json({ status: 'Fail', message: 'Link not found' });
});

app.use(globalErrorHandler);

module.exports = app;
