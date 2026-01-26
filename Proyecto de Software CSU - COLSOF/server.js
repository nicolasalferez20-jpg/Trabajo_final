import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcrypt'
import { pool } from './db/connection.js'

const app = express()
const PORT = process.env.PORT || 3000
const isVercel = process.env.VERCEL === '1'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Variable global para rastrear estado de BD
let dbConnected = false

// Middleware
app.use(cors())
app.use(express.json())

// Servir archivos estáticos
app.use(express.static(path.join(__dirname)))
app.use('/assets', express.static(path.join(__dirname, 'assets')))

// Servir páginas HTML para rutas SPA
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'))
})

app.get('/Usuario\ GESTOR/*', (req, res) => {
  const filePath = path.join(__dirname, req.path.replace(/\%20/g, ' '))
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).json({ error: 'Not found' })
    }
  })
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API running', dbConnected })
})

// ==================== LOGIN ====================

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body

    // Validar que ambos campos estén presentes
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'El correo y la contraseña son requeridos'
      })
    }

    // Buscar usuario por email
    const result = await pool.query(
      'SELECT id, nombre, apellido, email, password, rol, activo FROM usuarios WHERE email = $1',
      [email.toLowerCase()]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'El correo o contraseña son incorrectos'
      })
    }

    const usuario = result.rows[0]

    // Verificar si el usuario está activo
    if (!usuario.activo) {
      return res.status(401).json({
        success: false,
        error: 'La cuenta de usuario está inactiva. Contacta al administrador.'
      })
    }

    // Comparar contraseña con la hasheada
    const passwordMatch = await bcrypt.compare(password, usuario.password)

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: 'El correo o contraseña son incorrectos'
      })
    }

    // Login exitoso - retornar datos del usuario (sin la contraseña)
    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        rol: usuario.rol
      }
    })

  } catch (error) {
    console.error('Error en /api/login:', error)
    res.status(500).json({
      success: false,
      error: 'Error al procesar la solicitud'
    })
  }
})

// Obtener todos los casos
app.get('/api/casos', async (req, res) => {
  try {
    const { estado, prioridad, cliente, asignado_a } = req.query

    let query = 'SELECT * FROM casos WHERE 1=1'
    const params = []

    if (estado) {
      query += ' AND estado = $' + (params.length + 1)
      params.push(estado)
    }
    if (prioridad) {
      query += ' AND prioridad = $' + (params.length + 1)
      params.push(prioridad)
    }
    if (cliente) {
      query += ' AND cliente ILIKE $' + (params.length + 1)
      params.push('%' + cliente + '%')
    }
    if (asignado_a) {
      query += ' AND asignado_a = $' + (params.length + 1)
      params.push(asignado_a)
    }

    query += ' ORDER BY fecha_creacion DESC'

    const result = await pool.query(query, params)

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    })
  } catch (error) {
    console.error('Error en /api/casos:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// Obtener caso por ID
app.get('/api/casos/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query('SELECT * FROM casos WHERE id = $1', [id])

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Caso no encontrado'
      })
    }

    res.json({
      success: true,
      data: result.rows[0]
    })
  } catch (error) {
    console.error('Error en /api/casos/:id:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// Crear caso
app.post('/api/casos', async (req, res) => {
  try {
    const {
      id,
      cliente,
      sede,
      contacto,
      correo,
      telefono,
      tipo,
      categoria,
      descripcion,
      prioridad,
      autor
    } = req.body

    const result = await pool.query(
      `INSERT INTO casos 
       (id, cliente, sede, contacto, correo, telefono, tipo, categoria, descripcion, prioridad, autor, estado, fecha_creacion, fecha_actualizacion)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'Abierto', NOW(), NOW())
       RETURNING *`,
      [id, cliente, sede, contacto, correo, telefono, tipo, categoria, descripcion, prioridad, autor]
    )

    res.json({
      success: true,
      data: result.rows[0]
    })
  } catch (error) {
    console.error('Error en POST /api/casos:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// Actualizar caso
app.put('/api/casos/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    // Construir query dinámicamente
    const keys = Object.keys(updates)
    const values = Object.values(updates)
    const setClauses = keys.map((key, idx) => `${key} = $${idx + 1}`).join(', ')

    const query = `
      UPDATE casos 
      SET ${setClauses}, fecha_actualizacion = NOW()
      WHERE id = $${keys.length + 1}
      RETURNING *
    `

    const result = await pool.query(query, [...values, id])

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Caso no encontrado'
      })
    }

    res.json({
      success: true,
      data: result.rows[0]
    })
  } catch (error) {
    console.error('Error en PUT /api/casos/:id:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// Estadísticas
app.get('/api/estadisticas', async (req, res) => {
  try {
    const stats = await Promise.all([
      pool.query('SELECT COUNT(*) as total FROM casos'),
      pool.query(`SELECT estado, COUNT(*) as count FROM casos GROUP BY estado`),
      pool.query(`SELECT prioridad, COUNT(*) as count FROM casos GROUP BY prioridad`),
      pool.query(`SELECT asignado_a, COUNT(*) as count FROM casos WHERE asignado_a IS NOT NULL GROUP BY asignado_a`)
    ])

    res.json({
      success: true,
      data: {
        total: stats[0].rows[0].total,
        por_estado: stats[1].rows,
        por_prioridad: stats[2].rows,
        por_tecnico: stats[3].rows
      }
    })
  } catch (error) {
    console.error('Error en /api/estadisticas:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// ==================== USUARIOS ====================

// Obtener todos los usuarios
app.get('/api/usuarios', async (req, res) => {
  try {
    const { rol, activo } = req.query

    let query = 'SELECT id, nombre, apellido, email, rol, activo, fecha_creacion FROM usuarios WHERE 1=1'
    const params = []

    if (rol) {
      query += ' AND rol = $' + (params.length + 1)
      params.push(rol)
    }
    if (activo !== undefined) {
      query += ' AND activo = $' + (params.length + 1)
      params.push(activo === 'true')
    }

    query += ' ORDER BY rol, nombre'

    const result = await pool.query(query, params)

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    })
  } catch (error) {
    console.error('Error en /api/usuarios:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// Obtener usuario por ID
app.get('/api/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query(
      'SELECT id, nombre, apellido, email, rol, activo, fecha_creacion FROM usuarios WHERE id = $1',
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      })
    }

    res.json({
      success: true,
      data: result.rows[0]
    })
  } catch (error) {
    console.error('Error en /api/usuarios/:id:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// Crear usuario
app.post('/api/usuarios', async (req, res) => {
  try {
    const { nombre, apellido, email, password, rol } = req.body

    const result = await pool.query(
      `INSERT INTO usuarios (nombre, apellido, email, password, rol, activo, fecha_creacion, fecha_actualizacion)
       VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
       RETURNING id, nombre, apellido, email, rol, activo, fecha_creacion`,
      [nombre, apellido, email, password, rol]
    )

    res.json({
      success: true,
      data: result.rows[0]
    })
  } catch (error) {
    console.error('Error en POST /api/usuarios:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// Actualizar usuario
app.put('/api/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    const keys = Object.keys(updates)
    const values = Object.values(updates)
    const setClauses = keys.map((key, idx) => `${key} = $${idx + 1}`).join(', ')

    const query = `
      UPDATE usuarios 
      SET ${setClauses}, fecha_actualizacion = NOW()
      WHERE id = $${keys.length + 1}
      RETURNING id, nombre, apellido, email, rol, activo, fecha_creacion
    `

    const result = await pool.query(query, [...values, id])

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      })
    }

    res.json({
      success: true,
      data: result.rows[0]
    })
  } catch (error) {
    console.error('Error en PUT /api/usuarios/:id:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// Estadísticas de usuarios
app.get('/api/usuarios-stats', async (req, res) => {
  try {
    const stats = await Promise.all([
      pool.query('SELECT COUNT(*) as total FROM usuarios'),
      pool.query('SELECT rol, COUNT(*) as count FROM usuarios GROUP BY rol'),
      pool.query('SELECT COUNT(*) as count FROM usuarios WHERE activo = true'),
    ])

    res.json({
      success: true,
      data: {
        total: stats[0].rows[0].total,
        por_rol: stats[1].rows,
        activos: stats[2].rows[0].count
      }
    })
  } catch (error) {
    console.error('Error en /api/usuarios-stats:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada'
  })
})

// Iniciar servidor solo en modo local. En Vercel exportamos el handler sin levantar listener.
if (!isVercel) {
  app.listen(PORT, async () => {
    console.log(`✅ Servidor API ejecutándose en http://localhost:${PORT}`)
    
    // Verificar conexión a BD al iniciar
    try {
      const client = await pool.connect()
      const result = await client.query('SELECT current_database() as db, current_user as user')
      client.release()
      dbConnected = true
      console.log(`✅ Conexión a BD exitosa: ${result.rows[0].db} (${result.rows[0].user})`)
    } catch (error) {
      console.error(`❌ Error en conexión a BD: ${error.message}`)
      console.log('⚠️  El servidor continúa ejecutándose, pero las queries fallarán.')
    }
    
    console.log(`📊 Endpoints disponibles:`)
    console.log(`   GET  http://localhost:${PORT}/api/health`)
    console.log(`   GET  http://localhost:${PORT}/api/casos`)
    console.log(`   GET  http://localhost:${PORT}/api/casos/:id`)
    console.log(`   POST http://localhost:${PORT}/api/casos`)
    console.log(`   PUT  http://localhost:${PORT}/api/casos/:id`)
    console.log(`   GET  http://localhost:${PORT}/api/estadisticas`)
    console.log(`   GET  http://localhost:${PORT}/api/usuarios`)
    console.log(`   GET  http://localhost:${PORT}/api/usuarios/:id`)
    console.log(`   POST http://localhost:${PORT}/api/usuarios`)
    console.log(`   PUT  http://localhost:${PORT}/api/usuarios/:id`)
    console.log(`   GET  http://localhost:${PORT}/api/usuarios-stats`)
    console.log(`\n🌐 Abre http://localhost:${PORT} en tu navegador`)
  })
}

// Exportar app para Vercel (serverless handler)
export default app
