import postgres from 'postgres';
import { readFileSync } from 'fs';

const configContent = readFileSync('../Config.env', 'utf8');
const dbUrlLine = configContent.split('\n').find(line => line.startsWith('DATABASE_URL='));
const DATABASE_URL = dbUrlLine.split('=')[1].trim();

console.log('\n🔍 Diagnosticando conexión...\n');
console.log('DATABASE_URL:', DATABASE_URL.substring(0, 50) + '...');

const sql = postgres(DATABASE_URL, { prepare: false });

try {
  const result = await sql`SELECT COUNT(*) as total FROM base_de_datos_csu.ticket`;
  console.log('✅ Conexión a BD: OK');
  console.log(`✅ Tickets en BD: ${result[0].total}`);
  
  // Probar endpoint de casos
  const casos = await sql`SELECT id_ticket, descripcion, estado FROM base_de_datos_csu.ticket LIMIT 1`;
  console.log('✅ Lectura de datos: OK');
  console.log(`✅ Primer caso:`, casos[0]);
  
} catch(e) {
  console.log('❌ Error de conexión:', e.message);
  console.log('❌ Código:', e.code);
}

await sql.end();
