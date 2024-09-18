require('dotenv').config();
const express = require('express');
const cors = require('cors');
const scraperRoutes = require('./routes/scraperRoutes');
const db = require('./config/database');

const app = express();

// app.use(cors({
//   origin: process.env.FRONTEND_URL || 'http://localhost:3001',
//   credentials: true
// }));

app.use(cors({
    origin: '*',
    credentials: true
  }));

app.use(express.json());

app.use('/', scraperRoutes);

const PORT = process.env.PORT || 5001;

db.connect()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Unable to connect to the database:', err);
    process.exit(1);
  });