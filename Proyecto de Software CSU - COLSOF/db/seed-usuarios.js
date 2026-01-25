import { pool, closePool } from './connection.js'

const nombresComunes = [
  'Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Laura', 'Pedro', 'Carmen', 'José',
  'Isabel', 'Miguel', 'Patricia', 'Jorge', 'Sofía', 'Roberto', 'Elena', 'Fernando',
  'Lucía', 'Diego', 'Andrea', 'Ricardo', 'Valentina', 'Andrés', 'Camila', 'Sergio',
  'Daniela', 'Alejandro', 'Natalia', 'Daniel', 'Carolina', 'Pablo', 'Gabriela',
  'Francisco', 'Melissa', 'Javier', 'Juliana', 'Raúl'
]

const apellidos = [
  'García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez', 'Sánchez',
  'Pérez', 'Gómez', 'Martín', 'Jiménez', 'Ruiz', 'Hernández', 'Díaz', 'Moreno',
  'Muñoz', 'Álvarez', 'Romero', 'Alonso', 'Gutiérrez', 'Navarro', 'Torres',
  'Domínguez', 'Vázquez', 'Ramos', 'Gil', 'Ramírez', 'Serrano', 'Blanco', 'Suárez',
  'Molina', 'Castro', 'Ortiz', 'Rubio', 'Marín', 'Sanz', 'Iglesias'
]

function generarUsuario(nombre, apellido, rol, index) {
  const email = `${nombre.toLowerCase()}.${apellido.toLowerCase()}@colsof.com.co`
  const password = 'password123' // En producción esto debe estar hasheado
  
  return {
    nombre,
    apellido,
    email,
    password,
    rol,
    activo: true
  }
}

async function insertarUsuarios() {
  try {
    console.log('🚀 Iniciando inserción de usuarios...\n')
    
    const usuarios = []
    let indexNombre = 0
    let indexApellido = 0

    // 3 Administradores
    console.log('👤 Creando 3 administradores...')
    for (let i = 0; i < 3; i++) {
      const usuario = generarUsuario(
        nombresComunes[indexNombre++],
        apellidos[indexApellido++],
        'administrador',
        i
      )
      usuarios.push(usuario)
    }

    // 7 Gestores
    console.log('👤 Creando 7 gestores...')
    for (let i = 0; i < 7; i++) {
      const usuario = generarUsuario(
        nombresComunes[indexNombre++],
        apellidos[indexApellido++],
        'gestor',
        i
      )
      usuarios.push(usuario)
    }

    // 27 Técnicos
    console.log('👤 Creando 27 técnicos...')
    for (let i = 0; i < 27; i++) {
      const usuario = generarUsuario(
        nombresComunes[indexNombre++],
        apellidos[indexApellido++],
        'tecnico',
        i
      )
      usuarios.push(usuario)
    }

    console.log(`\n📊 Total de usuarios a insertar: ${usuarios.length}`)
    console.log('   • Administradores: 3')
    console.log('   • Gestores: 7')
    console.log('   • Técnicos: 27\n')

    // Insertar en lote
    console.log('💾 Insertando usuarios en la base de datos...')
    
    for (const usuario of usuarios) {
      await pool.query(
        `INSERT INTO usuarios (nombre, apellido, email, password, rol, activo, fecha_creacion, fecha_actualizacion)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         ON CONFLICT (email) DO NOTHING`,
        [usuario.nombre, usuario.apellido, usuario.email, usuario.password, usuario.rol, usuario.activo]
      )
    }

    console.log('✅ Usuarios insertados exitosamente\n')

    // Verificar inserción
    const result = await pool.query(`
      SELECT rol, COUNT(*) as count 
      FROM usuarios 
      GROUP BY rol 
      ORDER BY 
        CASE rol 
          WHEN 'administrador' THEN 1 
          WHEN 'gestor' THEN 2 
          WHEN 'tecnico' THEN 3 
        END
    `)

    console.log('📊 Usuarios en la base de datos:')
    let total = 0
    result.rows.forEach(row => {
      console.log(`   • ${row.rol}: ${row.count}`)
      total += parseInt(row.count)
    })
    console.log(`   • Total: ${total}\n`)

    // Mostrar algunos ejemplos
    const ejemplos = await pool.query(`
      SELECT nombre, apellido, email, rol 
      FROM usuarios 
      ORDER BY 
        CASE rol 
          WHEN 'administrador' THEN 1 
          WHEN 'gestor' THEN 2 
          WHEN 'tecnico' THEN 3 
        END,
        nombre
      LIMIT 10
    `)

    console.log('📋 Primeros 10 usuarios creados:')
    console.table(ejemplos.rows)

  } catch (error) {
    console.error('❌ Error al insertar usuarios:', error.message)
    throw error
  }
}

insertarUsuarios()
  .then(() => {
    console.log('✅ Proceso completado exitosamente')
    return closePool()
  })
  .catch(async (error) => {
    await closePool()
    process.exit(1)
  })
