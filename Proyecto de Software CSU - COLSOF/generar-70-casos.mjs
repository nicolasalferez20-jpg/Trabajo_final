import postgres from 'postgres';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const configPath = join(__dirname, '..', 'Config.env');
const configContent = readFileSync(configPath, 'utf8');
const dbUrlLine = configContent.split('\n').find(line => line.startsWith('DATABASE_URL='));
const DATABASE_URL = dbUrlLine ? dbUrlLine.split('=')[1].trim() : null;

const sql = postgres(DATABASE_URL, { prepare: false });

// Datos de referencia
const estados = ['abierto', 'en_progreso', 'cerrado'];
const prioridades = ['Baja', 'Media', 'Alta', 'Crítica'];
const categorias = ['Hardware', 'Software', 'Conectividad', 'Seguridad', 'Consultoría', 'Mantenimiento'];

const descripcionesBase = [
  'Falla en servidor - No responde correctamente',
  'Error en aplicación - Problema de rendimiento',
  'Problema de conectividad - Red intermitente',
  'Actualización de software requerida',
  'Mantenimiento preventivo de equipos',
  'Respaldo de información crítica',
  'Configuración de firewall necesaria',
  'Problema con impresora de red',
  'Instalación de nuevo software',
  'Capacitación en herramientas',
  'Migración de datos entre servidores',
  'Optimización de base de datos',
  'Problema con correo electrónico',
  'Actualización de sistema operativo',
  'Configuración de VPN',
  'Problema de acceso a recursos compartidos',
  'Instalación de certificados SSL',
  'Monitoreo de rendimiento del sistema',
  'Recuperación de archivos borrados',
  'Configuración de backup automático',
  'Problema con licencias de software',
  'Actualización de antivirus',
  'Configuración de políticas de seguridad',
  'Instalación de parches de seguridad',
  'Revisión de logs del sistema'
];

const empresas = [
  'Tech Solutions S.A.S', 'Digital Corp Ltda', 'Innovate Systems', 'Smart Business S.A.',
  'Cloud Services Ltda', 'Data Analytics S.A.S', 'Cyber Security Corp', 'Software House Ltda',
  'IT Consultores S.A.S', 'Network Solutions', 'Mobile Apps S.A.', 'Web Development Ltda',
  'Database Experts S.A.S', 'Hardware Plus Ltda', 'Office Solutions S.A.', 'Tech Support Corp',
  'Enterprise Systems Ltda', 'Business Intelligence S.A.S', 'Infrastructure Services',
  'Digital Marketing S.A.'
];

const ciudades = ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga', 'Pereira', 'Manizales'];

const nombres = ['Juan', 'María', 'Carlos', 'Ana', 'Pedro', 'Laura', 'Diego', 'Sofia', 'Luis', 'Carmen', 'Jorge', 'Patricia', 'Miguel', 'Isabel', 'Fernando', 'Rosa'];
const apellidos = ['García', 'Rodríguez', 'Martínez', 'López', 'González', 'Pérez', 'Sánchez', 'Ramírez', 'Torres', 'Flores', 'Rivera', 'Gómez', 'Díaz', 'Cruz', 'Morales', 'Ortiz'];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generarNombreCompleto() {
  return `${randomItem(nombres)} ${randomItem(apellidos)}`;
}

async function generarCasos() {
  try {
    console.log('\n🎯 Generando 70 casos de servicio con datos variados...\n');

    // 1. Obtener IDs existentes
    console.log('📋 Obteniendo datos existentes...');
    const usuarios = await sql`SELECT id_usuario FROM base_de_datos_csu.ususario WHERE rol IN ('Tecnico', 'Gestor')`;
    const gestoresDB = await sql`SELECT id_gestor, ususario_id_usuario FROM base_de_datos_csu.gestor`;
    const tecnicosDB = await sql`SELECT id_tecnico, ususario_id_usuario FROM base_de_datos_csu.tecnico`;
    const clientesExistentes = await sql`SELECT id_cliente FROM base_de_datos_csu.cliente`;
    const categoriasDB = await sql`SELECT id_categoria FROM base_de_datos_csu.categoria`;
    const adminDB = await sql`SELECT id_administrador FROM base_de_datos_csu.administrador LIMIT 1`;
    
    const adminId = adminDB[0].id_administrador;
    
    console.log(`✅ ${usuarios.length} usuarios, ${gestoresDB.length} gestores, ${tecnicosDB.length} técnicos, ${clientesExistentes.length} clientes existentes`);

    // 2. Crear más clientes si es necesario (hasta 20)
    let clienteIds = clientesExistentes.map(c => c.id_cliente);
    if (clienteIds.length < 20) {
      console.log(`\n➕ Creando ${20 - clienteIds.length} clientes adicionales...`);
      for (let i = clienteIds.length; i < 20; i++) {
        const empresa = randomItem(empresas);
        const contacto = generarNombreCompleto();
        const resultado = await sql`
          INSERT INTO base_de_datos_csu.cliente (
            empresa, sede, direccion, contacto_principal, telefono_principal, 
            contacto_secundario, telefono_secundario, correo, fecha_creacion
          )
          VALUES (
            ${empresa},
            ${randomItem(ciudades)},
            ${`Calle ${Math.floor(Math.random() * 100)} No. ${Math.floor(Math.random() * 100)}-${Math.floor(Math.random() * 100)}`},
            ${contacto},
            ${`310${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`},
            ${generarNombreCompleto()},
            ${`320${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`},
            ${`contacto@${empresa.toLowerCase().replace(/\s+/g, '')}.com`},
            now()
          )
          RETURNING id_cliente
        `;
        clienteIds.push(resultado[0].id_cliente);
      }
      console.log(`✅ ${20 - clientesExistentes.length} clientes adicionales creados`);
    }

    const gestorIds = gestoresDB.map(g => ({ id: g.id_gestor, userId: g.ususario_id_usuario }));
    const tecnicoIds = tecnicosDB.map(t => ({ id: t.id_tecnico, userId: t.ususario_id_usuario }));
    const categoriaIds = categoriasDB.map(c => c.id_categoria);

    // 3. Generar 70 tickets con fechas variadas
    console.log('\n➕ Generando 70 tickets...');
    const ahora = new Date();
    const hace6Meses = new Date();
    hace6Meses.setMonth(hace6Meses.getMonth() - 6);

    const tickets = [];
    
    for (let i = 0; i < 70; i++) {
      const estado = randomItem(estados);
      const cliente = randomItem(clienteIds);
      const gestor = randomItem(gestorIds);
      const tecnico = randomItem(tecnicoIds);
      const categoria = randomItem(categoriaIds);
      const descripcion = randomItem(descripcionesBase);
      
      // Generar fechas con rangos variados
      const fechaCreacion = randomDate(hace6Meses, ahora);
      let fechaActualizacion = fechaCreacion;
      
      if (estado === 'en_progreso') {
        fechaActualizacion = randomDate(fechaCreacion, ahora);
      } else if (estado === 'cerrado') {
        const fechaMax = new Date(fechaCreacion);
        fechaMax.setDate(fechaMax.getDate() + Math.floor(Math.random() * 30) + 5);
        fechaActualizacion = randomDate(fechaCreacion, fechaMax < ahora ? fechaMax : ahora);
      }

      // Primero insertar seguimiento
      const seguimientoResult = await sql`
        INSERT INTO base_de_datos_csu.seguimiento (
          id_ticket, id_usuario, fecha, comentarios, tipo, estado_anterior, estado_nuevo
        )
        VALUES (
          ${i + 100},
          ${tecnico.userId},
          ${fechaCreacion.toISOString()},
          ${`Ticket asignado - ${descripcion}`},
          'asignacion',
          'nuevo',
          ${estado}
        )
        RETURNING id_seguimiento
      `;
      const seguimientoId = seguimientoResult[0].id_seguimiento;

      // Insertar ticket
      const ticketResult = await sql`
        INSERT INTO base_de_datos_csu.ticket (
          estado, id_cliente, id_tecnico, id_gestor, descripcion,
          fecha_creacion, fecha_actualizacion,
          cliente_id_cliente,
          gestor_id_gestor, gestor_ususario_id_usuario, gestor_ususario_administrador_id_administrador,
          tecnico_id_tecnico, tecnico_ususario_id_usuario, tecnico_ususario_administrador_id_administrador,
          seguimiento_id_seguimiento, categoria_id_categoria
        )
        VALUES (
          ${estado},
          ${cliente},
          ${tecnico.id},
          ${gestor.id},
          ${descripcion},
          ${fechaCreacion.toISOString()},
          ${fechaActualizacion.toISOString()},
          ${cliente},
          ${gestor.id}, ${gestor.userId}, ${adminId},
          ${tecnico.id}, ${tecnico.userId}, ${adminId},
          ${seguimientoId},
          ${categoria}
        )
        RETURNING id_ticket
      `;
      
      tickets.push(ticketResult[0].id_ticket);
      
      // Agregar seguimientos adicionales para tickets en progreso o cerrados
      if (estado === 'en_progreso' || estado === 'cerrado') {
        const numSeguimientos = Math.floor(Math.random() * 3) + 1;
        for (let j = 0; j < numSeguimientos; j++) {
          const fechaSeguimiento = randomDate(fechaCreacion, fechaActualizacion);
          await sql`
            INSERT INTO base_de_datos_csu.seguimiento (
              id_ticket, id_usuario, fecha, comentarios, tipo, estado_anterior, estado_nuevo
            )
            VALUES (
              ${ticketResult[0].id_ticket},
              ${tecnico.userId},
              ${fechaSeguimiento.toISOString()},
              ${`Actualización ${j + 1}: Trabajando en la solución del problema.`},
              'comentario',
              ${estado},
              ${estado}
            )
          `;
        }
      }

      if ((i + 1) % 10 === 0) {
        console.log(`   ✓ ${i + 1}/70 tickets generados`);
      }
    }

    console.log(`✅ 70 tickets generados exitosamente`);

    // 4. Generar informes adicionales para tickets cerrados
    console.log('\n➕ Generando informes para tickets cerrados...');
    const ticketsCerrados = await sql`
      SELECT id_ticket, tecnico_ususario_id_usuario, descripcion 
      FROM base_de_datos_csu.ticket 
      WHERE estado = 'cerrado'
      LIMIT 20
    `;

    for (const ticket of ticketsCerrados) {
      await sql`
        INSERT INTO base_de_datos_csu.informe (
          id_usuario, tipo_informe, fecha_generacion, descripcion
        )
        VALUES (
          ${ticket.tecnico_ususario_id_usuario},
          ${randomItem(['clientes', 'rendimiento', 'auditoria'])},
          now() - interval '${Math.floor(Math.random() * 30)} days',
          ${`Ticket resuelto: ${ticket.descripcion}. Solución aplicada correctamente. Cliente satisfecho.`}
        )
      `;
    }
    console.log(`✅ ${ticketsCerrados.length} informes adicionales generados`);

    // 5. Estadísticas finales
    console.log('\n📊 Estadísticas finales de la base de datos:\n');
    
    const totalTickets = await sql`SELECT COUNT(*) as total FROM base_de_datos_csu.ticket`;
    const ticketsPorEstado = await sql`SELECT estado, COUNT(*) as cantidad FROM base_de_datos_csu.ticket GROUP BY estado ORDER BY cantidad DESC`;
    const totalClientes = await sql`SELECT COUNT(*) as total FROM base_de_datos_csu.cliente`;
    const totalSeguimientos = await sql`SELECT COUNT(*) as total FROM base_de_datos_csu.seguimiento`;
    const totalInformes = await sql`SELECT COUNT(*) as total FROM base_de_datos_csu.informe`;

    console.log(`   📋 Total de tickets: ${totalTickets[0].total}`);
    console.log(`   👥 Total de clientes: ${totalClientes[0].total}`);
    console.log(`   📝 Total de seguimientos: ${totalSeguimientos[0].total}`);
    console.log(`   📄 Total de informes: ${totalInformes[0].total}`);
    console.log('\n   Tickets por estado:');
    ticketsPorEstado.forEach(item => {
      console.log(`      • ${item.estado}: ${item.cantidad}`);
    });

    console.log('\n✅ Proceso completado exitosamente!\n');
    
  } catch (err) {
    console.error('❌ Error al generar casos:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

generarCasos();
