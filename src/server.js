require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/adoptme';

// El servidor HTTP arranca siempre; MongoDB se conecta de forma independiente
app.listen(PORT, () => {
  console.log(`Servidor AdoptMe escuchando en puerto ${PORT}`);
  console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
});

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Conectado a MongoDB correctamente');
  })
  .catch((err) => {
    console.error(`Advertencia: no se pudo conectar a MongoDB — ${err.message}`);
    console.error('La API está activa pero las rutas que usan BD no funcionarán sin conexión.');
  });
