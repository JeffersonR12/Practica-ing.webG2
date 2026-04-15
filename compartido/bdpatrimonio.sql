-- =====================================================
-- CREAR BASE DE DATOS PATRIMONIO (COMPLETO - CORREGIDO)
-- =====================================================
-- Ejecutar este script para crear la base de datos desde cero
-- =====================================================

-- -----------------------------------------------------
-- 0. CREAR BASE DE DATOS
-- -----------------------------------------------------
DROP DATABASE IF EXISTS `patrimonio`;
CREATE DATABASE `patrimonio` 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_general_ci;

USE `patrimonio`;

-- -----------------------------------------------------
-- 1. TABLA: persona
-- -----------------------------------------------------
CREATE TABLE `persona` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `area` VARCHAR(50) DEFAULT NULL,
    `cargo` VARCHAR(50) DEFAULT NULL,
    `email` VARCHAR(100) DEFAULT NULL,
    `telefono` VARCHAR(20) DEFAULT NULL,
    `estado` ENUM('Activo','Inactivo') DEFAULT 'Activo',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- -----------------------------------------------------
-- 2. TABLA: usuario (Autenticación)
-- -----------------------------------------------------
CREATE TABLE `usuario` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `usuario` VARCHAR(50) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `nombre` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `rol` ENUM('admin','inventario','usuario') DEFAULT 'usuario',
    `area` VARCHAR(50) DEFAULT NULL,
    `permisos` JSON DEFAULT NULL,
    `estado` ENUM('Activo','Inactivo') DEFAULT 'Activo',
    `ultimo_acceso` DATETIME DEFAULT NULL,
    `token_recuperacion` VARCHAR(100) DEFAULT NULL,
    `token_expiracion` DATETIME DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_usuario` (`usuario`),
    UNIQUE KEY `uk_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- -----------------------------------------------------
-- 3. TABLA: bien
-- -----------------------------------------------------
CREATE TABLE `bien` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `codigo_patrimonial` VARCHAR(50) NOT NULL,
    `nombre` VARCHAR(100) NOT NULL,
    `descripcion` TEXT DEFAULT NULL,
    `estado` VARCHAR(50) DEFAULT 'Operativo',
    `persona_id` INT(11) DEFAULT NULL,
    `fecha_registro` DATE DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `codigo_patrimonial` (`codigo_patrimonial`),
    KEY `persona_id` (`persona_id`),
    CONSTRAINT `bien_ibfk_1` FOREIGN KEY (`persona_id`) REFERENCES `persona` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- -----------------------------------------------------
-- 4. TABLA: desplazamiento
-- -----------------------------------------------------
CREATE TABLE `desplazamiento` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `numero` VARCHAR(30) NOT NULL,
    `persona_origen_id` INT(11) NOT NULL,
    `persona_destino_id` INT(11) NOT NULL,
    `motivo` VARCHAR(100) NOT NULL,
    `observacion` TEXT DEFAULT NULL,
    `fecha` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `usuario_id` INT(11) DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `numero` (`numero`),
    KEY `persona_origen_id` (`persona_origen_id`),
    KEY `persona_destino_id` (`persona_destino_id`),
    KEY `usuario_id` (`usuario_id`),
    CONSTRAINT `fk_desp_persona_origen` FOREIGN KEY (`persona_origen_id`) REFERENCES `persona` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_desp_persona_destino` FOREIGN KEY (`persona_destino_id`) REFERENCES `persona` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_desp_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- -----------------------------------------------------
-- 5. TABLA: detalle_desplazamiento
-- -----------------------------------------------------
CREATE TABLE `detalle_desplazamiento` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `desplazamiento_id` INT(11) NOT NULL,
    `bien_id` INT(11) NOT NULL,
    `persona_origen` INT(11) DEFAULT NULL,
    `persona_destino` INT(11) DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `desplazamiento_id` (`desplazamiento_id`),
    KEY `bien_id` (`bien_id`),
    CONSTRAINT `fk_detalle_desp` FOREIGN KEY (`desplazamiento_id`) REFERENCES `desplazamiento` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_detalle_bien` FOREIGN KEY (`bien_id`) REFERENCES `bien` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- -----------------------------------------------------
-- 6. TABLA: historial_bien
-- -----------------------------------------------------
CREATE TABLE `historial_bien` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `bien_id` INT(11) NOT NULL,
    `persona_id_anterior` INT(11) DEFAULT NULL,
    `persona_id_nueva` INT(11) DEFAULT NULL,
    `desplazamiento_id` INT(11) DEFAULT NULL,
    `accion` VARCHAR(50) NOT NULL,
    `fecha` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `observacion` TEXT DEFAULT NULL,
    `usuario_id` INT(11) DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `bien_id` (`bien_id`),
    KEY `persona_id_anterior` (`persona_id_anterior`),
    KEY `persona_id_nueva` (`persona_id_nueva`),
    KEY `desplazamiento_id` (`desplazamiento_id`),
    KEY `usuario_id` (`usuario_id`),
    CONSTRAINT `fk_hist_bien` FOREIGN KEY (`bien_id`) REFERENCES `bien` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_hist_persona_ant` FOREIGN KEY (`persona_id_anterior`) REFERENCES `persona` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_hist_persona_nueva` FOREIGN KEY (`persona_id_nueva`) REFERENCES `persona` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_hist_desplazamiento` FOREIGN KEY (`desplazamiento_id`) REFERENCES `desplazamiento` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_hist_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- -----------------------------------------------------
-- 7. INSERTAR DATOS DE PRUEBA
-- -----------------------------------------------------

-- Usuarios (password en texto plano para pruebas)
INSERT INTO `usuario` (`usuario`, `password`, `nombre`, `email`, `rol`, `area`, `permisos`) VALUES
('admin', 'admin123', 'Administrador', 'admin@institucion.edu', 'admin', 'Sistemas', '["all"]'),
('inventario', 'inventario123', 'Encargado de Inventario', 'inventario@institucion.edu', 'inventario', 'Almacén', '["gestionar_bienes", "desplazar", "reportes"]'),
('usuario', 'usuario123', 'Usuario Regular', 'usuario@institucion.edu', 'usuario', 'Contabilidad', '["ver_bienes", "ver_reportes"]');

-- Personas
INSERT INTO `persona` (`nombre`, `area`, `cargo`, `estado`) VALUES
('Juan Pérez', 'Sistemas', 'Analista', 'Activo'),
('María García', 'Contabilidad', 'Contadora', 'Activo'),
('Carlos López', 'Logística', 'Jefe de Almacén', 'Activo'),
('Ana Martínez', 'RRHH', 'Asistente', 'Activo');

-- Bienes de prueba
INSERT INTO `bien` (`codigo_patrimonial`, `nombre`, `descripcion`, `estado`, `persona_id`, `fecha_registro`) VALUES
('PC-001', 'Laptop HP EliteBook', 'Core i5, 8GB RAM, 256GB SSD', 'Operativo', 1, CURDATE()),
('PC-002', 'Monitor Dell 24"', 'Monitor LED 24 pulgadas', 'Operativo', 1, CURDATE()),
('MUE-001', 'Escritorio Ejecutivo', 'Madera, 1.5m x 0.7m', 'Bueno', 2, CURDATE()),
('MUE-002', 'Silla Ergonómica', 'Silla giratoria con respaldo', 'Bueno', 2, CURDATE()),
('EQ-001', 'Impresora Multifuncional', 'Láser, Wi-Fi', 'Operativo', 3, CURDATE()),
('PC-003', 'Laptop Lenovo ThinkPad', 'Core i7, 16GB RAM', 'Operativo', NULL, CURDATE());

-- -----------------------------------------------------
-- 8. VERIFICACIÓN FINAL
-- -----------------------------------------------------
SELECT '✅ BASE DE DATOS "patrimonio" CREADA CORRECTAMENTE' AS mensaje;
SELECT '📊 Tablas creadas:' AS info;
SHOW TABLES;

SELECT '👥 Usuarios de prueba:' AS info;
SELECT id, usuario, nombre, rol FROM usuario;

SELECT '👤 Personas registradas:' AS info;
SELECT id, nombre, area, estado FROM persona;

SELECT '📦 Bienes registrados:' AS info;
SELECT id, codigo_patrimonial, nombre, estado FROM bien;