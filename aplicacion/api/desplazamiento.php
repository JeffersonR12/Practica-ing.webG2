<?php
/**
 * =====================================================
 * DESPLAZAMIENTO.PHP - CORREGIDO
 * =====================================================
 */

header("Content-Type: application/json");
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Para solicitudes OPTIONS (CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include '../../infraestructura/BD/conexion.php';

$method = $_SERVER['REQUEST_METHOD'];

// =============================================
// GET - Listar desplazamientos
// =============================================
if ($method === 'GET') {
    $sql = "SELECT 
                d.id,
                d.numero,
                d.fecha,
                d.motivo,
                d.observacion,
                d.persona_origen_id,
                d.persona_destino_id,
                po.nombre as persona_origen,
                pd.nombre as persona_destino,
                COUNT(dd.id) as cantidad_bienes
            FROM desplazamiento d
            LEFT JOIN persona po ON d.persona_origen_id = po.id
            LEFT JOIN persona pd ON d.persona_destino_id = pd.id
            LEFT JOIN detalle_desplazamiento dd ON d.id = dd.desplazamiento_id
            GROUP BY d.id
            ORDER BY d.fecha DESC";
    
    $res = $conn->query($sql);
    
    if ($res) {
        $data = [];
        while ($row = $res->fetch_assoc()) {
            $data[] = $row;
        }
        echo json_encode($data);
    } else {
        echo json_encode([
            'error' => 'Error en la consulta: ' . $conn->error
        ]);
    }
    exit;
}

// =============================================
// POST - Crear desplazamiento
// =============================================
if ($method === 'POST') {
    $input = json_decode(file_get_contents("php://input"), true);
    
    $motivo = $conn->real_escape_string($input['motivo'] ?? '');
    $persona_origen = intval($input['persona_origen'] ?? 0);
    $persona_destino = intval($input['persona_destino'] ?? 0);
    $bienes = $input['bienes'] ?? [];
    $observacion = $conn->real_escape_string($input['observacion'] ?? '');
    
    // Validaciones
    if (empty($motivo) || !$persona_origen || !$persona_destino || empty($bienes)) {
        echo json_encode([
            "success" => false,
            "message" => "Faltan datos requeridos"
        ]);
        exit;
    }
    
    if ($persona_origen === $persona_destino) {
        echo json_encode([
            "success" => false,
            "message" => "La persona origen y destino deben ser diferentes"
        ]);
        exit;
    }

    // Generar número único
    $numero = "DESP-" . date('Ymd') . "-" . rand(100, 999);

    // Insertar desplazamiento
    $sql = "INSERT INTO desplazamiento (numero, persona_origen_id, persona_destino_id, motivo, observacion, fecha)
            VALUES ('$numero', $persona_origen, $persona_destino, '$motivo', '$observacion', NOW())";

    if ($conn->query($sql)) {
        $desplazamiento_id = $conn->insert_id;
        $bienes_procesados = 0;
        
        foreach ($bienes as $bien_id) {
            $bien_id = intval($bien_id);
            
            // Obtener persona actual del bien
            $res_bien = $conn->query("SELECT persona_id FROM bien WHERE id = $bien_id");
            $bien = $res_bien->fetch_assoc();
            $persona_anterior = $bien['persona_id'] ?? null;
            
            // Actualizar bien
            $conn->query("UPDATE bien SET persona_id = $persona_destino WHERE id = $bien_id");
            
            // Insertar detalle
            $conn->query("INSERT INTO detalle_desplazamiento 
                (desplazamiento_id, bien_id, persona_origen, persona_destino)
                VALUES ($desplazamiento_id, $bien_id, $persona_origen, $persona_destino)");
            
            // Insertar historial
            $conn->query("INSERT INTO historial_bien 
                (bien_id, persona_id_anterior, persona_id_nueva, desplazamiento_id, fecha, accion, observacion)
                VALUES ($bien_id, " . ($persona_anterior ? $persona_anterior : 'NULL') . ", $persona_destino, $desplazamiento_id, NOW(), 'TRANSFERENCIA', '$motivo')");
            
            $bienes_procesados++;
        }
        
        echo json_encode([
            "success" => true,
            "message" => "Desplazamiento realizado exitosamente",
            "numero" => $numero,
            "bienes_procesados" => $bienes_procesados
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Error: " . $conn->error
        ]);
    }
    exit;
}

// Si no es GET ni POST
echo json_encode(['error' => 'Método no permitido']);
$conn->close();
?>