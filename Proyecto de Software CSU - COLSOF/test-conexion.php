<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Prueba de Conexión - Base de Datos</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: #f6f7fb;
        }
        .card {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 2px 12px rgba(0,0,0,0.1);
        }
        h1 {
            color: #15467b;
            margin-bottom: 20px;
        }
        .success {
            color: #22c55e;
            padding: 15px;
            background: #f0fdf4;
            border-left: 4px solid #22c55e;
            border-radius: 6px;
            margin: 15px 0;
        }
        .error {
            color: #dc2626;
            padding: 15px;
            background: #fef2f2;
            border-left: 4px solid #dc2626;
            border-radius: 6px;
            margin: 15px 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ebedf2;
        }
        th {
            background: #f6f7fb;
            font-weight: 600;
            color: #15467b;
        }
        .btn {
            background: #15467b;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            margin-top: 20px;
        }
        .btn:hover {
            background: #0f3f86;
        }
    </style>
</head>
<body>
    <div class="card">
        <h1>🔍 Prueba de Conexión a Base de Datos</h1>
        
        <?php
        require_once 'conexion.php';
        
        echo '<div class="success">✅ Conexión exitosa a la base de datos PostgreSQL</div>';
        
        // Probar consulta
        $result = pg_query($conn, "SELECT * FROM casos ORDER BY fecha_creacion DESC LIMIT 5");
        
        if ($result) {
            $count = pg_num_rows($result);
            echo "<p><strong>📊 Casos encontrados:</strong> $count</p>";
            
            if ($count > 0) {
                echo '<table>';
                echo '<tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Categoría</th>
                    <th>Prioridad</th>
                    <th>Estado</th>
                    <th>Fecha Creación</th>
                </tr>';
                
                while ($row = pg_fetch_assoc($result)) {
                    echo '<tr>';
                    echo '<td>' . htmlspecialchars($row['id']) . '</td>';
                    echo '<td>' . htmlspecialchars($row['cliente']) . '</td>';
                    echo '<td>' . htmlspecialchars($row['categoria']) . '</td>';
                    echo '<td>' . htmlspecialchars($row['prioridad']) . '</td>';
                    echo '<td>' . htmlspecialchars($row['estado']) . '</td>';
                    echo '<td>' . htmlspecialchars($row['fecha_creacion']) . '</td>';
                    echo '</tr>';
                }
                
                echo '</table>';
            }
        } else {
            echo '<div class="error">❌ Error al consultar casos: ' . pg_last_error($conn) . '</div>';
        }
        
        // Probar estructura de la tabla
        $tableInfo = pg_query($conn, "
            SELECT column_name, data_type, character_maximum_length 
            FROM information_schema.columns 
            WHERE table_name = 'casos' 
            ORDER BY ordinal_position
        ");
        
        if ($tableInfo && pg_num_rows($tableInfo) > 0) {
            echo '<h2>📋 Estructura de la tabla casos:</h2>';
            echo '<table>';
            echo '<tr><th>Campo</th><th>Tipo</th><th>Longitud</th></tr>';
            
            while ($col = pg_fetch_assoc($tableInfo)) {
                echo '<tr>';
                echo '<td>' . htmlspecialchars($col['column_name']) . '</td>';
                echo '<td>' . htmlspecialchars($col['data_type']) . '</td>';
                echo '<td>' . ($col['character_maximum_length'] ?? 'N/A') . '</td>';
                echo '</tr>';
            }
            
            echo '</table>';
        }
        
        pg_close($conn);
        ?>
        
        <button class="btn" onclick="window.location.href='Usuario GESTOR/Creacion de Casos.html'">
            ▶️ Ir a Creación de Casos
        </button>
    </div>
</body>
</html>
