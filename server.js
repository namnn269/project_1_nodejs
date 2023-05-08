const dotenv = require('dotenv');
dotenv.config({ path: '.env', encoding: 'utf-8' });
const app = require('./app');
const mongoose = require('mongoose');

const port = Number.parseInt(process.env.PORT + '');
const DB = process.env.MONGO_DB;
const password = process.env.PASSWORD_DB;
const URL = DB?.replace('<password>', password || '') || '';

mongoose.connect(URL, { autoIndex: true }).then(() => {
  console.log('Connecting DB...');
});

const server = app.listen(port, 'localhost', () => {
  console.log(`listening on port ${port}`);
});

process.on('unhandledRejection', (err) => {
  console.log('Crashing app...');
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', (err) => {
  console.log('error ====> ', err);
});
