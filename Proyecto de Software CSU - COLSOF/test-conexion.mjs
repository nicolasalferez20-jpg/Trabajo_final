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

console.log('🔍 Validando conexión a la base de datos...\n');

const sql = postgres(DATABASE_URL);

async function testConnection() {
  try {
    // Probar conexión básica
    console.log('📡 Intentando conectar a PostgreSQL...');
    const result = await sql`SELECT version()`;
    console.log('✅ Conexión exitosa!');
    console.log('📊 Versión de PostgreSQL:', result[0].version.split(' ')[0], result[0].version.split(' ')[1]);
    
    // Verificar base de datos actual
    const dbInfo = await sql`SELECT current_database(), current_user`;
    console.log('\n📋 Información de la conexión:');
    console.log('   - Base de datos:', dbInfo[0].current_database);
    console.log('   - Usuario:', dbInfo[0].current_user);
    
    // Listar tablas existentes
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log('\n📦 Tablas en la base de datos:');
    if (tables.length > 0) {
      tables.forEach(t => console.log(`   - ${t.table_name}`));
    } else {
      console.log('   (No hay tablas creadas)');
    }
    
    // Verificar tabla casos específicamente
    const casosTable = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'casos'
      ) as exists
    `;
    
    if (casosTable[0].exists) {
      console.log('\n✅ Tabla "casos" existe');
      
      // Contar registros en la tabla casos
      const count = await sql`SELECT COUNT(*) FROM casos`;
      console.log(`   Registros en tabla casos: ${count[0].count}`);
    } else {
      console.log('\n⚠️  La tabla "casos" no existe aún');
    }
    
    console.log('\n✨ Validación completada exitosamente\n');
    
  } catch (error) {
    console.error('\n❌ Error en la conexión:', error.message);
    console.error('   Detalles:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

testConnection();
