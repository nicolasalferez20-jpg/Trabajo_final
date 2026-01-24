const API_URL = 'http://localhost:3001/api';

async function probarEndpoints() {
  console.log('🧪 Probando endpoints de la API Node.js...\n');
  
  const endpoints = [
    'get_casos_simple',
    'get_next_id',
    'get_dashboard_stats'
  ];
  
  for (const action of endpoints) {
    try {
      console.log(`📡 Probando: ${action}`);
      const response = await fetch(`${API_URL}?action=${action}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ ${action} - OK`);
      
      if (action === 'get_casos_simple') {
        console.log(`   📊 Casos encontrados: ${data.length}`);
        if (data.length > 0) {
          console.log(`   📋 Primer caso: ID ${data[0].id} - ${data[0].cliente}`);
        }
      }
      
      console.log('');
      
    } catch (error) {
      console.error(`❌ ${action} - ERROR: ${error.message}\n`);
    }
  }
  
  console.log('✨ Prueba completada\n');
}

probarEndpoints();
