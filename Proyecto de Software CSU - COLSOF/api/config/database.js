/**
 * @file config/database.js
 * @description Configuración de conexión a PostgreSQL con pooling optimizado
 * Pool: 10-30 conexiones, retries automáticos, timeout 30s
 */

import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  try {
    const configPath = path.join(__dirname, '../../Config.env');
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf-8');
      const match = content.match(/DATABASE_URL=(.+)/);
      if (match) {
        DATABASE_URL = match[1].trim();
      }
    }
  } catch (e) {
    console.warn('⚠️  No se pudo leer Config.env:', e.message);
  }
}

if (!DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL no encontrada en Config.env o variables de entorno');
  process.exit(1);
}

console.log('📡 Conectando a PostgreSQL con pooling optimizado...');

/**
 * Pool de conexiones PostgreSQL con PgBouncer
 * Configuración optimizada para Supabase pooler (puerto 6543)
 * 
 * IMPORTANTE: Al usar PgBouncer, reducimos el pooling local ya que
 * PgBouncer maneja el pooling a nivel de infraestructura.
 * 
 * - min: 2 conexiones iniciales (PgBouncer maneja el resto)
 * - max: 10 conexiones máximas (evita saturar PgBouncer)
 * - idle_timeout: 20s (cierra conexiones inactivas rápido)
 * - connection_timeout: 30s
 * - max_lifetime: 10min (renovación frecuente con PgBouncer)
 * - connect_timeout: 10s (timeout de conexión)
 * - prepare: false (CRÍTICO: PgBouncer no soporta prepared statements en modo transaction)
 */
const sql = postgres(DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  connection_timeout: 30,
  max_lifetime: 10 * 60,
  prepare: false, // CRÍTICO para PgBouncer
  debug: process.env.DEBUG_SQL === 'true' ? console.log : undefined,
  onnotice: (notice) => {
    if (process.env.NODE_ENV !== 'test') {
      console.log('📝 Notice:', notice.message);
    }
  },
  onparameter: (param) => {
    if (process.env.DEBUG_SQL === 'true') {
      console.log('📌 Param:', param);
    }
  }
});

// Verificar conexión al iniciar
sql`SELECT 1`.then(() => {
  console.log('✅ Pool de conexiones PostgreSQL establecido correctamente');
}).catch(err => {
  console.error('❌ Error conectando a PostgreSQL:', err.message);
  process.exit(1);
});

export default sql;
