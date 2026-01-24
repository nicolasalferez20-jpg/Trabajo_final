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

async function checkStructure() {
  try {
    console.log('🔍 Analizando estructura de la base de datos...\n');
    
    // Verificar esquemas
    const schemas = await sql`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schema_name
    `;
    
    console.log('📁 Esquemas disponibles:');
    schemas.forEach(s => console.log(`   - ${s.schema_name}`));
    
    // Verificar si existe el esquema base_de_datos_csu
    const csuSchema = schemas.find(s => s.schema_name === 'base_de_datos_csu');
    
    if (csuSchema) {
      console.log('\n✅ Esquema "base_de_datos_csu" existe');
      
      // Listar tablas en ese esquema
      const tables = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'base_de_datos_csu' 
        ORDER BY table_name
      `;
      
      console.log('\n📦 Tablas en esquema base_de_datos_csu:');
      if (tables.length > 0) {
        tables.forEach(t => console.log(`   - ${t.table_name}`));
      } else {
        console.log('   (No hay tablas en este esquema)');
      }
    } else {
      console.log('\n⚠️  Esquema "base_de_datos_csu" NO existe');
    }
    
    // Ver tabla casos en public
    console.log('\n📦 Tablas en esquema public:');
    const publicTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    if (publicTables.length > 0) {
      publicTables.forEach(t => console.log(`   - ${t.table_name}`));
      
      // Ver estructura de la tabla casos
      if (publicTables.find(t => t.table_name === 'casos')) {
        console.log('\n📋 Estructura de la tabla "casos":');
        const columns = await sql`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'casos'
          ORDER BY ordinal_position
        `;
        columns.forEach(c => {
          console.log(`   - ${c.column_name} (${c.data_type}) ${c.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });
        
        // Datos de ejemplo
        const sample = await sql`SELECT * FROM casos LIMIT 2`;
        console.log('\n📊 Datos de ejemplo:');
        console.log(JSON.stringify(sample, null, 2));
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await sql.end();
  }
}

checkStructure();
