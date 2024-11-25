const express = require('express');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const dataPath = './src/data.json';

app.use(express.json());

// Endpoint para obtener todos los códigos generados
app.get('/codes', (req, res) => {
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    res.json(data);
});

// Inicia el servidor
app.listen(PORT, () => {
    console.log(`Servidor API iniciado en puerto ${PORT}`);
});
