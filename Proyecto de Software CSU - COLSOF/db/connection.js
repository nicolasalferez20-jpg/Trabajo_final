import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { Pool } from 'pg'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let connectionString = process.env.DATABASE_URL

if (!connectionString) {
  const envPath = path.resolve(__dirname, '../../Config.env')
  try {
    const envContent = fs.readFileSync(envPath, 'utf-8')
    const match = envContent.match(/DATABASE_URL\s*=\s*"([^"]+)"/)
    if (match) {
      connectionString = match[1]
    }
  } catch (error) {
    console.error(`No se pudo leer ${envPath}:`, error.message)
  }
}

if (!connectionString) {
  throw new Error('DATABASE_URL no está definido. Verifica Config.env o tus variables de entorno.')
}

const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 20000,
  connectionTimeoutMillis: 10000,
  ssl: { rejectUnauthorized: false },
})

async function testConnection() {
  const client = await pool.connect()
  try {
    const { rows } = await client.query(
      'select current_user as user, current_database() as database, now() as now',
    )
    return rows[0]
  } finally {
    client.release()
  }
}

async function closePool() {
  await pool.end()
}

export { pool, testConnection, closePool }
