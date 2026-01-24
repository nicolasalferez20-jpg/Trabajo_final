import postgres from 'postgres';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Leer DATABASE_URL del archivo Config.env
const configPath = join(__dirname, '..', 'Config.env');
const configContent = readFileSync(configPath, 'utf8');
const dbUrlLine = configContent.split('\n').find(line => line.startsWith('DATABASE_URL='));
const DATABASE_URL = dbUrlLine ? dbUrlLine.split('=')[1].trim() : null;

if (!DATABASE_URL) {
  console.error('❌ No se encontró DATABASE_URL en Config.env');
  process.exit(1);
}

const sql = postgres(DATABASE_URL);

// Lista ampliada de clientes empresariales de Bogotá
const clientes = [
  'COLSOF SAS', 'Ecopetrol', 'Bancolombia', 'Banco de Bogotá', 'Davivienda',
  'Avianca', 'Claro Colombia', 'Movistar Colombia', 'ETB', 'Tigo Une',
  'Grupo Éxito', 'Postobón', 'Alpina', 'Nutresa', 'Carvajal',
  'Compensar', 'Sura', 'Seguros Bolívar', 'Bavaria', 'Cementos Argos',
  'Corona', 'Grupo Aval', 'Banco Popular', 'BBVA Colombia', 'Scotiabank',
  'Cemex Colombia', 'Falabella', 'Almacenes Éxito', 'Carulla', 'Alkosto',
  'Homecenter', 'Sodimac', 'Makro', 'Metro', 'Olímpica',
  'Colsubsidio', 'Cafam', 'Comfenalco', 'Comfandi', 'Comfamiliar',
  'Codensa', 'Gas Natural', 'Emgesa', 'Vanti', 'Acueducto de Bogotá',
  'TransMilenio', 'El Tiempo', 'Caracol TV', 'RCN', 'Semana'
];

const sedes = [
  'Sede Principal', 'Bogotá Centro', 'Bogotá Norte', 'Bogotá Sur',
  'Chapinero', 'Usaquén', 'Suba', 'Engativá', 'Kennedy', 'Fontibón',
  'Calle 100', 'Calle 72', 'Zona Rosa', 'Centro Internacional',
  'La Candelaria', 'Teusaquillo', 'Barrios Unidos', 'Puente Aranda'
];

const nombres = [
  'Carlos Rodríguez', 'María García', 'Juan Pérez', 'Ana Martínez',
  'Luis Gómez', 'Laura Sánchez', 'Pedro Ramírez', 'Carmen López',
  'José Torres', 'Isabel Flores', 'Miguel Ángel Díaz', 'Patricia Ruiz',
  'Fernando Castro', 'Rosa Herrera', 'Antonio Jiménez', 'Teresa Moreno',
  'Manuel Álvarez', 'Lucía Romero', 'Roberto Navarro', 'Elena Gutiérrez',
  'David Silva', 'Marta Ortiz', 'Javier Molina', 'Cristina Delgado',
  'Andrés Vargas', 'Sofía Reyes', 'Ricardo Medina', 'Paula Castro'
];

const tecnicos = [
  'Técnico 1', 'Técnico 2', 'Técnico 3', 'Técnico 4', 'Técnico 5',
  'Juan Ramírez', 'Carlos Méndez', 'Ana Torres', 'Luis Vargas', 'María Soto',
  'Pedro Gómez', 'Laura Díaz', 'Miguel Castro', 'Sofía Ruiz', 'David López'
];

const gestores = [
  'Juan Pérez', 'María González', 'Carlos López', 'Ana Martínez',
  'Luis Rodríguez', 'Laura García', 'Pedro Sánchez', 'Carmen Díaz'
];

const categorias = [
  'HARDWARE', 'SOFTWARE', 'REDES', 'IMPRESIÓN', 'TELEFONÍA',
  'SERVIDORES', 'SEGURIDAD', 'BASE DE DATOS', 'CORREO', 'BACKUP'
];

const prioridades = ['Baja', 'Media', 'Alta', 'Urgente', 'Crítica'];

const estados = ['Activo', 'En Progreso', 'Pausado', 'Resuelto', 'Cerrado'];

const marcasEquipos = ['Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'Apple', 'Samsung', 'Toshiba', 'MSI', 'Cisco'];

const tiposEquipos = [
  'Laptop', 'PC Escritorio', 'Servidor', 'Impresora', 'Switch',
  'Router', 'Teléfono IP', 'Monitor', 'Scanner', 'Tablet'
];

const descripciones = [
  'Equipo no enciende, requiere revisión urgente',
  'Pantalla presenta líneas horizontales intermitentes',
  'Sistema operativo presenta errores al iniciar',
  'Impresora no detecta cartuchos de tinta',
  'Conexión de red intermitente en toda la oficina',
  'Correo electrónico no sincroniza con el servidor',
  'Software de contabilidad presenta error al generar reportes',
  'Disco duro emite ruidos extraños',
  'Teclado tiene varias teclas que no responden',
  'Ventilador hace ruido excesivo y el equipo se sobrecalienta',
  'No puede acceder a carpetas compartidas en la red',
  'Antivirus detecta amenazas pero no puede eliminarlas',
  'Backup programado falla constantemente',
  'Base de datos presenta lentitud en consultas',
  'VPN no permite conectarse desde ubicación remota',
  'Teléfono IP no registra en la central telefónica',
  'Switch de red presenta luces rojas en varios puertos',
  'Proyector no muestra imagen correctamente',
  'UPS emite pitidos continuos y no carga',
  'Software ERP presenta error al procesar transacciones',
  'Servidor de archivos no responde a las solicitudes',
  'Certificado SSL ha expirado y requiere renovación',
  'Cámara de seguridad no transmite video',
  'Lector de código de barras no escanea correctamente',
  'Sistema de punto de venta se congela frecuentemente',
  'Disco duro está al 95% de capacidad',
  'Puerto USB no reconoce dispositivos externos',
  'Monitor presenta manchas oscuras en la pantalla',
  'Teclado derramó líquido y algunas teclas no funcionan',
  'Software de diseño presenta errores de renderizado'
];

function generarID() {
  return '030' + String(Math.floor(Math.random() * 1000000000)).padStart(9, '0');
}

function generarSerial() {
  return 'SN' + Math.random().toString(36).substring(2, 10).toUpperCase();
}

function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generarFechaAleatoria() {
  const inicio = new Date('2024-01-01');
  const fin = new Date('2026-01-23');
  const fecha = new Date(inicio.getTime() + Math.random() * (fin.getTime() - inicio.getTime()));
  return fecha.toISOString();
}

function generarTelefono() {
  return '3' + String(Math.floor(Math.random() * 900000000) + 100000000);
}

function generarEmail(nombre) {
  const nombreSinEspacios = nombre.toLowerCase().replace(/\s+/g, '.');
  const dominios = ['gmail.com', 'hotmail.com', 'outlook.com', 'colsof.com.co', 'empresa.com'];
  return nombreSinEspacios + '@' + random(dominios);
}

async function generarCasos() {
  try {
    console.log('🚀 Generando 50 casos de servicio...\n');

    // Verificar si ya existen casos
    const casosExistentes = await sql`SELECT COUNT(*) as count FROM public.casos`;
    const countAntes = parseInt(casosExistentes[0].count);
    console.log(`📊 Casos actuales en la base de datos: ${countAntes}`);

    const casos = [];
    
    for (let i = 0; i < 50; i++) {
      const cliente = random(clientes);
      const contacto = random(nombres);
      const tecnico = random(tecnicos);
      const gestor = random(gestores);
      const categoria = random(categorias);
      const prioridad = random(prioridades);
      const estado = random(estados);
      const marca = random(marcasEquipos);
      const tipo = random(tiposEquipos);
      const sede = random(sedes);
      const descripcion = random(descripciones);
      
      const caso = {
        id: generarID(),
        cliente: cliente,
        sede: sede,
        contacto: contacto,
        correo: generarEmail(contacto),
        telefono: generarTelefono(),
        contacto2: Math.random() > 0.5 ? random(nombres) : null,
        correo2: Math.random() > 0.5 ? generarEmail(random(nombres)) : null,
        telefono2: Math.random() > 0.5 ? generarTelefono() : null,
        centro_costos: `CC-${Math.floor(Math.random() * 9000) + 1000}`,
        serial: generarSerial(),
        marca: marca,
        tipo: tipo,
        categoria: categoria,
        descripcion: descripcion,
        asignado_a: tecnico,
        prioridad: prioridad,
        estado: estado,
        autor: gestor,
        fecha_creacion: generarFechaAleatoria(),
        fecha_actualizacion: new Date().toISOString()
      };
      
      casos.push(caso);
    }

    // Insertar casos en la base de datos
    console.log('\n📝 Insertando casos en la base de datos...\n');
    
    for (let i = 0; i < casos.length; i++) {
      const c = casos[i];
      
      try {
        await sql`
          INSERT INTO public.casos (
            id, cliente, sede, contacto, correo, telefono,
            contacto2, correo2, telefono2, centro_costos,
            serial, marca, tipo, categoria, descripcion,
            asignado_a, prioridad, estado, autor,
            fecha_creacion, fecha_actualizacion
          ) VALUES (
            ${c.id}, ${c.cliente}, ${c.sede}, ${c.contacto}, ${c.correo}, ${c.telefono},
            ${c.contacto2}, ${c.correo2}, ${c.telefono2}, ${c.centro_costos},
            ${c.serial}, ${c.marca}, ${c.tipo}, ${c.categoria}, ${c.descripcion},
            ${c.asignado_a}, ${c.prioridad}, ${c.estado}, ${c.autor},
            ${c.fecha_creacion}, ${c.fecha_actualizacion}
          )
        `;
        
        if ((i + 1) % 10 === 0) {
          console.log(`   ✓ ${i + 1}/50 casos insertados`);
        }
      } catch (error) {
        console.error(`   ❌ Error insertando caso ${i + 1}:`, error.message);
      }
    }

    // Verificar casos finales
    const casosDespues = await sql`SELECT COUNT(*) as count FROM public.casos`;
    const countDespues = parseInt(casosDespues[0].count);
    const nuevos = countDespues - countAntes;
    
    console.log('\n✅ Proceso completado!');
    console.log(`\n📊 Estadísticas:`);
    console.log(`   • Casos antes: ${countAntes}`);
    console.log(`   • Casos después: ${countDespues}`);
    console.log(`   • Casos nuevos: ${nuevos}`);
    
    // Estadísticas por estado
    console.log('\n📈 Distribución por estado:');
    const porEstado = await sql`
      SELECT estado, COUNT(*) as count 
      FROM public.casos 
      GROUP BY estado 
      ORDER BY count DESC
    `;
    porEstado.forEach(e => {
      console.log(`   • ${e.estado}: ${e.count} casos`);
    });
    
    // Estadísticas por prioridad
    console.log('\n⚡ Distribución por prioridad:');
    const porPrioridad = await sql`
      SELECT prioridad, COUNT(*) as count 
      FROM public.casos 
      GROUP BY prioridad 
      ORDER BY 
        CASE prioridad
          WHEN 'Crítica' THEN 1
          WHEN 'Urgente' THEN 2
          WHEN 'Alta' THEN 3
          WHEN 'Media' THEN 4
          WHEN 'Baja' THEN 5
        END
    `;
    porPrioridad.forEach(p => {
      console.log(`   • ${p.prioridad}: ${p.count} casos`);
    });

    // Estadísticas por categoría
    console.log('\n🏷️  Distribución por categoría:');
    const porCategoria = await sql`
      SELECT categoria, COUNT(*) as count 
      FROM public.casos 
      GROUP BY categoria 
      ORDER BY count DESC 
      LIMIT 5
    `;
    porCategoria.forEach(c => {
      console.log(`   • ${c.categoria}: ${c.count} casos`);
    });

    console.log('\n✨ Base de datos actualizada exitosamente\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await sql.end();
  }
}

generarCasos();
