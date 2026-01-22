CREATE TABLE IF NOT EXISTS casos (
    id VARCHAR(20) PRIMARY KEY,
    cliente VARCHAR(255) NOT NULL,
    sede VARCHAR(255),
    contacto VARCHAR(255),
    correo VARCHAR(255),
    telefono VARCHAR(50),
    contacto2 VARCHAR(255),
    correo2 VARCHAR(255),
    telefono2 VARCHAR(50),
    centro_costos VARCHAR(100),
    serial VARCHAR(100),
    marca VARCHAR(100),
    tipo VARCHAR(100),
    categoria VARCHAR(50),
    descripcion TEXT,
    asignado_a VARCHAR(255),
    prioridad VARCHAR(20),
    estado VARCHAR(20) DEFAULT 'Activo',
    autor VARCHAR(255),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_casos_cliente ON casos(cliente);
CREATE INDEX IF NOT EXISTS idx_casos_categoria ON casos(categoria);
CREATE INDEX IF NOT EXISTS idx_casos_prioridad ON casos(prioridad);
CREATE INDEX IF NOT EXISTS idx_casos_estado ON casos(estado);
CREATE INDEX IF NOT EXISTS idx_casos_fecha ON casos(fecha_creacion DESC);
INSERT INTO casos (
    id, cliente, sede, contacto, correo, telefono,
    serial, marca, tipo, categoria, descripcion,
    asignado_a, prioridad, estado, autor, fecha_creacion
) VALUES 
(
    '0300459366',
    'COLSOF SAS',
    'Sede Principal',
    'Olivia Rhye',
    'olivia@colsof.com.co',
    '3001234567',
    'SN123456',
    'Dell',
    'Laptop',
    'HARDWARE',
    'Pantalla no enciende',
    'Técnico 1',
    'Alta',
    'Activo',
    'Juan Pérez',
    '2022-01-06 10:30:00'
),
(
    '0393374065',
    'QUALA SA',
    'Bogotá',
    'Phoenix Baker',
    'phoenix@colsof.com.co',
    '3009876543',
    'SN789012',
    'HP',
    'PC Escritorio',
    'IMPRESIÓN',
    'Impresora no responde',
    'Técnico 2',
    'Alta',
    'Activo',
    'Juan Pérez',
    '2022-01-06 11:45:00'
),
(
    '03939712064',
    'ECOPETROL',
    'Barrancabermeja',
    'Lana Steiner',
    'lana@colsof.com.co',
    '3112345678',
    'SN345678',
    'Lenovo',
    'Laptop',
    'SOFTWARE',
    'Error en aplicación',
    'Técnico 3',
    'Alta',
    'Activo',
    'Dianne Russell',
    '2022-01-06 14:20:00'
),
(
    '0300196063',
    'COLSOF SAS',
    'Sede Norte',
    'Demi Wilkinson',
    'demi@colsof.com.co',
    '3156789012',
    'SN901234',
    'Dell',
    'Monitor',
    'HARDWARE',
    'Monitor parpadeando',
    'Técnico 1',
    'Alta',
    'Activo',
    'Dianne Russell',
    '2022-01-05 16:00:00'
)
ON CONFLICT (id) DO NOTHING;
