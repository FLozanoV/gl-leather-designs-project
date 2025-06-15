"use strict";
// gl-leather-designs-final-backend/src/app.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Esta línea debe ser la primera en el archivo para cargar las variables de entorno
require("dotenv/config"); // Usar import para ES Modules
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const promise_1 = __importDefault(require("mysql2/promise"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// --- NUEVAS IMPORTACIONES PARA AUTENTICACIÓN ---
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Asegúrate de que 'src/utils.ts' contiene la definición de asyncHandler
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const app = (0, express_1.default)();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
// Asegúrate de que JWT_SECRET esté definido en tu archivo .env
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
    console.error('ERROR: JWT_SECRET no está definido en el archivo .env. ¡Es crucial para la seguridad!');
    process.exit(1); // Sale de la aplicación si no hay clave secreta
}
console.log('JWT_SECRET cargado. (No mostrar el valor real en logs de producción)');
// Configuración de CORS
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production' ? 'https://your-frontend-domain.com' : process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], // Añadido PATCH
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));
app.use(express_1.default.json()); // Middleware para parsear JSON bodies
// --- Configuración de Multer para la subida de imágenes ---
const uploadPath = path_1.default.join(__dirname, '..', 'uploads'); // Directorio de destino para las imágenes
if (!fs_1.default.existsSync(uploadPath)) {
    fs_1.default.mkdirSync(uploadPath, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadPath);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname);
        cb(null, filename);
    }
});
// Filtro de archivos para permitir solo imágenes
const fileFilter = (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    }
    else {
        cb(new Error('Solo se permiten archivos de imagen!'));
    }
};
const upload = (0, multer_1.default)({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Límite de 5MB
});
// Servir archivos estáticos (imágenes)
app.use('/uploads', express_1.default.static(uploadPath));
// Configuración de la conexión a la base de datos MySQL usando variables de entorno
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};
// Crea un pool de conexiones para una gestión más eficiente de la base de datos
const pool = promise_1.default.createPool(dbConfig);
// Verificación inicial de la conexión al pool de la base de datos
pool.getConnection()
    .then((connection) => {
    console.log('Conexión al pool de la base de datos exitosa.');
    connection.release();
})
    .catch(err => {
    console.error('Error crítico al conectar al pool de la base de datos al inicio:', err.message);
    console.error('Asegúrate de que MySQL esté corriendo y las credenciales en tu .env sean correctas.');
    // Opcional: Salir del proceso si la conexión a la DB es crítica para el inicio del servidor
    // process.exit(1);
});
// ---------------------------------------------------
// GENERAL API ROUTES
// ---------------------------------------------------
// Ruta de prueba para verificar que el backend está corriendo
app.get('/', (req, res) => {
    res.json({ message: '¡Hola desde el backend de G. L. LEATHER DESIGNS! El servidor está funcionando correctamente.' });
});
// Ruta para verificar la conexión a la base de datos
app.get('/check-db', asyncHandler(async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.query('SELECT 1 + 1 AS solution');
        return res.status(200).json({ message: 'Conexión a la base de datos exitosa!' });
    }
    finally {
        if (connection) {
            connection.release();
        }
    }
}));
// ---------------------------------------------------
// NUEVAS RUTAS PARA AUTENTICACIÓN (REGISTRO Y LOGIN)
// ---------------------------------------------------
// Ruta de Registro de Usuario
app.post('/api/register', asyncHandler(async (req, res) => {
    let connection;
    try {
        const { email, password } = req.body;
        // 1. Validación básica de entrada
        if (!email || !password) {
            return res.status(400).json({ message: 'Correo electrónico y contraseña son obligatorios.' });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ message: 'Formato de correo electrónico inválido.' });
        }
        connection = await pool.getConnection();
        // 2. Verificar si el email ya existe
        const [existingUserRows] = await connection.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUserRows.length > 0) {
            return res.status(409).json({ message: 'El correo electrónico ya está registrado.' });
        }
        // 3. Hashear la contraseña
        const salt = await bcryptjs_1.default.genSalt(10); // Genera un "salt" (cadena aleatoria)
        const hashedPassword = await bcryptjs_1.default.hash(password, salt); // Hashea la contraseña con el salt
        // 4. Insertar el nuevo usuario en la base de datos
        // NOTA: 'client' es el rol por defecto que definimos en la tabla users
        const [result] = await connection.execute('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', [email, hashedPassword, 'client']);
        const newUserId = result.insertId;
        return res.status(201).json({ message: 'Usuario registrado exitosamente', userId: newUserId });
    }
    catch (error) { // Tipado de 'error' a 'unknown'
        console.error('Error al registrar usuario:', error);
        let errorMessage = 'Error interno del servidor al registrar el usuario.';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        else if (typeof error === 'string') {
            errorMessage = error;
        }
        return res.status(500).json({ message: errorMessage });
    }
    finally {
        if (connection) {
            connection.release();
        }
    }
}));
// Ruta de Login de Usuario
app.post('/api/login', asyncHandler(async (req, res) => {
    let connection;
    try {
        const { email, password } = req.body;
        // 1. Validación básica de entrada
        if (!email || !password) {
            return res.status(400).json({ message: 'Correo electrónico y contraseña son obligatorios.' });
        }
        connection = await pool.getConnection();
        // 2. Buscar al usuario por email
        const [userRows] = await connection.execute('SELECT id, email, password, role FROM users WHERE email = ?', [email]);
        const user = userRows[0];
        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }
        // 3. Comparar la contraseña proporcionada con la contraseña hasheada
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }
        // 4. Generar un Token de Autenticación (JWT)
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, jwtSecret, // Usa la clave secreta cargada de .env
        { expiresIn: '1d' } // Token expira en 1 día (antes 1h)
        );
        // 5. Devolver el token y la información del usuario al frontend
        return res.status(200).json({
            message: 'Inicio de sesión exitoso.',
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            }
        });
    }
    catch (error) { // Tipado de 'error' a 'unknown'
        console.error('Error al iniciar sesión:', error);
        let errorMessage = 'Error interno del servidor al iniciar sesión.';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        else if (typeof error === 'string') {
            errorMessage = error;
        }
        return res.status(500).json({ message: errorMessage });
    }
    finally {
        if (connection) {
            connection.release();
        }
    }
}));
// ---------------------------------------------------
// MIDDLEWARE DE AUTENTICACIÓN Y AUTORIZACIÓN
// ---------------------------------------------------
// Middleware para proteger rutas (verificar JWT)
const protect = (req, res, next) => {
    // 1. Obtener el token del encabezado de autorización
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1]; // Formato: "Bearer TOKEN"
    }
    console.log('Backend Auth: Intentando autenticar token...'); // Log de depuración
    if (!token) {
        console.log('Backend Auth: Token no proporcionado. Acceso denegado.'); // Log de depuración
        return res.status(401).json({ message: 'Acceso denegado. No se proporcionó token de autenticación.' });
    }
    try {
        // 2. Verificar el token
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        // 3. Adjuntar el usuario (decodificado del token) al objeto request
        // Asegurarse de que `decoded` es un objeto antes de la asignación
        if (typeof decoded === 'object' && decoded !== null) {
            req.user = decoded;
        }
        else {
            // Manejar caso donde el token decodificado no es un objeto
            return res.status(401).json({ message: 'Token de autenticación inválido: formato de usuario incorrecto.' });
        }
        console.log('Backend Auth: Token autenticado exitosamente. Usuario:', req.user.email); // Log de depuración
        next(); // Continuar con la siguiente función de middleware/ruta
    }
    catch (error) { // Tipado de 'error' a 'unknown'
        console.error('Error en la verificación del token:', error); // Log de depuración
        // Manejar diferentes errores de JWT
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return res.status(401).json({ message: 'Token de autenticación expirado. Por favor, inicia sesión de nuevo.' });
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return res.status(401).json({ message: 'Token de autenticación inválido. Por favor, inicia sesión de nuevo.' });
        }
        return res.status(500).json({ message: 'Error interno del servidor al autenticar el token.' });
    }
};
// Middleware para autorizar roles
const authorize = (roles) => {
    return (req, res, next) => {
        // req.user viene del middleware 'protect'
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Acceso denegado. No tienes los permisos necesarios.' });
        }
        next(); // El usuario tiene el rol requerido, continuar
    };
};
// ---------------------------------------------------
// RUTAS PARA PRODUCTOS (PROTEGIDAS CON AUTENTICACIÓN Y AUTORIZACIÓN)
// ---------------------------------------------------
// Obtener todos los productos (puede ser pública o no, aquí la dejo pública para visualización)
app.get('/api/products', asyncHandler(async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.execute('SELECT * FROM products');
        return res.status(200).json(rows);
    }
    finally {
        if (connection) {
            connection.release();
        }
    }
}));
// Crear un nuevo producto (solo para admin)
app.post('/api/products', protect, authorize(['admin']), upload.single('image'), asyncHandler(async (req, res) => {
    let connection;
    try {
        const { name, description, price, stock, category } = req.body;
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
        // Validación de campos
        if (!name || typeof name !== 'string' || name.trim() === '') {
            if (req.file) {
                fs_1.default.unlink(req.file.path, (err) => { if (err)
                    console.error('Error al eliminar archivo fallido por validación (nombre vacío):', err); });
            }
            return res.status(400).json({ message: 'El nombre del producto es obligatorio.' });
        }
        const parsedPrice = Number(price);
        if (isNaN(parsedPrice) || parsedPrice <= 0) {
            if (req.file) {
                fs_1.default.unlink(req.file.path, (err) => { if (err)
                    console.error('Error al eliminar archivo fallido por validación (precio inválido):', err); });
            }
            return res.status(400).json({ message: 'El precio debe ser un número válido y mayor que cero.' });
        }
        const parsedStock = (stock === '' || stock === null || stock === undefined) ? 0 : Number(stock);
        if (isNaN(parsedStock) || parsedStock < 0) {
            if (req.file) {
                fs_1.default.unlink(req.file.path, (err) => { if (err)
                    console.error('Error al eliminar archivo fallido por validación de stock:', err); });
            }
            return res.status(400).json({ message: 'El stock debe ser un número entero válido y no negativo.' });
        }
        connection = await pool.getConnection();
        const [result] = await connection.execute('INSERT INTO products (name, description, price, stock, image_url, category) VALUES (?, ?, ?, ?, ?, ?)', [name.trim(), description ? description.trim() : null, parsedPrice, parsedStock, imageUrl, category]);
        const newProductId = result.insertId;
        const [rows] = await connection.execute('SELECT * FROM products WHERE id = ?', [newProductId]);
        if (rows.length === 0) {
            if (req.file) {
                fs_1.default.unlink(req.file.path, (err) => { if (err)
                    console.error('Error al eliminar archivo tras fallo de recuperación del producto:', err); });
            }
            return res.status(500).json({ message: 'Producto creado, pero no se pudo recuperar la información completa.' });
        }
        return res.status(201).json(rows[0]);
    }
    catch (error) {
        if (req.file) {
            fs_1.default.unlink(req.file.path, (err) => { if (err)
                console.error('Error al eliminar archivo tras fallo en la DB/ruta de creación:', err); });
        }
        console.error('Error al crear producto:', String(error));
        return res.status(500).json({
            message: 'Error interno del servidor al crear el producto.',
            error: (error instanceof Error) ? error.message : String(error),
            stack: (error instanceof Error) ? error.stack : 'No stack available'
        });
    }
    finally {
        if (connection) {
            connection.release();
        }
    }
}));
// Obtener un producto por ID
app.get('/api/products/:id', protect, asyncHandler(async (req, res) => {
    let connection;
    try {
        const productId = parseInt(req.params.id, 10);
        console.log(`Backend: Intentando obtener producto con ID: ${productId}`); // Log de depuración
        if (isNaN(productId)) {
            console.log(`Backend: ID de producto inválido: ${req.params.id}`); // Log de depuración
            return res.status(400).json({ message: 'ID de producto inválido. Debe ser un número.' });
        }
        connection = await pool.getConnection();
        const [rows] = await connection.execute('SELECT * FROM products WHERE id = ?', [productId]);
        if (rows.length === 0) {
            console.log(`Backend: Producto con ID ${productId} no encontrado.`); // Log de depuración
            return res.status(404).json({ message: 'Producto no encontrado.' });
        }
        console.log(`Backend: Producto con ID ${productId} obtenido exitosamente.`); // Log de depuración
        return res.status(200).json(rows[0]);
    }
    catch (error) {
        console.error('Backend: Error al obtener producto por ID:', String(error)); // Log de depuración
        return res.status(500).json({
            message: 'Error interno del servidor al obtener el producto.',
            error: (error instanceof Error) ? error.message : String(error),
            stack: (error instanceof Error) ? error.stack : 'No stack available'
        });
    }
    finally {
        if (connection) {
            connection.release();
        }
    }
}));
// Actualizar campos de producto (sin imagen)
app.put('/api/products/:id', protect, authorize(['admin']), asyncHandler(async (req, res) => {
    let connection;
    console.log('\n--- INICIO LOG DE ACTUALIZACIÓN DE PRODUCTO (JSON) ---');
    console.log('1. Backend: Solicitud PUT recibida para /api/products/:id');
    console.log('2. Backend: ID del producto (req.params.id):', req.params.id);
    console.log('3. Backend: Cuerpo COMPLETO de la solicitud (req.body):', req.body);
    try {
        const productId = parseInt(req.params.id, 10);
        if (isNaN(productId)) {
            return res.status(400).json({ message: 'ID de producto inválido.' });
        }
        const { name, description, price, stock, image_url, category } = req.body;
        console.log('4. Backend: Valores individuales desestructurados:');
        console.log('    - name:', name);
        console.log('    - description:', description);
        console.log('    - price:', price);
        console.log('    - stock:', stock);
        console.log('    - image_url (del body):', image_url);
        console.log('    - category (del body):', category);
        connection = await pool.getConnection();
        const [productCheckRows] = await connection.execute('SELECT image_url, category FROM products WHERE id = ?', [productId]);
        const existingProduct = productCheckRows[0];
        if (!existingProduct) {
            return res.status(404).json({ message: 'Producto no encontrado para actualizar.' });
        }
        // Usar la image_url que viene del body. Si el frontend envía `null` o `''`, se entenderá como "sin imagen".
        let imageUrlToUpdate = image_url !== undefined ? image_url : existingProduct.image_url;
        // Validaciones (simplificadas para el ejemplo)
        if (!name || typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ message: 'El nombre del producto es obligatorio.' });
        }
        const parsedPrice = Number(price);
        if (isNaN(parsedPrice) || parsedPrice <= 0) {
            return res.status(400).json({ message: 'El precio debe ser un número válido y mayor que cero.' });
        }
        const parsedStock = (stock === '' || stock === null || stock === undefined) ? 0 : Number(stock);
        if (isNaN(parsedStock) || parsedStock < 0) {
            return res.status(400).json({ message: 'El stock debe ser un número entero válido y no negativo.' });
        }
        // CORRECCIÓN DE LA SINTAXIS SQL DE UPDATE QUERY
        const updateQuery = `
      UPDATE products
      SET
        name = ?,
        description = ?,
        price = ?,
        stock = ?,
        image_url = ?,
        category = ?
      WHERE id = ?
    `;
        const queryValues = [
            name.trim(),
            description ? description.trim() : null,
            parsedPrice,
            parsedStock,
            imageUrlToUpdate,
            category,
            productId
        ];
        console.log('5. Backend: Consulta SQL a ejecutar (queryValues):', queryValues);
        const [updateResult] = await connection.execute(updateQuery, queryValues);
        if (updateResult.affectedRows === 0) {
            console.warn('6. Backend: Producto no encontrado o no se realizó ningún cambio en la DB (ID:', productId, ')');
            return res.status(404).json({ message: 'Producto no encontrado o no se realizó ningún cambio.' });
        }
        console.log('7. Backend: Producto actualizado exitosamente en la DB. Filas afectadas:', updateResult.affectedRows);
        const [updatedProductRows] = await connection.execute('SELECT * FROM products WHERE id = ?', [productId]);
        if (updatedProductRows.length === 0) {
            console.error('Error: Producto actualizado pero no encontrado para recuperar. ID:', productId);
            return res.status(500).json({ message: 'Producto actualizado, pero no se pudo recuperar la información completa.' });
        }
        return res.status(200).json(updatedProductRows[0]);
    }
    catch (error) {
        console.error('8. Backend ERROR al actualizar producto (JSON):', String(error));
        return res.status(500).json({
            message: 'Error interno del servidor al actualizar el producto.',
            error: (error instanceof Error) ? error.message : String(error),
            stack: (error instanceof Error) ? error.stack : 'No stack available'
        });
    }
    finally {
        if (connection) {
            connection.release();
        }
        console.log('--- FIN LOG DE ACTUALIZACIÓN DE PRODUCTO (JSON) ---\n');
    }
}));
// NUEVA RUTA: Actualizar solo la imagen del producto
app.patch('/api/products/:id/image', protect, authorize(['admin']), upload.single('image'), asyncHandler(async (req, res) => {
    let connection;
    console.log('\n--- INICIO LOG DE ACTUALIZACIÓN DE IMAGEN ---');
    console.log('1. Backend: Solicitud PATCH recibida para /api/products/:id/image');
    console.log('2. Backend: ID del producto (req.params.id):', req.params.id);
    try {
        const productId = parseInt(req.params.id, 10);
        if (isNaN(productId)) {
            if (req.file) { // Si hay un archivo subido, elimínalo si el ID es inválido
                fs_1.default.unlink(req.file.path, (err) => { if (err)
                    console.error('Error al eliminar archivo subido con ID inválido:', err); });
            }
            return res.status(400).json({ message: 'ID de producto inválido.' });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'No se ha proporcionado ningún archivo de imagen para actualizar.' });
        }
        const newImageUrl = `/uploads/${req.file.filename}`;
        console.log('3. Backend: Nueva URL de imagen generada:', newImageUrl);
        connection = await pool.getConnection();
        // Obtener la URL de la imagen antigua para eliminarla si es necesario
        const [productCheckRows] = await connection.execute('SELECT image_url FROM products WHERE id = ?', [productId]);
        const existingProduct = productCheckRows[0];
        if (!existingProduct) {
            if (req.file) { // Si hay un archivo subido, elimínalo si el producto no existe
                fs_1.default.unlink(req.file.path, (err) => { if (err)
                    console.error('Error al eliminar nuevo archivo subido para producto no existente:', err); });
            }
            return res.status(404).json({ message: 'Producto no encontrado para actualizar su imagen.' });
        }
        const oldImageUrl = existingProduct.image_url;
        // Actualizar solo el campo image_url en la base de datos
        const updateQuery = `UPDATE products SET image_url = ? WHERE id = ?`;
        const queryValues = [newImageUrl, productId];
        console.log('4. Backend: Consulta SQL para actualizar imagen (queryValues):', queryValues);
        const [updateResult] = await connection.execute(updateQuery, queryValues);
        if (updateResult.affectedRows === 0) {
            if (req.file) { // Si hay un archivo subido, elimínalo si no se actualizó ninguna fila
                fs_1.default.unlink(req.file.path, (err) => { if (err)
                    console.error('Error al eliminar nuevo archivo no utilizado (no hubo affectedRows):', err); });
            }
            console.warn('5. Backend: Producto no encontrado o no se realizó ningún cambio al actualizar la imagen (ID:', productId, ')');
            return res.status(404).json({ message: 'Producto no encontrado o no se pudo actualizar la imagen.' });
        }
        // Si la actualización fue exitosa y existía una imagen antigua, eliminarla
        if (oldImageUrl) {
            // Usar path.basename para obtener solo el nombre del archivo de la URL
            const imageFileName = path_1.default.basename(oldImageUrl);
            const imagePath = path_1.default.join(uploadPath, imageFileName);
            fs_1.default.unlink(imagePath, (err) => {
                if (err) {
                    console.error('Error al eliminar imagen antigua tras reemplazo:', imagePath, err);
                }
                else {
                    console.log('6. Backend: Imagen antigua eliminada exitosamente:', imagePath);
                }
            });
        }
        console.log('7. Backend: Imagen del producto actualizada exitosamente. Filas afectadas:', updateResult.affectedRows);
        return res.status(200).json({ message: 'Imagen del producto actualizada con éxito.', imageUrl: newImageUrl });
    }
    catch (error) {
        if (req.file) { // Asegurarse de eliminar la nueva imagen si falla la DB
            fs_1.default.unlink(req.file.path, (err) => { if (err)
                console.error('Error al eliminar archivo tras fallo en la DB (PATCH image):', err); });
        }
        console.error('8. Backend ERROR al actualizar imagen de producto:', String(error));
        return res.status(500).json({
            message: 'Error interno del servidor al actualizar la imagen.',
            error: (error instanceof Error) ? error.message : String(error),
            stack: (error instanceof Error) ? error.stack : 'No stack available'
        });
    }
    finally {
        if (connection) {
            connection.release();
        }
        console.log('--- FIN LOG DE ACTUALIZACIÓN DE IMAGEN ---\n');
    }
}));
// Eliminar un producto por ID (solo para admin)
app.delete('/api/products/:id', protect, authorize(['admin']), asyncHandler(async (req, res) => {
    let connection;
    try {
        const productId = parseInt(req.params.id, 10);
        if (isNaN(productId)) {
            return res.status(400).json({ message: 'ID de producto inválido.' });
        }
        connection = await pool.getConnection();
        // Obtener la URL de la imagen antes de eliminar el producto
        const [productRows] = await connection.execute('SELECT image_url FROM products WHERE id = ?', [productId]);
        const productToDelete = productRows[0];
        if (!productToDelete) {
            return res.status(404).json({ message: 'Producto no encontrado para eliminar.' });
        }
        const [deleteResult] = await connection.execute('DELETE FROM products WHERE id = ?', [productId]);
        if (deleteResult.affectedRows === 0) {
            return res.status(500).json({ message: 'No se pudo eliminar el producto (puede que ya no exista).' });
        }
        // Si había una imagen, eliminarla del sistema de archivos
        if (productToDelete.image_url) {
            // Usar path.basename para obtener solo el nombre del archivo de la URL
            const imageFileName = path_1.default.basename(productToDelete.image_url);
            const imagePath = path_1.default.join(uploadPath, imageFileName);
            fs_1.default.unlink(imagePath, (err) => {
                if (err) {
                    console.error('Error al eliminar archivo de imagen asociado:', imagePath, err);
                }
                else {
                    console.log('Imagen eliminada del sistema de archivos:', imagePath);
                }
            });
        }
        return res.status(200).json({ message: `Producto con ID ${productId} eliminado exitosamente.` });
    }
    catch (error) {
        console.error('Error al eliminar producto:', String(error));
        return res.status(500).json({
            message: 'Error interno del servidor al eliminar el producto.',
            error: (error instanceof Error) ? error.message : String(error),
            stack: (error instanceof Error) ? error.stack : 'No stack available'
        });
    }
    finally {
        if (connection) {
            connection.release();
        }
    }
}));
// ---------------------------------------------------
// MIDDLEWARE DE MANEJO DE ERRORES GLOBAL
// ---------------------------------------------------
app.use((err, req, res, next) => {
    const errorMessage = err.message || 'An unknown error occurred.';
    const errorStack = err.stack || 'No stack available.';
    console.error('Global Error:', errorMessage);
    console.error('Stack:', errorStack); // Siempre loggear el stack en el servidor
    if (res.headersSent) {
        return next(err);
    }
    let statusCode = 500;
    let message = 'An unexpected error occurred on the server.';
    // Manejar errores de Multer (ej. archivo muy grande, tipo incorrecto)
    if (err instanceof multer_1.default.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            statusCode = 413; // Payload Too Large
            message = 'El archivo de imagen es demasiado grande (máximo 5MB).';
        }
        else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            statusCode = 400;
            message = 'Tipo de archivo no permitido o campo de archivo incorrecto.';
        }
        else {
            statusCode = 400;
            message = `Error en la subida de archivo: ${err.message}`;
        }
    }
    else if (errorMessage === 'Solo se permiten archivos de imagen!') { // Error personalizado de fileFilter
        statusCode = 400;
        message = errorMessage;
    }
    else if (err.code === 'ER_DUP_ENTRY') { // Si hay una propiedad 'code' (ej. de MySQL)
        statusCode = 409; // Conflict
        message = 'El registro ya existe. (Por ejemplo, email duplicado)';
    }
    else if (err instanceof jsonwebtoken_1.default.JsonWebTokenError || err instanceof jsonwebtoken_1.default.TokenExpiredError) {
        statusCode = 401; // Unauthorized
        message = 'Token de autenticación inválido o expirado.';
    }
    else { // Fallback para errores generales
        message = errorMessage;
        statusCode = 500;
    }
    return res.status(statusCode).json({
        message: message,
        error: process.env.NODE_ENV === 'development' ? errorMessage : err.toString(),
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
    });
});
// ---------------------------------------------------
// INICIAR EL SERVIDOR
// ---------------------------------------------------
app.listen(port, () => {
    console.log(`Backend server corriendo en http://localhost:${port}`);
    console.log(`Accede a la ruta raíz de la API en: http://localhost:${port}`);
    console.log(`Verifica la conexión a la base de datos en: http://localhost:${port}/check-db`);
    console.log(`Gestiona productos en: http://localhost:${port}/api/products`);
    // Prueba de conexión a la base de datos al iniciar el servidor
    pool.getConnection()
        .then(connection => {
        console.log('Conexión al pool de la base de datos exitosa.');
        connection.release();
    })
        .catch(err => console.error('Error al conectar a la base de datos al inicio:', err)); //
});
