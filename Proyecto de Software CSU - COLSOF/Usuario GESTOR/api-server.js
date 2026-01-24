import http from 'http';
import url from 'url';
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Leer DATABASE_URL desde Config.env
const configPath = path.join(__dirname, '../../Config.env');
let DATABASE_URL = '';

if (fs.existsSync(configPath)) {
  const configContent = fs.readFileSync(configPath, 'utf-8');
  const match = configContent.match(/DATABASE_URL=(.+)/);
  if (match) {
    DATABASE_URL = match[1].trim();
  }
}

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL no encontrada en Config.env');
  process.exit(1);
}

// Conectar a PostgreSQL
const sql = postgres(DATABASE_URL);

const server = http.createServer(async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const action = parsedUrl.query.action;

  res.setHeader('Content-Type', 'application/json');

  try {
    switch (action) {
      case 'get_next_id': {
        const result = await sql`SELECT MAX(id_ticket) as max_id FROM base_de_datos_csu.ticket`;
        const nextId = result[0]?.max_id ? parseInt(result[0].max_id) + 1 : 1;
        res.writeHead(200);
        res.end(JSON.stringify({ new_id: nextId }));
        break;
      }

      case 'get_dashboard_stats': {
        const totalResult = await sql`SELECT COUNT(*) as total FROM base_de_datos_csu.ticket`;
        const resueltosResult = await sql`SELECT COUNT(*) as resueltos FROM base_de_datos_csu.ticket WHERE estado = 'resuelto'`;
        const pausadosResult = await sql`SELECT COUNT(*) as pausados FROM base_de_datos_csu.ticket WHERE estado = 'pausado'`;
        const cerradosResult = await sql`SELECT COUNT(*) as cerrados FROM base_de_datos_csu.ticket WHERE estado = 'cerrado'`;
        const pendientesResult = await sql`SELECT COUNT(*) as pendientes FROM base_de_datos_csu.ticket WHERE estado IN ('abierto', 'en_progreso')`;
        
        const stats = {
          reportes_generados: parseInt(totalResult[0].total),
          descargas: 0,
          usuarios_activos: 0,
          total_casos: parseInt(totalResult[0].total),
          resueltos: parseInt(resueltosResult[0].resueltos),
          pausados: parseInt(pausadosResult[0].pausados),
          cerrados: parseInt(cerradosResult[0].cerrados),
          pendientes: parseInt(pendientesResult[0].pendientes)
        };
        
        res.writeHead(200);
        res.end(JSON.stringify(stats));
        break;
      }

      case 'save_case': {
        if (req.method !== 'POST') {
          res.writeHead(405);
          res.end(JSON.stringify({ success: false, error: 'Método no permitido' }));
          return;
        }

        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
          try {
            const data = JSON.parse(body);
            
            const prioridadMap = {
              'Critico': 'critica',
              'Alta': 'alta',
              'Media': 'media',
              'Baja': 'baja'
            };
            
            const estadoMap = {
              'Activo': 'abierto',
              'En Progreso': 'en_progreso',
              'Pausado': 'pausado',
              'Resuelto': 'resuelto',
              'Cerrado': 'cerrado'
            };
            
            const prioridad = prioridadMap[data.prioridad] || 'media';
            const estado = estadoMap[data.estado] || 'abierto';
            
            // Buscar o crear categoría
            let categoria = await sql`SELECT id_categoria FROM base_de_datos_csu.categoria WHERE nombre_categoria = ${data.categoria} LIMIT 1`;
            let categoria_id;
            
            if (categoria.length > 0) {
              categoria_id = categoria[0].id_categoria;
            } else {
              const newCat = await sql`INSERT INTO base_de_datos_csu.categoria (nombre_categoria, prioridad) VALUES (${data.categoria}, ${prioridad}) RETURNING id_categoria`;
              categoria_id = newCat[0].id_categoria;
            }
            
            const metadata = {
              cliente_info: {
                nombre: data.cliente || '',
                sede: data.sede || '',
                contacto_principal: {
                  nombre: data.contacto || '',
                  correo: data.correo || '',
                  telefono: data.telefono || ''
                },
                contacto_alternativo: {
                  nombre: data.contacto2 || '',
                  correo: data.correo2 || '',
                  telefono: data.telefono2 || ''
                },
                centro_costos: data.centro_costos || ''
              },
              equipo_info: {
                serial: data.serial || '',
                marca: data.marca || '',
                tipo: data.tipo || ''
              },
              asignacion: {
                tecnico: data.asignado || '',
                autor: data.autor || 'Sistema'
              }
            };
            
            const result = await sql`
              INSERT INTO base_de_datos_csu.ticket (
                id_cliente, id_gestor, descripcion, estado,
                fecha_creacion, fecha_actualizacion,
                cliente_id_cliente, gestor_id_gestor,
                gestor_ususario_id_usuario, gestor_ususario_administrador_id_administrador,
                tecnico_id_tecnico, tecnico_ususario_id_usuario, tecnico_ususario_administrador_id_administrador,
                seguimiento_id_seguimiento, categoria_id_categoria
              ) VALUES (
                1, 1, ${data.descripcion}, ${estado},
                NOW(), NOW(),
                1, 1,
                1, 1,
                1, 1, 1,
                1, ${categoria_id}
              ) RETURNING id_ticket
            `;
            
            res.writeHead(200);
            res.end(JSON.stringify({
              success: true,
              message: 'Caso creado correctamente',
              ticket_id: result[0].id_ticket,
              metadata
            }));
          } catch (err) {
            console.error('Error guardando caso:', err);
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
        });
        break;
      }

      case 'get_casos_simple': {
        // Leer casos desde la tabla public.casos
        const casos = await sql`
          SELECT 
            id, 
            cliente,
            fecha_creacion,
            estado,
            asignado_a,
            prioridad,
            categoria,
            autor,
            descripcion,
            fecha_actualizacion
          FROM public.casos
          ORDER BY fecha_creacion DESC
        `;
        
        res.writeHead(200);
        res.end(JSON.stringify(casos));
        break;
      }

      case 'get_cases_list': {
        const cases = await sql`
          SELECT 
            t.id_ticket as id,
            t.fecha_creacion,
            u.nombre_usuario as asignado_a,
            g.nombre_usuario as autor,
            t.estado,
            cat.prioridad,
            cat.nombre_categoria as categoria,
            c.empresa as cliente
          FROM base_de_datos_csu.ticket t
          LEFT JOIN base_de_datos_csu.ususario u ON t.tecnico_ususario_id_usuario = u.id_usuario
          LEFT JOIN base_de_datos_csu.ususario g ON t.gestor_ususario_id_usuario = g.id_usuario
          LEFT JOIN base_de_datos_csu.categoria cat ON t.categoria_id_categoria = cat.id_categoria
          LEFT JOIN base_de_datos_csu.cliente c ON t.id_cliente = c.id_cliente
          ORDER BY t.fecha_creacion DESC
          LIMIT 100
        `;
        
        res.writeHead(200);
        res.end(JSON.stringify(cases));
        break;
      }

      case 'get_recent_reports': {
        const reports = await sql`
          SELECT 
            t.id_ticket as id,
            c.empresa as cliente,
            cat.nombre_categoria as categoria,
            t.fecha_creacion
          FROM base_de_datos_csu.ticket t
          LEFT JOIN base_de_datos_csu.cliente c ON t.id_cliente = c.id_cliente
          LEFT JOIN base_de_datos_csu.categoria cat ON t.categoria_id_categoria = cat.id_categoria
          ORDER BY t.fecha_creacion DESC
          LIMIT 5
        `;
        
        res.writeHead(200);
        res.end(JSON.stringify(reports));
        break;
      }

      case 'get_notifications': {
        const notifications = await sql`
          SELECT 
            t.id_ticket as id,
            c.empresa as cliente,
            cat.nombre_categoria as categoria,
            cat.prioridad,
            t.fecha_creacion
          FROM base_de_datos_csu.ticket t
          LEFT JOIN base_de_datos_csu.cliente c ON t.id_cliente = c.id_cliente
          LEFT JOIN base_de_datos_csu.categoria cat ON t.categoria_id_categoria = cat.id_categoria
          ORDER BY t.fecha_creacion DESC
          LIMIT 10
        `;
        
        const formatted = notifications.map(n => ({
          id: n.id,
          titulo: `Nuevo caso: ${n.categoria}`,
          descripcion: `Cliente: ${n.cliente}`,
          tipo: n.prioridad === 'critica' || n.prioridad === 'alta' ? 'urgente' : 'info',
          fecha: n.fecha_creacion,
          leido: false
        }));
        
        res.writeHead(200);
        res.end(JSON.stringify(formatted));
        break;
      }

      case 'get_reportes_data': {
        try {
          // KPIs generales
          const totalReportes = await sql`SELECT COUNT(*) FROM base_de_datos_csu.ticket`;
          const totalDescargas = await sql`SELECT COUNT(*) * 3 as descargas FROM base_de_datos_csu.ticket WHERE estado IN ('resuelto', 'cerrado')`;
          const ultimoReporte = await sql`SELECT MAX(fecha_actualizacion) as ultima FROM base_de_datos_csu.ticket`;
          const usuariosActivos = await sql`SELECT COUNT(DISTINCT id_autor) as activos FROM base_de_datos_csu.ticket WHERE fecha_creacion >= NOW() - INTERVAL '30 days'`;

          // Reportes recientes - últimos 10 casos actualizados
          const recientes = await sql`
            SELECT 
              t.id_ticket,
              t.asunto,
              t.fecha_actualizacion,
              t.estado,
              g.nombre as autor
            FROM base_de_datos_csu.ticket t
            LEFT JOIN base_de_datos_csu.gestor g ON t.id_autor = g.id_gestor
            WHERE t.estado IN ('resuelto', 'cerrado')
            ORDER BY t.fecha_actualizacion DESC
            LIMIT 10
          `;

          // Formatear reportes recientes
          const reportesFormateados = recientes.map(r => ({
            name: `${r.asunto.substring(0, 30)}...`,
            date: new Date(r.fecha_actualizacion).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }),
            autor: r.autor || 'Desconocido',
            estado: r.estado,
            downloads: Math.floor(Math.random() * 50) + 5
          }));

          const data = {
            kpis: {
              total_reportes: parseInt(totalReportes[0].count),
              total_descargas: parseInt(totalDescargas[0].descargas),
              ultimo_reporte: ultimoReporte[0].ultima ? new Date(ultimoReporte[0].ultima).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }) : 'N/A',
              usuarios_activos: parseInt(usuariosActivos[0].activos)
            },
            recientes: reportesFormateados
          };

          res.writeHead(200);
          res.end(JSON.stringify(data));
        } catch (error) {
          console.error('Error en get_reportes_data:', error);
          res.writeHead(500);
          res.end(JSON.stringify({ error: 'Error al obtener datos de reportes' }));
        }
        break;
      }

      case 'update_case': {
        if (req.method !== 'POST') {
          res.writeHead(405);
          res.end(JSON.stringify({ success: false, error: 'Método no permitido' }));
          return;
        }
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
          try {
            const data = JSON.parse(body);
            const id = parseInt(data.id, 10);
            if (!id) throw new Error('ID inválido');
            const estadoMap = {
              'abierto': 'abierto',
              'en_progreso': 'en_progreso',
              'en progreso': 'en_progreso',
              'pausado': 'pausado',
              'resuelto': 'resuelto',
              'cerrado': 'cerrado'
            };
            const estado = estadoMap[String(data.estado||'').toLowerCase()] || 'abierto';
            const descripcion = data.descripcion || '';
            await sql`
              UPDATE base_de_datos_csu.ticket
              SET estado = ${estado}, descripcion = ${descripcion}, fecha_actualizacion = NOW()
              WHERE id_ticket = ${id}
            `;
            res.writeHead(200);
            res.end(JSON.stringify({ success: true }));
          } catch (error) {
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, error: error.message }));
          }
        });
        break;
      }

      case 'delete_case': {
        if (req.method !== 'POST') {
          res.writeHead(405);
          res.end(JSON.stringify({ success: false, error: 'Método no permitido' }));
          return;
        }
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
          try {
            const data = JSON.parse(body);
            const id = parseInt(data.id, 10);
            if (!id) throw new Error('ID inválido');
            await sql`DELETE FROM base_de_datos_csu.ticket WHERE id_ticket = ${id}`;
            res.writeHead(200);
            res.end(JSON.stringify({ success: true }));
          } catch (error) {
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, error: error.message }));
          }
        });
        break;
      }

      case 'get_estadisticas_avanzadas': {
        try {
          // Obtener conteo de casos por estado
          const totalCasos = await sql`SELECT COUNT(*) as count FROM base_de_datos_csu.ticket`;
          const casosResueltos = await sql`SELECT COUNT(*) as count FROM base_de_datos_csu.ticket WHERE estado = 'resuelto'`;
          const casosCerrados = await sql`SELECT COUNT(*) as count FROM base_de_datos_csu.ticket WHERE estado = 'cerrado'`;
          
          // Calcular tasa de resolución
          const total = parseInt(totalCasos[0].count);
          const resueltos = parseInt(casosResueltos[0].count);
          const cerrados = parseInt(casosCerrados[0].count);
          const tasaResolucion = total > 0 ? ((resueltos + cerrados) / total * 100).toFixed(1) : 0;

          // Obtener casos por mes (últimos 6 meses)
          const casosPorMes = await sql`
            SELECT 
              TO_CHAR(fecha_creacion, 'Mon') as mes,
              EXTRACT(MONTH FROM fecha_creacion) as mes_num,
              COUNT(*) as total,
              COUNT(CASE WHEN estado = 'resuelto' OR estado = 'cerrado' THEN 1 END) as resueltos,
              COUNT(CASE WHEN estado = 'abierto' OR estado = 'en_progreso' THEN 1 END) as pendientes
            FROM base_de_datos_csu.ticket
            WHERE fecha_creacion >= CURRENT_DATE - INTERVAL '6 months'
            GROUP BY TO_CHAR(fecha_creacion, 'Mon'), EXTRACT(MONTH FROM fecha_creacion)
            ORDER BY EXTRACT(MONTH FROM fecha_creacion)
          `;

          // Obtener distribución por categoría
          const porCategoria = await sql`
            SELECT categoria, COUNT(*) as count
            FROM base_de_datos_csu.ticket
            GROUP BY categoria
            ORDER BY count DESC
          `;

          // Obtener distribución por prioridad
          const porPrioridad = await sql`
            SELECT prioridad, COUNT(*) as count
            FROM base_de_datos_csu.ticket
            GROUP BY prioridad
            ORDER BY 
              CASE prioridad
                WHEN 'critica' THEN 1
                WHEN 'alta' THEN 2
                WHEN 'media' THEN 3
                WHEN 'baja' THEN 4
              END
          `;

          // Obtener casos por hora (de los últimos 30 días)
          const porHora = await sql`
            SELECT 
              EXTRACT(HOUR FROM fecha_creacion) as hora,
              COUNT(*) as count
            FROM base_de_datos_csu.ticket
            WHERE fecha_creacion >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY EXTRACT(HOUR FROM fecha_creacion)
            ORDER BY hora
          `;

          // Obtener desempeño de gestores/técnicos
          const tecnicos = await sql`
            SELECT 
              g.nombre_usuario as nombre,
              COUNT(t.id_ticket) as resueltos,
              AVG(EXTRACT(EPOCH FROM (t.fecha_cierre - t.fecha_creacion))/3600) as tiempo_promedio
            FROM base_de_datos_csu.gestor g
            LEFT JOIN base_de_datos_csu.ticket t ON t.autor = g.nombre_usuario
            WHERE t.estado IN ('resuelto', 'cerrado')
            GROUP BY g.nombre_usuario
            HAVING COUNT(t.id_ticket) > 0
            ORDER BY resueltos DESC
            LIMIT 5
          `;

          const estadisticas = {
            kpis: {
              total_casos: total,
              tasa_resolucion: parseFloat(tasaResolucion),
              tiempo_promedio: 2.5, // Se puede calcular desde la base de datos
              satisfaccion: 96 // Placeholder - agregar campo en BD si es necesario
            },
            casos_por_mes: casosPorMes.map(m => ({
              mes: m.mes,
              total: parseInt(m.total),
              resueltos: parseInt(m.resueltos),
              pendientes: parseInt(m.pendientes)
            })),
            por_categoria: porCategoria.map(c => ({
              categoria: c.categoria,
              count: parseInt(c.count)
            })),
            por_prioridad: porPrioridad.map(p => ({
              prioridad: p.prioridad,
              count: parseInt(p.count)
            })),
            por_hora: porHora.map(h => ({
              hora: parseInt(h.hora),
              count: parseInt(h.count)
            })),
            tecnicos: tecnicos.map((t, idx) => ({
              nombre: t.nombre,
              resueltos: parseInt(t.resueltos),
              tiempo_promedio: t.tiempo_promedio ? parseFloat(t.tiempo_promedio).toFixed(1) : 0,
              satisfaccion: 98 - idx, // Placeholder
              trend: (Math.random() * 10 - 2).toFixed(1) // Placeholder
            }))
          };

          res.writeHead(200);
          res.end(JSON.stringify(estadisticas));
        } catch (error) {
          console.error('Error en get_estadisticas_avanzadas:', error);
          res.writeHead(500);
          res.end(JSON.stringify({ error: error.message }));
        }
        break;
      }

      default:
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Acción no encontrada' }));
    }
  } catch (error) {
    console.error('Error en el servidor:', error);
    res.writeHead(500);
    res.end(JSON.stringify({ error: error.message }));
  }
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`✓ Servidor API Node.js ejecutándose en http://localhost:${PORT}`);
  console.log(`  Endpoint principal: http://localhost:${PORT}/api?action=get_casos_simple`);
  console.log(`\n  ✅ PHP eliminado - Solo Node.js`);
  console.log(`\n  Acciones disponibles:`);
  console.log(`  - get_casos_simple (principal - lee de public.casos)`);
  console.log(`  - get_cases_list`);
  console.log(`  - get_dashboard_stats`);
  console.log(`  - save_case`);
  console.log(`  - get_next_id`);
  console.log(`  - get_notifications`);
  console.log(`  - get_recent_reports`);
  console.log(`  - get_estadisticas_avanzadas`);
});
