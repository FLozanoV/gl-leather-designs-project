"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const promise_1 = __importDefault(require("mysql2/promise")); // Importa la versión con promesas
const app = (0, express_1.default)();
const port = process.env.PORT || 5000;
// Configurar CORS
app.use((0, cors_1.default)({
    origin: 'http://localhost:3000', // Permitir solo solicitudes desde tu frontend Next.js
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express_1.default.json()); // Para parsear el cuerpo de las solicitudes en formato JSON
// Configuración de la conexión a la base de datos MySQL (¡ASEGÚRATE DE USAR TUS PROPIAS CREDENCIALES!)
const dbConfig = {
    host: 'localhost',
    user: 'root', // Tu usuario de MySQL
    password: '1234', // Tu contraseña de MySQL (si tienes)
    database: 'gl_leather_designs', // El nombre de tu base de datos
};
// Ruta de prueba para verificar la conexión
app.get('/', (req, res) => {
    res.send('API de G. L. LEATHER DESIGNS funcionando! Bienvenida');
});
// Ruta para verificar la conexión a la base de datos
app.get('/check-db', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let connection;
    try {
        connection = yield promise_1.default.createConnection(dbConfig);
        yield connection.query('SELECT 1'); // Intenta una consulta simple para verificar la conexión
        res.status(200).send('Conexión a la base de datos exitosa!');
    }
    catch (error) {
        console.error('Error al conectar con la base de datos:', error.message);
        res.status(500).send(`Error al conectar con la base de datos: ${error.message}`);
    }
    finally {
        if (connection) {
            yield connection.end(); // Cierra la conexión
        }
    }
}));
// Iniciar el servidor
app.listen(port, () => {
    console.log(`Backend server corriendo en http://localhost:${port}`);
});
