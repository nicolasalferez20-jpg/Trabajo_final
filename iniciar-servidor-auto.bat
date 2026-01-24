@echo off
title COLSOF - Servidor API con Auto-Reinicio
color 0A

:START
cls
echo ========================================
echo   COLSOF - Sistema de Gestion de Casos
echo   Servidor API con Auto-Reinicio
echo ========================================
echo.

cd /d "%~dp0Proyecto de Software CSU - COLSOF"

echo [*] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js no esta instalado
    echo Por favor instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)

echo [*] Node.js detectado correctamente
echo.
echo ========================================
echo   SERVIDOR INICIANDO...
echo ========================================
echo.
echo - URL: http://localhost:3001
echo - Endpoint: http://localhost:3001/api
echo - Auto-Reinicio: ACTIVADO
echo.
echo [*] El servidor se reiniciara automaticamente
echo     si detecta cambios en los archivos
echo.
echo [*] Presiona Ctrl+C para detener
echo ========================================
echo.

node "Usuario GESTOR/api-server.js"

echo.
echo [!] El servidor se detuvo
echo [*] Reiniciando en 3 segundos...
timeout /t 3 /nobreak >nul
goto START
