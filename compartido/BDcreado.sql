-- =========================================
-- CREAR BASE DE DATOS
-- =========================================
CREATE DATABASE patrimonio;
USE patrimonio;

-- =========================================
-- TABLA PERSONA
-- =========================================
CREATE TABLE persona (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    dni VARCHAR(20) UNIQUE,
    area VARCHAR(100),
    estado VARCHAR(20) DEFAULT 'ACTIVO'
);

-- =========================================
-- TABLA BIEN (ACTIVOS / PATRIMONIO)
-- =========================================
CREATE TABLE bien (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo_patrimonial VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    estado VARCHAR(50) DEFAULT 'ACTIVO',
    fecha_registro DATE DEFAULT CURRENT_DATE,
    persona_id INT,
    FOREIGN KEY (persona_id) REFERENCES persona(id)
);

-- =========================================
-- TABLA DESPLAZAMIENTO
-- =========================================
CREATE TABLE desplazamiento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(20) UNIQUE NOT NULL,
    motivo VARCHAR(150),
    fecha DATE DEFAULT CURRENT_DATE,
    observacion TEXT
);

-- =========================================
-- TABLA DETALLE DESPLAZAMIENTO
-- =========================================
CREATE TABLE detalle_desplazamiento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    desplazamiento_id INT,
    bien_id INT,
    persona_origen INT,
    persona_destino INT,

    FOREIGN KEY (desplazamiento_id) REFERENCES desplazamiento(id),
    FOREIGN KEY (bien_id) REFERENCES bien(id),
    FOREIGN KEY (persona_origen) REFERENCES persona(id),
    FOREIGN KEY (persona_destino) REFERENCES persona(id)
);

-- =========================================
-- TABLA HISTORIAL DE BIENES
-- =========================================
CREATE TABLE historial_bien (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bien_id INT,
    persona_id INT,
    fecha DATE DEFAULT CURRENT_DATE,
    accion VARCHAR(100),

    FOREIGN KEY (bien_id) REFERENCES bien(id),
    FOREIGN KEY (persona_id) REFERENCES persona(id)
);
