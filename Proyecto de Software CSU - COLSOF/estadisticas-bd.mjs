import postgres from 'postgres';
import { readFileSync } from 'fs';

const configContent = readFileSync('../Config.env', 'utf8');
const dbUrlLine = configContent.split('\n').find(line => line.startsWith('DATABASE_URL='));
const DATABASE_URL = dbUrlLine.split('=')[1].trim();

const sql = postgres(DATABASE_URL, { prepare: false });

console.log('\n📊 ESTADÍSTICAS COMPLETAS DE LA BASE DE DATOS CSU\n');
console.log('='.repeat(60));

// Tickets
const totalTickets = await sql`SELECT COUNT(*) as total FROM base_de_datos_csu.ticket`;
console.log(`\n✅ TICKETS: ${totalTickets[0].total} total`);

const ticketsPorEstado = await sql`SELECT estado, COUNT(*) as cantidad FROM base_de_datos_csu.ticket GROUP BY estado ORDER BY cantidad DESC`;
console.log('\n   Por estado:');
ticketsPorEstado.forEach(item => {
  const porcentaje = ((item.cantidad / totalTickets[0].total) * 100).toFixed(1);
  console.log(`      • ${item.estado.padEnd(15)}: ${item.cantidad.toString().padStart(3)} (${porcentaje}%)`);
});

// Tickets por categoría
const ticketsPorCategoria = await sql`
  SELECT c.nombre_categoria, COUNT(t.id_ticket) as cantidad
  FROM base_de_datos_csu.categoria c
  LEFT JOIN base_de_datos_csu.ticket t ON t.categoria_id_categoria = c.id_categoria
  GROUP BY c.nombre_categoria
  ORDER BY cantidad DESC
`;
console.log('\n   Por categoría:');
ticketsPorCategoria.forEach(item => {
  console.log(`      • ${item.nombre_categoria.padEnd(15)}: ${item.cantidad.toString().padStart(3)}`);
});

// Clientes
const totalClientes = await sql`SELECT COUNT(*) as total FROM base_de_datos_csu.cliente`;
console.log(`\n\n👥 CLIENTES: ${totalClientes[0].total} total`);

// Usuarios
const totalUsuarios = await sql`SELECT COUNT(*) as total FROM base_de_datos_csu.ususario`;
const usuariosPorRol = await sql`SELECT rol, COUNT(*) as cantidad FROM base_de_datos_csu.ususario GROUP BY rol ORDER BY cantidad DESC`;
console.log(`\n\n👤 USUARIOS: ${totalUsuarios[0].total} total`);
console.log('\n   Por rol:');
usuariosPorRol.forEach(item => {
  console.log(`      • ${item.rol.padEnd(15)}: ${item.cantidad.toString().padStart(3)}`);
});

// Gestores y Técnicos
const totalGestores = await sql`SELECT COUNT(*) as total FROM base_de_datos_csu.gestor`;
const totalTecnicos = await sql`SELECT COUNT(*) as total FROM base_de_datos_csu.tecnico`;
console.log(`\n      Gestores activos: ${totalGestores[0].total}`);
console.log(`      Técnicos activos: ${totalTecnicos[0].total}`);

// Seguimientos
const totalSeguimientos = await sql`SELECT COUNT(*) as total FROM base_de_datos_csu.seguimiento`;
const promedioSeguimientos = (totalSeguimientos[0].total / totalTickets[0].total).toFixed(2);
console.log(`\n\n📝 SEGUIMIENTOS: ${totalSeguimientos[0].total} total`);
console.log(`   Promedio por ticket: ${promedioSeguimientos}`);

// Informes
const totalInformes = await sql`SELECT COUNT(*) as total FROM base_de_datos_csu.informe`;
const informesPorTipo = await sql`SELECT tipo_informe, COUNT(*) as cantidad FROM base_de_datos_csu.informe GROUP BY tipo_informe ORDER BY cantidad DESC`;
console.log(`\n\n📄 INFORMES: ${totalInformes[0].total} total`);
console.log('\n   Por tipo:');
informesPorTipo.forEach(item => {
  console.log(`      • ${item.tipo_informe.padEnd(15)}: ${item.cantidad.toString().padStart(3)}`);
});

// Archivos
const totalArchivos = await sql`SELECT COUNT(*) as total FROM base_de_datos_csu.archivo`;
const archivosPorTipo = await sql`SELECT tipo_archivo, COUNT(*) as cantidad FROM base_de_datos_csu.archivo GROUP BY tipo_archivo ORDER BY cantidad DESC`;
console.log(`\n\n📎 ARCHIVOS: ${totalArchivos[0].total} total`);
console.log('\n   Por tipo:');
archivosPorTipo.forEach(item => {
  console.log(`      • ${item.tipo_archivo.padEnd(15)}: ${item.cantidad.toString().padStart(3)}`);
});

// Categorías
const totalCategorias = await sql`SELECT COUNT(*) as total FROM base_de_datos_csu.categoria`;
console.log(`\n\n📂 CATEGORÍAS: ${totalCategorias[0].total} total`);

// Rango de fechas de tickets
const rangoFechas = await sql`
  SELECT 
    MIN(fecha_creacion) as primera,
    MAX(fecha_creacion) as ultima
  FROM base_de_datos_csu.ticket
`;
const primeraFecha = new Date(rangoFechas[0].primera).toLocaleDateString('es-CO');
const ultimaFecha = new Date(rangoFechas[0].ultima).toLocaleDateString('es-CO');
console.log(`\n\n📅 RANGO DE FECHAS DE TICKETS:`);
console.log(`   Primera: ${primeraFecha}`);
console.log(`   Última:  ${ultimaFecha}`);

// Tickets por mes (últimos 6 meses)
const ticketsPorMes = await sql`
  SELECT 
    TO_CHAR(fecha_creacion, 'YYYY-MM') as mes,
    COUNT(*) as cantidad
  FROM base_de_datos_csu.ticket
  GROUP BY TO_CHAR(fecha_creacion, 'YYYY-MM')
  ORDER BY mes DESC
  LIMIT 6
`;
console.log(`\n\n📈 TICKETS POR MES (últimos 6 meses):`);
ticketsPorMes.forEach(item => {
  console.log(`   ${item.mes}: ${item.cantidad}`);
});

console.log('\n' + '='.repeat(60));
console.log('\n✅ Base de datos poblada exitosamente con información variada\n');

await sql.end();
