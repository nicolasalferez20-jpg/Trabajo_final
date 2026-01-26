import bcrypt from 'bcrypt'
import { pool, closePool } from './connection.js'

const SALT_ROUNDS = 10

async function hashPasswords() {
  try {
    console.log('🔐 Iniciando hash de contraseñas...\n')

    // Obtener todos los usuarios
    const result = await pool.query('SELECT id, email, password FROM usuarios')
    
    if (result.rows.length === 0) {
      console.log('❌ No hay usuarios en la base de datos')
      await closePool()
      return
    }

    console.log(`📊 Se encontraron ${result.rows.length} usuarios para hashear\n`)

    let updated = 0
    let skipped = 0

    for (const usuario of result.rows) {
      // Verificar si la contraseña ya está hasheada (bcrypt hashes comienzan con $2a, $2b, $2x, o $2y)
      if (usuario.password.startsWith('$2')) {
        console.log(`⏭️  Usuario ${usuario.email}: contraseña ya hasheada`)
        skipped++
        continue
      }

      try {
        // Hashear la contraseña
        const hashedPassword = await bcrypt.hash(usuario.password, SALT_ROUNDS)

        // Actualizar en la base de datos
        await pool.query(
          'UPDATE usuarios SET password = $1, fecha_actualizacion = NOW() WHERE id = $2',
          [hashedPassword, usuario.id]
        )

        console.log(`✅ Usuario ${usuario.email}: contraseña hasheada exitosamente`)
        updated++
      } catch (error) {
        console.error(`❌ Error al hashear contraseña de ${usuario.email}:`, error.message)
      }
    }

    console.log(`\n📈 Resumen:`)
    console.log(`   • Actualizadas: ${updated}`)
    console.log(`   • Ya hasheadas: ${skipped}`)
    console.log(`   • Total: ${result.rows.length}`)

  } catch (error) {
    console.error('❌ Error general:', error.message)
  } finally {
    await closePool()
  }
}

hashPasswords()
