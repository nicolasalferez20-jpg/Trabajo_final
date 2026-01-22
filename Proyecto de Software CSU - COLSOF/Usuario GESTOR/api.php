<?php
header('Content-Type: application/json');

// Ajusta la ruta si conexion.php está en una carpeta diferente
require_once '../conexion.php';

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'get_next_id':
        // Obtener el siguiente ID para un caso (simulado con MAX id + 1 o un conteo)
        $result = pg_query($conn, "SELECT MAX(CAST(SUBSTRING(id, 4) AS INTEGER)) as max_num FROM casos WHERE id LIKE '030%'");
        $row = pg_fetch_assoc($result);
        $nextNum = ($row && $row['max_num']) ? intval($row['max_num']) + 1 : 1;
        $nextId = '030' . str_pad($nextNum, 6, '0', STR_PAD_LEFT);
        echo json_encode(['new_id' => $nextId]);
        break;

    case 'get_dashboard_stats':
        // Obtener estadísticas reales para Reportes
        $stats = [
            'reportes_generados' => 0,
            'descargas' => 0,
            'usuarios_activos' => 0,
            'total_casos' => 0,
            'resueltos' => 0,
            'pendientes' => 0
        ];

        // Contar casos totales
        $res = pg_query($conn, "SELECT COUNT(*) as total FROM casos");
        if ($res) {
            $row = pg_fetch_assoc($res);
            $stats['reportes_generados'] = $row['total'];
            $stats['total_casos'] = $row['total'];
            $stats['pendientes'] = $row['total']; 
        }

        echo json_encode($stats);
        break;

    case 'save_case':
        // Guardar un nuevo caso
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Validar y limpiar los datos antes de insertar
            $cliente = pg_escape_string($conn, $data['cliente'] ?? '');
            $sede = pg_escape_string($conn, $data['sede'] ?? '');
            $contacto = pg_escape_string($conn, $data['contacto'] ?? '');
            $correo = pg_escape_string($conn, $data['correo'] ?? '');
            $telefono = pg_escape_string($conn, $data['telefono'] ?? '');
            $contacto2 = pg_escape_string($conn, $data['contacto2'] ?? '');
            $correo2 = pg_escape_string($conn, $data['correo2'] ?? '');
            $telefono2 = pg_escape_string($conn, $data['telefono2'] ?? '');
            $centro_costos = pg_escape_string($conn, $data['centro_costos'] ?? '');
            
            $serial = pg_escape_string($conn, $data['serial'] ?? '');
            $marca = pg_escape_string($conn, $data['marca'] ?? '');
            $tipo = pg_escape_string($conn, $data['tipo'] ?? '');
            $categoria = pg_escape_string($conn, $data['categoria'] ?? '');
            $descripcion = pg_escape_string($conn, $data['descripcion'] ?? '');
            
            $asignado = pg_escape_string($conn, $data['asignado'] ?? '');
            $prioridad = pg_escape_string($conn, $data['prioridad'] ?? '');
            $estado = $data['estado'] ?? 'Activo';
            $autor = pg_escape_string($conn, $data['autor'] ?? 'Juan Pérez');

            // Generar ID del caso
            $result = pg_query($conn, "SELECT MAX(CAST(SUBSTRING(id, 4) AS INTEGER)) as max_num FROM casos WHERE id LIKE '030%'");
            $row = pg_fetch_assoc($result);
            $nextNum = ($row && $row['max_num']) ? intval($row['max_num']) + 1 : 1;
            $caseId = '030' . str_pad($nextNum, 6, '0', STR_PAD_LEFT);

            $sql = "INSERT INTO casos (
                id, cliente, sede, contacto, correo, telefono, contacto2, correo2, telefono2, 
                centro_costos, serial, marca, tipo, categoria, descripcion, 
                asignado_a, prioridad, estado, autor, fecha_creacion
            ) VALUES (
                '$caseId', '$cliente', '$sede', '$contacto', '$correo', '$telefono', '$contacto2', '$correo2', '$telefono2',
                '$centro_costos', '$serial', '$marca', '$tipo', '$categoria', '$descripcion',
                '$asignado', '$prioridad', '$estado', '$autor', NOW()
            )";

            if (pg_query($conn, $sql)) {
                echo json_encode(['success' => true, 'message' => 'Caso creado correctamente', 'case_id' => $caseId]);
            } else {
                echo json_encode(['success' => false, 'error' => pg_last_error($conn)]);
            }
        }
        break;

    case 'get_recent_reports':
        // Obtener lista de últimos casos/reportes
        $result = pg_query($conn, "SELECT id, cliente, categoria, fecha_creacion FROM casos ORDER BY fecha_creacion DESC LIMIT 5");
        $reports = [];
        while($row = pg_fetch_assoc($result)) {
            $reports[] = $row;
        }
        echo json_encode($reports);
        break;

    case 'get_cases_list':
        // Obtener todos los casos para la tabla principal
        $result = pg_query($conn, "SELECT id, fecha_creacion, asignado_a, prioridad, categoria, cliente FROM casos ORDER BY fecha_creacion DESC");
        $cases = [];
        if ($result) {
            while($row = pg_fetch_assoc($result)) {
                $cases[] = $row;
            }
        }
        echo json_encode($cases);
        break;

    case 'get_notifications':
        // Generar notificaciones basadas en los casos recientes
        $result = pg_query($conn, "SELECT id, cliente, categoria, prioridad, fecha_creacion FROM casos ORDER BY fecha_creacion DESC LIMIT 10");
        $notifs = [];
        
        if ($result) {
            while($row = pg_fetch_assoc($result)) {
                // Determinar tipo de notificación según prioridad
                $tipo = (strtolower($row['prioridad']) === 'alta' || strtolower($row['prioridad']) === 'critico') ? 'urgente' : 'sistema';
                
                $notifs[] = [
                    'id' => $row['id'],
                    'titulo' => "Nuevo caso: " . $row['cliente'],
                    'mensaje' => "Se ha registrado un caso de categoría " . $row['categoria'] . " con prioridad " . $row['prioridad'],
                    'fecha' => $row['fecha_creacion'],
                    'tipo' => $tipo,
                    'leido' => false 
                ];
            }
        }
        echo json_encode($notifs);
        break;

    default:
        echo json_encode(['error' => 'Acción no válida']);
        break;
}
pg_close($conn);
?>