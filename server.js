const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static('.'));

// Archivo de base de datos JSON
const DB_FILE = 'database.json';

// Inicializar base de datos si no existe
if (!fs.existsSync(DB_FILE)) {
    const initialData = {
        users: [
            {
                id: 1,
                username: 'admin',
                password: 'admin123',
                name: 'Administrador Principal',
                email: 'admin@tvar.com',
                role: 'administrador',
                active: true,
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                username: 'consulta',
                password: 'consulta123',
                name: 'Usuario de Consulta',
                email: 'consulta@tvar.com',
                role: 'consulta',
                active: true,
                createdAt: new Date().toISOString()
            }
        ],
        trucks: [],
        drivers: [],
        operations: [],
        repairs: [],
        fuel: [],
        adblue: [],
        oil: [],
        documents: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
}

// Función para leer la base de datos
function readDatabase() {
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading database:', error);
        return {};
    }
}

// Función para escribir en la base de datos
function writeDatabase(data) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing database:', error);
        return false;
    }
}

// API Routes

// Obtener todos los datos
app.get('/api/data/:collection', (req, res) => {
    const { collection } = req.params;
    const db = readDatabase();
    
    if (db[collection]) {
        res.json(db[collection]);
    } else {
        res.status(404).json({ error: 'Collection not found' });
    }
});

// Guardar datos de una colección
app.post('/api/data/:collection', (req, res) => {
    const { collection } = req.params;
    const data = req.body;
    
    const db = readDatabase();
    db[collection] = data;
    
    if (writeDatabase(db)) {
        res.json({ success: true, message: 'Data saved successfully' });
    } else {
        res.status(500).json({ error: 'Failed to save data' });
    }
});

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor TVAR ejecutándose en puerto ${PORT}`);
    console.log(`📊 Base de datos: ${DB_FILE}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
});

// Manejo de errores
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});