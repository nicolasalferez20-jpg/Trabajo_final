<?php
// Leer variables de entorno del archivo Config.env
$configPath = __DIR__ . '/../Config.env';
if (file_exists($configPath)) {
    $lines = file($configPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
            list($key, $value) = explode('=', $line, 2);
            putenv(trim($key) . '=' . trim($value));
        }
    }
}

// Obtener la URL de la base de datos
$databaseUrl = getenv('DATABASE_URL');

if (!$databaseUrl) {
    die("Error: DATABASE_URL no está configurada en Config.env");
}

// Parsear la URL de PostgreSQL
// Formato: postgresql://user:password@host:port/database
$urlParts = parse_url($databaseUrl);

$host = $urlParts['host'] ?? 'localhost';
$port = $urlParts['port'] ?? 5432;
$database = ltrim($urlParts['path'], '/');
$user = $urlParts['user'] ?? '';
$password = $urlParts['pass'] ?? '';

// Crear la conexión a PostgreSQL
$conn = pg_connect("host=$host port=$port dbname=$database user=$user password=$password");

// Verificar si hay errores en la conexión
if (!$conn) {
    die("Error de conexión a PostgreSQL: " . pg_last_error());
}

// Establecer codificación de caracteres a UTF-8
pg_set_client_encoding($conn, "UTF8");
?>