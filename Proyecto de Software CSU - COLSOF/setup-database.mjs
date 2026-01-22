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

async function setupDatabase() {
  try {
    console.log('📦 Conectando a la base de datos...');
    
    // Leer el archivo SQL
    const sqlFilePath = join(__dirname, 'crear_tabla_casos.sql');
    const sqlScript = readFileSync(sqlFilePath, 'utf8');
    
    // Dividir y ejecutar cada comando SQL en orden correcto
    const allCommands = sqlScript
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    // Separar comandos por tipo para ejecutar en orden
    const createTableCmd = allCommands.filter(cmd => cmd.includes('CREATE TABLE'));
    const createIndexCmds = allCommands.filter(cmd => cmd.includes('CREATE INDEX'));
    const insertCmds = allCommands.filter(cmd => cmd.includes('INSERT INTO'));
    const commentCmds = allCommands.filter(cmd => cmd.includes('COMMENT ON'));
    
    console.log(`📝 Ejecutando comandos SQL...`);
    
    // 1. Crear tabla primero
    for (const command of createTableCmd) {
      console.log(`  ✓ Creando tabla casos...`);
      try {
        await sql.unsafe(command);
      } catch (err) {
        if (!err.message.includes('already exists')) {
          throw err;
        }
        console.log(`  ℹ Tabla ya existe, continuando...`);
      }
    }
    
    // 2. Crear índices
    for (const command of createIndexCmds) {
      console.log(`  ✓ Creando índice...`);
      try {
        await sql.unsafe(command);
      } catch (err) {
        if (!err.message.includes('already exists')) {
          console.warn(`  ⚠ Advertencia:`, err.message);
        }
      }
    }
    
    // 3. Insertar datos
    for (const command of insertCmds) {
      console.log(`  ✓ Insertando datos de ejemplo...`);
      try {
        await sql.unsafe(command);
      } catch (err) {
        if (!err.message.includes('duplicate')) {
          console.warn(`  ⚠ Advertencia:`, err.message);
        }
      }
    }
    
    // 4. Agregar comentarios
    for (const command of commentCmds) {
      try {
        await sql.unsafe(command);
      } catch (err) {
        // Ignorar errores de comentarios
      }
    }
    
    console.log(`  ✓ Agregando comentarios...`);
    
    // Verificar que la tabla existe y tiene datos
    const result = await sql`SELECT COUNT(*) as count FROM casos`;
    console.log(`\n✅ Base de datos configurada correctamente`);
    console.log(`📊 Casos en la base de datos: ${result[0].count}`);
    
    // Mostrar algunos casos de ejemplo
    const casos = await sql`
      SELECT id, cliente, categoria, prioridad, estado, fecha_creacion 
      FROM casos 
      ORDER BY fecha_creacion DESC 
      LIMIT 5
    `;
    
    if (casos.length > 0) {
      console.log('\n📋 Últimos casos registrados:');
      casos.forEach(caso => {
        console.log(`  • ${caso.id} - ${caso.cliente} (${caso.categoria}) - Prioridad: ${caso.prioridad}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error al configurar la base de datos:', error);
    throw error;
  } finally {
    await sql.end({ timeout: 1 });
    console.log('\n🔌 Conexión cerrada');
  }
}

setupDatabase().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
