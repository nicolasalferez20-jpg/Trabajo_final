import { pool, closePool } from './connection.js'

async function checkUsersTable() {
  try {
    // Verificar si existe la tabla usuarios
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'usuarios'
    `)

    if (result.rows.length === 0) {
      console.log('❌ Tabla "usuarios" no existe. Creando...')
      
      await pool.query(`
        CREATE TABLE usuarios (
          id SERIAL PRIMARY KEY,
          nombre VARCHAR(255) NOT NULL,
          apellido VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          rol VARCHAR(50) NOT NULL CHECK (rol IN ('administrador', 'gestor', 'tecnico')),
          activo BOOLEAN DEFAULT true,
          fecha_creacion TIMESTAMP DEFAULT NOW(),
          fecha_actualizacion TIMESTAMP DEFAULT NOW()
        )
      `)
      
      console.log('✅ Tabla "usuarios" creada exitosamente')
    } else {
      console.log('✅ Tabla "usuarios" ya existe')
      
      // Mostrar estructura
      const columns = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'usuarios'
        ORDER BY ordinal_position
      `)
      
      console.log('📋 Columnas de la tabla:')
      columns.rows.forEach(col => {
        console.log(`   • ${col.column_name}: ${col.data_type}`)
      })
    }
    
    // Contar usuarios existentes
    const count = await pool.query('SELECT rol, COUNT(*) as count FROM usuarios GROUP BY rol')
    console.log('\n📊 Usuarios actuales por rol:')
    count.rows.forEach(r => console.log(`   ${r.rol}: ${r.count}`))
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    throw error
  }
}

checkUsersTable()
  .then(() => closePool())
  .catch(async (error) => {
    await closePool()
    process.exit(1)
  })
