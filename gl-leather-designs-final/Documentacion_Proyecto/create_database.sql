-- Script SQL para la creación de la base de datos y tablas del proyecto "G. L. LEATHER DESIGNS"
-- Nombre del archivo: create_database.sql
-- Fecha: 11 de junio de 2025

-- 1. Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS gl_leather_designs_db;

-- 2. Usar la base de datos recién creada o existente
USE gl_leather_designs_db;

-- 3. Crear la tabla de usuarios
-- Esta tabla almacenará la información de los usuarios del sistema, incluyendo administradores y clientes.
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL, -- Almacenará el hash de la contraseña (bcrypt).
    role VARCHAR(50) DEFAULT 'client', -- Rol del usuario (ej. 'admin', 'client').
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 4. Crear la tabla de productos
-- Esta tabla almacenará la información detallada de los productos de marroquinería.
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    image_url VARCHAR(255), -- URL o ruta relativa a la imagen del producto.
    category VARCHAR(100), -- Categoría del producto (ej. 'Bolsos', 'Billeteras', 'Accesorios').
    -- Clave foránea que referencia al usuario que creó el producto.
    created_by_user_id INT,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL, -- Si el usuario se elimina, el campo se pone a NULL.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Nota: Para replicar el entorno, ejecutar primero este script y luego initial_data.sql.
