const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const navieraRoutes = require('./routes/navieraRoutes');
const movimientoRoutes = require('./routes/movimientoRoutes');
const reporteRoutes = require('./routes/reporteRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mensaje: 'API del micro ERP corriendo' });
});

const PORT = process.env.PORT || 3000;

app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/navieras', navieraRoutes);
app.use('/api/movimientos', movimientoRoutes);
app.use('/api/reportes', reporteRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});