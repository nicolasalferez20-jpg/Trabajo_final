import { pool, closePool } from './connection.js'

async function analyzeDatabase() {
  try {
    console.log('🔍 Analizando estructura de la base de datos...\n')

    // Obtener todas las tablas
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)

    console.log(`✅ Tablas encontradas: ${tables.rows.length}\n`)

    for (const table of tables.rows) {
      const tableName = table.table_name
      
      // Contar registros
      const count = await pool.query(`SELECT COUNT(*) as count FROM "${tableName}"`)
      const recordCount = count.rows[0].count
      
      // Obtener columnas
      const columns = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [tableName])

      console.log(`📋 Tabla: ${tableName} (${recordCount} registros)`)
      console.log('   Columnas:')
      columns.rows.forEach(col => {
        console.log(`   • ${col.column_name}: ${col.data_type}`)
      })
      console.log('')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
    throw error
  }
}

analyzeDatabase()
  .then(() => closePool())
  .catch(async (error) => {
    await closePool()
    process.exit(1)
  })
