@echo off
echo ========================================
echo   COLSOF - Sistema de Gestion de Casos
echo   Servidor API Node.js
echo ========================================
echo.

cd /d "%~dp0Proyecto de Software CSU - COLSOF"

echo [1/2] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js no esta instalado
    echo Por favor instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)

echo [2/2] Iniciando servidor API...
echo.
echo Servidor corriendo en: http://localhost:3001
echo.
echo Presiona Ctrl+C para detener el servidor
echo ========================================
echo.

node "Usuario GESTOR/api-server.js"

pause
