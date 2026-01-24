# 🚀 Sistema de Gestión de Casos - COLSOF S.A.S

## ✅ Migración Completada: Solo Node.js

El sistema ahora usa **exclusivamente Node.js** para todas las conexiones con la base de datos PostgreSQL. Se han eliminado todos los archivos PHP para evitar conflictos.

---

## 📋 Requisitos

- **Node.js** v18 o superior
- **PostgreSQL** (Supabase)
- Paquete npm: `postgres`

---

## 🔧 Configuración

### 1. Variables de Entorno

Archivo `Config.env` en la raíz del proyecto:
```env
DATABASE_URL=postgresql://postgres.ocoblumeyursvefwrgjo:Proyecto_csu@aws-1-us-east-2.pooler.supabase.com:5432/postgres
```

### 2. Instalación de Dependencias

```bash
cd "Proyecto de Software CSU - COLSOF"
npm install
```

---

## 🚀 Inicio del Servidor

### Opción 1: Usar el archivo batch (Windows)
```bash
.\iniciar-servidor.bat
```

### Opción 2: Comando directo
```bash
cd "Proyecto de Software CSU - COLSOF"
node "Usuario GESTOR/api-server.js"
```

El servidor se iniciará en: **http://localhost:3001**

---

## 📡 Endpoints Disponibles

Base URL: `http://localhost:3001/api`

### Principales:
- `?action=get_casos_simple` - Obtiene casos desde `public.casos` (✅ Recomendado)
- `?action=get_cases_list` - Obtiene casos desde `base_de_datos_csu.ticket`
- `?action=get_dashboard_stats` - Estadísticas del dashboard
- `?action=save_case` - Guardar nuevo caso (POST)
- `?action=get_next_id` - Obtener siguiente ID
- `?action=get_notifications` - Obtener notificaciones
- `?action=get_recent_reports` - Reportes recientes
- `?action=get_estadisticas_avanzadas` - Estadísticas avanzadas

---

## 🗂️ Estructura de Archivos

```
Proyecto de Software CSU - COLSOF/
├── Usuario GESTOR/
│   ├── api-server.js          # 🟢 Servidor API Node.js (PRINCIPAL)
│   ├── script.js              # JavaScript del frontend
│   └── Estilos.css            # Estilos
├── Menu principal.html        # Página principal
├── test-api.html             # Página de prueba de API
├── test-conexion.mjs         # Script de validación de conexión
└── check-structure.mjs       # Script de análisis de BD

Config.env                     # Variables de entorno
iniciar-servidor.bat          # Script de inicio rápido
```

---

## 🗑️ Archivos PHP Eliminados

Los siguientes archivos fueron removidos para evitar conflictos:
- ❌ `conexion.php`
- ❌ `Usuario GESTOR/api.php`
- ❌ `test-conexion.php`
- ❌ `test_api_cases.php`

**Todo ahora funciona exclusivamente con Node.js** 🎉

---

## 🧪 Pruebas

### Validar Conexión a la Base de Datos:
```bash
cd "Proyecto de Software CSU - COLSOF"
node test-conexion.mjs
```

### Analizar Estructura de la BD:
```bash
node check-structure.mjs
```

### Probar API desde el navegador:
Abre: `test-api.html` en tu navegador

---

## 📊 Base de Datos

### Esquemas:
- **public** - Contiene la tabla `casos` (4 registros)
- **base_de_datos_csu** - Esquema completo con tablas relacionadas

### Tabla Principal: `public.casos`
```sql
SELECT id, cliente, estado, prioridad, asignado_a, fecha_creacion
FROM public.casos
ORDER BY fecha_creacion DESC;
```

---

## 🔧 Solución de Problemas

### El servidor no inicia:
```bash
# Verificar que Node.js esté instalado
node --version

# Verificar que las dependencias estén instaladas
npm list postgres
```

### Error de conexión a la base de datos:
```bash
# Validar el archivo Config.env
cat Config.env

# Probar conexión
node test-conexion.mjs
```

### Puerto 3001 ya en uso:
```bash
# Detener procesos Node.js
taskkill /F /IM node.exe

# O cambiar el puerto en api-server.js (línea ~524)
```

---

## 🌐 Uso del Sistema

1. **Iniciar el servidor API:**
   ```bash
   .\iniciar-servidor.bat
   ```

2. **Abrir la aplicación:**
   - Abre `Menu principal.html` en tu navegador
   - O accede desde un servidor HTTP local

3. **La tabla de casos se cargará automáticamente** desde la base de datos PostgreSQL

---

## 📝 Notas Importantes

- ✅ **Solo Node.js**: No se requiere PHP ni Apache
- ✅ **CORS habilitado**: Permite acceso desde cualquier origen
- ✅ **Conexión directa**: PostgreSQL via el paquete `postgres`
- ✅ **Variables de entorno**: Configuración centralizada en `Config.env`

---

## 👥 Soporte

Para problemas o consultas:
- Revisar la consola del servidor para errores
- Verificar la consola del navegador (F12)
- Validar que el servidor esté corriendo en el puerto 3001

---

## 📅 Última Actualización

23 de enero de 2026 - Migración completa a Node.js
