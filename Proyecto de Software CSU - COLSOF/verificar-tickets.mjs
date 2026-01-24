import postgres from 'postgres';
import { readFileSync } from 'fs';

const configContent = readFileSync('../Config.env', 'utf8');
const dbUrlLine = configContent.split('\n').find(line => line.startsWith('DATABASE_URL='));
const DATABASE_URL = dbUrlLine.split('=')[1].trim();

const sql = postgres(DATABASE_URL, { prepare: false });

const result = await sql`SELECT COUNT(*) as total FROM base_de_datos_csu.ticket`;
console.log(`\n📊 Total de tickets en la base de datos: ${result[0].total}\n`);

const ticketsPorEstado = await sql`SELECT estado, COUNT(*) as cantidad FROM base_de_datos_csu.ticket GROUP BY estado ORDER BY cantidad DESC`;
console.log('Tickets por estado:');
ticketsPorEstado.forEach(item => {
  console.log(`   • ${item.estado}: ${item.cantidad}`);
});

await sql.end();
