<?php
// Diagnostico rapido de conexion PostgreSQL
// Usa DATABASE_URL del entorno o lee Config.env en el root (../Config.env)

function loadEnvUrl(): ?string {
    $envUrl = getenv('DATABASE_URL');
    if ($envUrl) return $envUrl;
    $configPath = __DIR__ . '/../Config.env';
    if (!file_exists($configPath)) return null;
    $contents = file_get_contents($configPath);
    if ($contents === false) return null;
    if (preg_match('/DATABASE_URL\s*=\s*"([^"]+)"/', $contents, $m)) {
        return $m[1];
    }
    if (preg_match('/DATABASE_URL\s*=\s*(\S+)/', $contents, $m)) {
        return $m[1];
    }
    return null;
}

$url = loadEnvUrl();
if (!$url) {
    http_response_code(500);
    echo "DATABASE_URL no encontrado (setea env o Config.env)";
    exit;
}

$parts = parse_url($url);
if (!$parts || !isset($parts['scheme'], $parts['host'], $parts['path'])) {
    http_response_code(500);
    echo "DATABASE_URL invalido";
    exit;
}

$host = $parts['host'];
$port = $parts['port'] ?? 5432;
$user = $parts['user'] ?? '';
$pass = $parts['pass'] ?? '';
$db   = ltrim($parts['path'], '/');
$ssl  = true; // Supabase necesita SSL

$dsn = "pgsql:host={$host};port={$port};dbname={$db};" . ($ssl ? "sslmode=require" : "sslmode=prefer");

try {
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_TIMEOUT => 5,
    ]);

    $row = $pdo->query('select current_user, current_database(), now() as now')->fetch();
    $sample = $pdo->query('select id, estado, prioridad, fecha_creacion from casos order by fecha_creacion desc limit 5')->fetchAll();

    header('Content-Type: application/json');
    echo json_encode([
        'ok' => true,
        'user' => $row['current_user'] ?? null,
        'database' => $row['current_database'] ?? null,
        'now' => $row['now'] ?? null,
        'sample_casos' => $sample,
    ], JSON_PRETTY_PRINT);
} catch (Exception $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'ok' => false,
        'error' => $e->getMessage(),
    ], JSON_PRETTY_PRINT);
}
