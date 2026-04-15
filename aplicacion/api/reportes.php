<?php
/**
 * =====================================================
 * REPORTES.PHP - Generación de reportes PDF
 * =====================================================
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

include '../../infraestructura/BD/conexion.php';

$tipo = $_GET['tipo'] ?? '';

if ($tipo === 'asignacion') {
    $persona_id = $_GET['persona_id'] ?? null;
    
    if ($persona_id) {
        // Obtener datos de la persona
        $persona = $conn->query("SELECT * FROM persona WHERE id = $persona_id")->fetch_assoc();
        
        // Obtener bienes asignados
        $bienes = [];
        $res = $conn->query("SELECT * FROM bien WHERE persona_id = $persona_id");
        while ($row = $res->fetch_assoc()) {
            $bienes[] = $row;
        }
        
        // Por ahora, devolver JSON (luego se puede generar PDF con TCPDF)
        header("Content-Type: application/json");
        echo json_encode([
            'persona' => $persona,
            'bienes' => $bienes,
            'total' => count($bienes)
        ]);
    }
    
} elseif ($tipo === 'desplazamiento') {
    $fecha_desde = $_GET['fecha_desde'] ?? date('Y-m-01');
    $fecha_hasta = $_GET['fecha_hasta'] ?? date('Y-m-t');
    $motivo = $_GET['motivo'] ?? '';
    
    $sql = "SELECT d.*, 
                   p_orig.nombre as persona_origen,
                   p_dest.nombre as persona_destino,
                   COUNT(dd.bien_id) as cantidad_bienes
            FROM desplazamiento d
            JOIN persona p_orig ON d.persona_origen_id = p_orig.id
            JOIN persona p_dest ON d.persona_destino_id = p_dest.id
            LEFT JOIN detalle_desplazamiento dd ON d.id = dd.desplazamiento_id
            WHERE DATE(d.fecha) BETWEEN '$fecha_desde' AND '$fecha_hasta'";
    
    if ($motivo) {
        $sql .= " AND d.motivo = '$motivo'";
    }
    
    $sql .= " GROUP BY d.id ORDER BY d.fecha DESC";
    
    $res = $conn->query($sql);
    $desplazamientos = [];
    while ($row = $res->fetch_assoc()) {
        $desplazamientos[] = $row;
    }
    
    header("Content-Type: application/json");
    echo json_encode($desplazamientos);
    
} else {
    header("Content-Type: application/json");
    echo json_encode(['error' => 'Tipo de reporte no especificado']);
}

$conn->close();
?>