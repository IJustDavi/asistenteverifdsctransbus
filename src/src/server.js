const express = require('express');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const dataPath = './src/data.json';

// Sirve los archivos estáticos desde la carpeta de activos
app.use(express.static(path.join(__dirname, 'assets')));

app.use(express.json());

// Endpoint para obtener todos los códigos generados
app.get('/codes', (req, res) => {
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    res.json(data);
});

// Enviar el archivo index.html cuando los usuarios visiten la raíz ("/")
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'assets', 'index.html'));
});


// Inicia el servidor
app.listen(PORT, () => {
    console.log(`Servidor API iniciado en puerto ${PORT}`);
});
