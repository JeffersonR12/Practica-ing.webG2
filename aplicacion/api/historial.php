<?php
/**
 * =====================================================
 * HISTORIAL.PHP - Consulta de historial de movimientos
 * =====================================================
 * 
 * GET /historial.php?bien_id={id}
 * GET /historial.php?persona_id={id}
 */

header("Content-Type: application/json");
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

include '../../infraestructura/BD/conexion.php';

$bien_id = $_GET['bien_id'] ?? null;
$persona_id = $_GET['persona_id'] ?? null;

if ($bien_id) {
    // Historial de un bien específico
    $sql = "SELECT 
                h.id,
                h.fecha,
                h.accion,
                h.observacion,
                h.bien_id,
                b.codigo_patrimonial,
                b.nombre as bien_nombre,
                p_ant.nombre as persona_anterior,
                p_nue.nombre as persona_nueva,
                d.numero as numero_desplazamiento,
                d.motivo
            FROM historial_bien h
            JOIN bien b ON h.bien_id = b.id
            LEFT JOIN persona p_ant ON h.persona_id_anterior = p_ant.id
            LEFT JOIN persona p_nue ON h.persona_id_nueva = p_nue.id
            LEFT JOIN desplazamiento d ON h.desplazamiento_id = d.id
            WHERE h.bien_id = $bien_id
            ORDER BY h.fecha DESC";
    
    $res = $conn->query($sql);
    $data = [];
    
    while ($row = $res->fetch_assoc()) {
        $data[] = $row;
    }
    
    echo json_encode($data);
    
} elseif ($persona_id) {
    // Historial de movimientos relacionados a una persona
    $sql = "SELECT 
                h.id,
                h.fecha,
                h.accion,
                h.observacion,
                b.codigo_patrimonial,
                b.nombre as bien_nombre,
                p_ant.nombre as persona_anterior,
                p_nue.nombre as persona_nueva
            FROM historial_bien h
            JOIN bien b ON h.bien_id = b.id
            LEFT JOIN persona p_ant ON h.persona_id_anterior = p_ant.id
            LEFT JOIN persona p_nue ON h.persona_id_nueva = p_nue.id
            WHERE h.persona_id_anterior = $persona_id 
               OR h.persona_id_nueva = $persona_id
            ORDER BY h.fecha DESC";
    
    $res = $conn->query($sql);
    $data = [];
    
    while ($row = $res->fetch_assoc()) {
        $data[] = $row;
    }
    
    echo json_encode($data);
    
} else {
    echo json_encode([
        "error" => "Debe especificar bien_id o persona_id"
    ]);
}

$conn->close();
?>