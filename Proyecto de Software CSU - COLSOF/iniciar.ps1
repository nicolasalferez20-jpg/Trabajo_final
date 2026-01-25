# 🚀 Script de Inicio Rápido - CSU COLSOF

Write-Host "
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║          🏢 PROYECTO CSU-COLSOF                              ║
║          Sistema de Gestión de Casos                         ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
" -ForegroundColor Cyan

Write-Host "`n📋 OPCIONES DISPONIBLES:`n" -ForegroundColor Yellow

Write-Host "1. Iniciar servidor API (puerto 3001)" -ForegroundColor White
Write-Host "2. Verificar conexión a base de datos" -ForegroundColor White
Write-Host "3. Ver estadísticas de la base de datos" -ForegroundColor White
Write-Host "4. Mostrar documentación" -ForegroundColor White
Write-Host "5. Abrir módulo de Casos Asignados (navegador)" -ForegroundColor White
Write-Host "6. Salir`n" -ForegroundColor White

$opcion = Read-Host "Selecciona una opción (1-6)"

switch ($opcion) {
    "1" {
        Write-Host "`n🚀 Iniciando servidor API...`n" -ForegroundColor Green
        npm start
    }
    "2" {
        Write-Host "`n🔍 Verificando conexión a base de datos...`n" -ForegroundColor Green
        node db/check-connection.js
        Write-Host "`n✅ Verificación completada`n" -ForegroundColor Green
        Read-Host "Presiona Enter para continuar"
    }
    "3" {
        Write-Host "`n📊 Obteniendo estadísticas de la base de datos...`n" -ForegroundColor Green
        node db/analyze-database.js
        Write-Host "`n✅ Análisis completado`n" -ForegroundColor Green
        Read-Host "Presiona Enter para continuar"
    }
    "4" {
        Write-Host "`n📚 DOCUMENTACIÓN DISPONIBLE:`n" -ForegroundColor Green
        Write-Host "  • RESUMEN-FINAL.md           - Resumen ejecutivo del proyecto"
        Write-Host "  • GUIA-IMPLEMENTACION.md     - Guía paso a paso"
        Write-Host "  • ANALISIS-PROYECTO.md       - Análisis completo"
        Write-Host "  • CONEXION-MODULOS.md        - Mapeo de conexiones`n"
        
        $doc = Read-Host "¿Qué documento deseas abrir? (1-4)"
        
        switch ($doc) {
            "1" { Start-Process "RESUMEN-FINAL.md" }
            "2" { Start-Process "GUIA-IMPLEMENTACION.md" }
            "3" { Start-Process "ANALISIS-PROYECTO.md" }
            "4" { Start-Process "CONEXION-MODULOS.md" }
        }
    }
    "5" {
        Write-Host "`n🌐 Abriendo módulo de Casos Asignados...`n" -ForegroundColor Green
        $htmlPath = "Usuario GESTOR\Casos\Asignados\Asignados.html"
        $fullPath = Join-Path $PSScriptRoot $htmlPath
        
        if (Test-Path $fullPath) {
            Start-Process $fullPath
            Write-Host "✅ Navegador abierto con el módulo" -ForegroundColor Green
            Write-Host "⚠️  Recuerda iniciar el servidor API (opción 1) si no está corriendo`n" -ForegroundColor Yellow
        } else {
            Write-Host "❌ Error: No se encontró el archivo HTML`n" -ForegroundColor Red
        }
        Read-Host "Presiona Enter para continuar"
    }
    "6" {
        Write-Host "`n👋 ¡Hasta luego!`n" -ForegroundColor Cyan
        exit
    }
    default {
        Write-Host "`n❌ Opción inválida`n" -ForegroundColor Red
        Read-Host "Presiona Enter para continuar"
    }
}

# Información adicional
Write-Host "`n" + "═" * 60 -ForegroundColor Gray
Write-Host "ℹ️  INFORMACIÓN RÁPIDA:" -ForegroundColor Cyan
Write-Host "   • API URL: http://localhost:3001" -ForegroundColor White
Write-Host "   • Base de datos: PostgreSQL en Supabase" -ForegroundColor White
Write-Host "   • Casos en BD: 54 registros" -ForegroundColor White
Write-Host "   • Usuarios en BD: 37 (3 admin + 7 gestores + 27 técnicos)" -ForegroundColor White
Write-Host "═" * 60 + "`n" -ForegroundColor Gray
