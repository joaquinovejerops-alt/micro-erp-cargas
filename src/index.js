const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/authRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mensaje: 'API del micro ERP corriendo' });
});

const PORT = process.env.PORT || 3000;

app.use('/api/auth', authRoutes);
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});