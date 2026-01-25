// Script de verificación de conexiones - CSU COLSOF
// Ejecutar con: node db/verify-connections.js

import { pool, testConnection, closePool } from './connection.js';

console.log('🔍 VERIFICACIÓN DE CONEXIONES DEL PROYECTO CSU-COLSOF\n');
console.log('='.repeat(60));

async function verifyDatabaseConnection() {
    console.log('\n📊 1. VERIFICANDO CONEXIÓN A BASE DE DATOS...');
    try {
        const connected = await testConnection();
        if (connected) {
            console.log('   ✅ Conexión exitosa a PostgreSQL');
            return true;
        } else {
            console.log('   ❌ Error al conectar con la base de datos');
            return false;
        }
    } catch (error) {
        console.log('   ❌ Error:', error.message);
        return false;
    }
}

async function verifyTables() {
    console.log('\n📋 2. VERIFICANDO TABLAS...');
    try {
        const result = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        
        console.log(`   ✅ Tablas encontradas: ${result.rows.length}`);
        result.rows.forEach(row => {
            console.log(`      - ${row.table_name}`);
        });
        
        return result.rows.length > 0;
    } catch (error) {
        console.log('   ❌ Error al consultar tablas:', error.message);
        return false;
    }
}

async function verifyCasosData() {
    console.log('\n📁 3. VERIFICANDO TABLA CASOS...');
    try {
        // Contar registros
        const countResult = await pool.query('SELECT COUNT(*) as total FROM casos');
        const total = parseInt(countResult.rows[0].total);
        console.log(`   ✅ Total de casos: ${total}`);
        
        // Verificar columnas importantes
        const columnsResult = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'casos'
            ORDER BY ordinal_position
        `);
        console.log(`   ✅ Columnas: ${columnsResult.rows.length}`);
        
        // Estadísticas por estado
        const estadosResult = await pool.query(`
            SELECT estado, COUNT(*) as cantidad
            FROM casos
            GROUP BY estado
            ORDER BY cantidad DESC
        `);
        console.log('   📊 Distribución por estado:');
        estadosResult.rows.forEach(row => {
            console.log(`      - ${row.estado}: ${row.cantidad} casos`);
        });
        
        // Estadísticas por prioridad
        const prioridadesResult = await pool.query(`
            SELECT prioridad, COUNT(*) as cantidad
            FROM casos
            GROUP BY prioridad
            ORDER BY cantidad DESC
        `);
        console.log('   📊 Distribución por prioridad:');
        prioridadesResult.rows.forEach(row => {
            console.log(`      - ${row.prioridad}: ${row.cantidad} casos`);
        });
        
        return total > 0;
    } catch (error) {
        console.log('   ❌ Error al verificar tabla casos:', error.message);
        return false;
    }
}

async function verifyUsuariosData() {
    console.log('\n👥 4. VERIFICANDO TABLA USUARIOS...');
    try {
        // Contar registros
        const countResult = await pool.query('SELECT COUNT(*) as total FROM usuarios');
        const total = parseInt(countResult.rows[0].total);
        console.log(`   ✅ Total de usuarios: ${total}`);
        
        // Estadísticas por rol
        const rolesResult = await pool.query(`
            SELECT rol, COUNT(*) as cantidad
            FROM usuarios
            GROUP BY rol
            ORDER BY cantidad DESC
        `);
        console.log('   📊 Distribución por rol:');
        rolesResult.rows.forEach(row => {
            console.log(`      - ${row.rol}: ${row.cantidad} usuarios`);
        });
        
        // Usuarios activos vs inactivos
        const activosResult = await pool.query(`
            SELECT activo, COUNT(*) as cantidad
            FROM usuarios
            GROUP BY activo
        `);
        console.log('   📊 Distribución por estado:');
        activosResult.rows.forEach(row => {
            const estado = row.activo ? 'Activos' : 'Inactivos';
            console.log(`      - ${estado}: ${row.cantidad} usuarios`);
        });
        
        return total > 0;
    } catch (error) {
        console.log('   ❌ Error al verificar tabla usuarios:', error.message);
        return false;
    }
}

async function verifyAPIEndpoints() {
    console.log('\n🔌 5. VERIFICANDO ESTRUCTURA DE ARCHIVOS...');
    
    const filesToCheck = [
        { path: './server.js', name: 'Servidor Express' },
        { path: './shared/app-init.js', name: 'Script de inicialización compartido' },
        { path: './shared/api-client.js', name: 'Cliente API' },
        { path: './db/connection.js', name: 'Módulo de conexión DB' },
        { path: '../Config.env', name: 'Archivo de configuración' }
    ];
    
    const fs = await import('fs');
    let allExist = true;
    
    for (const file of filesToCheck) {
        try {
            const path = new URL(file.path, import.meta.url);
            if (fs.existsSync(path)) {
                console.log(`   ✅ ${file.name}: OK`);
            } else {
                console.log(`   ❌ ${file.name}: NO ENCONTRADO`);
                allExist = false;
            }
        } catch (error) {
            console.log(`   ❌ ${file.name}: ERROR`);
            allExist = false;
        }
    }
    
    return allExist;
}

async function verifyModulesStructure() {
    console.log('\n📂 6. VERIFICANDO ESTRUCTURA DE MÓDULOS...');
    
    const fs = await import('fs');
    const path = await import('path');
    
    const modulesToCheck = [
        'Usuario GESTOR/Casos/Asignados',
        'Usuario GESTOR/Casos/Mis Casos',
        'Usuario GESTOR/Casos/Sin Asignar',
        'Usuario GESTOR/Casos/Por Cerrar',
        'Usuario GESTOR/Casos/Borradores',
        'Usuario GESTOR/estadisticas',
        'Usuario GESTOR/Clientes',
        'Usuario GESTOR/Centro de costos',
        'Usuario ADMINISTRADOR/Usuarios/Lista'
    ];
    
    let modulesFound = 0;
    
    for (const module of modulesToCheck) {
        try {
            const modulePath = path.join(process.cwd(), module);
            if (fs.existsSync(modulePath)) {
                console.log(`   ✅ ${module}`);
                modulesFound++;
            } else {
                console.log(`   ⚠️  ${module} - No encontrado`);
            }
        } catch (error) {
            console.log(`   ❌ ${module} - Error`);
        }
    }
    
    console.log(`   📊 Módulos encontrados: ${modulesFound}/${modulesToCheck.length}`);
    return modulesFound > 0;
}

async function generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('\n📄 RESUMEN DE VERIFICACIÓN\n');
    
    const results = {
        database: false,
        tables: false,
        casos: false,
        usuarios: false,
        files: false,
        modules: false
    };
    
    results.database = await verifyDatabaseConnection();
    results.tables = await verifyTables();
    results.casos = await verifyCasosData();
    results.usuarios = await verifyUsuariosData();
    results.files = await verifyAPIEndpoints();
    results.modules = await verifyModulesStructure();
    
    console.log('\n' + '='.repeat(60));
    console.log('\n🎯 RESULTADO FINAL:\n');
    
    const checks = [
        { name: 'Conexión a Base de Datos', status: results.database },
        { name: 'Tablas de Base de Datos', status: results.tables },
        { name: 'Datos de Casos', status: results.casos },
        { name: 'Datos de Usuarios', status: results.usuarios },
        { name: 'Archivos del Sistema', status: results.files },
        { name: 'Estructura de Módulos', status: results.modules }
    ];
    
    checks.forEach(check => {
        const icon = check.status ? '✅' : '❌';
        const status = check.status ? 'OK' : 'FALLÓ';
        console.log(`   ${icon} ${check.name}: ${status}`);
    });
    
    const allPassed = Object.values(results).every(r => r);
    
    console.log('\n' + '='.repeat(60));
    
    if (allPassed) {
        console.log('\n🎉 ¡TODAS LAS VERIFICACIONES PASARON EXITOSAMENTE!\n');
        console.log('✅ El proyecto está listo para usar.');
        console.log('✅ Puedes iniciar el servidor con: npm start');
        console.log('✅ Revisa GUIA-IMPLEMENTACION.md para los siguientes pasos\n');
    } else {
        console.log('\n⚠️  ALGUNAS VERIFICACIONES FALLARON\n');
        console.log('❌ Revisa los errores anteriores');
        console.log('❌ Consulta GUIA-IMPLEMENTACION.md para soluciones\n');
    }
    
    console.log('='.repeat(60) + '\n');
}

// Ejecutar verificación
try {
    await generateReport();
} catch (error) {
    console.error('\n❌ Error durante la verificación:', error);
} finally {
    await closePool();
    process.exit(0);
}
