import { pool, closePool } from './connection.js'

async function testUsuariosAPI() {
  try {
    console.log('🧪 Probando datos de usuarios en la base de datos...\n')

    // Obtener todos los usuarios
    const allUsers = await pool.query('SELECT * FROM usuarios ORDER BY rol, nombre LIMIT 10')
    
    console.log('📊 Primeros 10 usuarios:')
    console.table(allUsers.rows.map(u => ({
      id: u.id,
      nombre: u.nombre,
      apellido: u.apellido,
      email: u.email,
      rol: u.rol,
      activo: u.activo ? '✓' : '✗'
    })))

    // Estadísticas por rol
    const stats = await pool.query(`
      SELECT rol, COUNT(*) as count 
      FROM usuarios 
      GROUP BY rol 
      ORDER BY CASE rol 
        WHEN 'administrador' THEN 1 
        WHEN 'gestor' THEN 2 
        WHEN 'tecnico' THEN 3 
      END
    `)

    console.log('\n📈 Usuarios por rol:')
    let total = 0
    stats.rows.forEach(row => {
      console.log(`   • ${row.rol.padEnd(15)}: ${row.count}`)
      total += parseInt(row.count)
    })
    console.log(`   • ${'TOTAL'.padEnd(15)}: ${total}`)

    // Obtener técnicos (para mostrar en la UI)
    const tecnicos = await pool.query(`
      SELECT id, nombre, apellido, email 
      FROM usuarios 
      WHERE rol = 'tecnico' 
      ORDER BY nombre 
      LIMIT 5
    `)

    console.log('\n👨‍🔧 Primeros 5 técnicos:')
    tecnicos.rows.forEach(t => {
      console.log(`   • ${t.nombre} ${t.apellido} (${t.email})`)
    })

    console.log('\n✅ Todos los datos están correctos')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    throw error
  }
}

testUsuariosAPI()
  .then(() => closePool())
  .catch(async (error) => {
    await closePool()
    process.exit(1)
  })
