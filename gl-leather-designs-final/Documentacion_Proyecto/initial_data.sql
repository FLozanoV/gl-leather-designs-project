-- Script SQL para la inserción de datos iniciales de prueba en la base de datos "G. L. LEATHER DESIGNS"
-- Nombre del archivo: initial_data.sql
-- Fecha: 11 de junio de 2025

-- IMPORTANTE: Asegúrate de que la base de datos 'gl_leather_designs_db' y sus tablas
-- 'users' y 'products' ya existen antes de ejecutar este script.
-- (Ejecuta 'create_database.sql' primero si no lo has hecho).

USE gl_leather_designs_db;

-- 1. Insertar usuarios de prueba
-- Contraseña para 'admin@micorreo.com' es 'admin123' (hasheada con bcrypt).
-- Puedes generar un hash de 'admin123' con tu backend o una herramienta online si necesitas uno diferente.
-- El hash proporcionado es un ejemplo. En un entorno real, DEBES generar esto desde tu backend.
INSERT INTO users (email, password_hash, role) VALUES
('admin@micorreo.com', '$2a$10$B59d0.c1e9.Vf3hP4xW0.Z.yF.1Q7/5q9tP2X/zS2o9XwL.zN.X1o', 'admin'), -- Ejemplo hash para 'admin123'
('cliente@micorreo.com', '$2a$10$Q.P3Q.Z0w.Y2k0.B4Q.C.V3j.D1b.E5q.T2X/zS2o9XwL.zN.X1o', 'client'); -- Ejemplo hash para 'cliente123'

-- 2. Insertar productos de prueba
-- Asegúrate de que los created_by_user_id correspondan a IDs de usuarios existentes.
-- Aquí asumimos que el admin@micorreo.com tiene ID 1.
INSERT INTO products (name, description, price, stock, image_url, category, created_by_user_id) VALUES
('Bolso de Cuero Clásico', 'Elegante bolso de cuero genuino, ideal para uso diario.', 250.00, 15, 'http://localhost:5000/uploads/bolso_clasico.jpg', 'Bolsos', 1),
('Billetera de Piel Premium', 'Billetera compacta y duradera, fabricada con piel de alta calidad.', 75.50, 30, 'http://localhost:5000/uploads/billetera_premium.jpg', 'Billeteras', 1),
('Cinturón Trenzado Artesanal', 'Cinturón de cuero trenzado a mano, estilo único.', 45.00, 20, 'http://localhost:5000/uploads/cinturon_trenza.jpg', 'Accesorios', 1),
('Mochila de Viaje Cuero', 'Mochila espaciosa y resistente para viajes, con compartimentos múltiples.', 380.00, 10, 'http://localhost:5000/uploads/mochila_viaje.jpg', 'Bolsos', 1);

-- Nota: Las URLs de las imágenes son ejemplos. Debes asegurarte de que tu servidor backend
-- sirva estas imágenes desde la carpeta 'uploads' o la ruta configurada.