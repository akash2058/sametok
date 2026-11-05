require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 60 * 1000, max: 100 }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/videos', require('./routes/videos'));
app.use('/api/users', require('./routes/users'));

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', require('./routes/auth'));

app.use(errorHandler);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(process.env.PORT, () =>
      console.log(`API running on http://localhost:${process.env.PORT}`)
    );
  })
  .catch(err => {
    console.error('DB connection failed:', err.message);
    process.exit(1);
  });