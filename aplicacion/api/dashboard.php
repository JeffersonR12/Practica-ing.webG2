<?php
/**
 * =====================================================
 * DASHBOARD.PHP - Estadísticas para el panel principal
 * =====================================================
 */

header("Content-Type: application/json");
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

include '../../infraestructura/BD/conexion.php';

// Totales principales
$total_bienes = $conn->query("SELECT COUNT(*) as total FROM bien")->fetch_assoc()['total'];
$total_personas = $conn->query("SELECT COUNT(*) as total FROM persona WHERE estado = 'Activo'")->fetch_assoc()['total'];

$hoy = date('Y-m-d');
$desplazamientos_hoy = $conn->query("SELECT COUNT(*) as total FROM desplazamiento WHERE DATE(fecha) = '$hoy'")->fetch_assoc()['total'];

$mes_actual = date('Y-m');
$desplazamientos_mes = $conn->query("SELECT COUNT(*) as total FROM desplazamiento WHERE DATE_FORMAT(fecha, '%Y-%m') = '$mes_actual'")->fetch_assoc()['total'];

// Bienes por estado
$bienes_por_estado = [];
$res_estados = $conn->query("SELECT estado, COUNT(*) as cantidad FROM bien GROUP BY estado");
while ($row = $res_estados->fetch_assoc()) {
    $bienes_por_estado[$row['estado']] = (int)$row['cantidad'];
}

// Bienes por área (a través de persona)
$bienes_por_area = [];
$res_areas = $conn->query("
    SELECT p.area, COUNT(*) as cantidad 
    FROM bien b 
    JOIN persona p ON b.persona_id = p.id 
    WHERE p.area IS NOT NULL 
    GROUP BY p.area
");
while ($row = $res_areas->fetch_assoc()) {
    $bienes_por_area[] = [
        'area' => $row['area'],
        'cantidad' => (int)$row['cantidad']
    ];
}

// Últimos desplazamientos
$ultimos_desplazamientos = [];
$res_desp = $conn->query("
    SELECT 
        d.id,
        d.numero,
        d.fecha,
        d.motivo,
        p_orig.nombre as persona_origen,
        p_dest.nombre as persona_destino,
        COUNT(dd.bien_id) as cantidad_bienes
    FROM desplazamiento d
    JOIN persona p_orig ON d.persona_origen_id = p_orig.id
    JOIN persona p_dest ON d.persona_destino_id = p_dest.id
    LEFT JOIN detalle_desplazamiento dd ON d.id = dd.desplazamiento_id
    GROUP BY d.id
    ORDER BY d.fecha DESC
    LIMIT 5
");
while ($row = $res_desp->fetch_assoc()) {
    $ultimos_desplazamientos[] = $row;
}

// Bienes sin asignar
$bienes_sin_asignar = [];
$res_sin = $conn->query("
    SELECT id, codigo_patrimonial, nombre, estado 
    FROM bien 
    WHERE persona_id IS NULL 
    LIMIT 5
");
while ($row = $res_sin->fetch_assoc()) {
    $bienes_sin_asignar[] = $row;
}

// Respuesta completa
echo json_encode([
    'total_bienes' => (int)$total_bienes,
    'total_personas' => (int)$total_personas,
    'desplazamientos_hoy' => (int)$desplazamientos_hoy,
    'desplazamientos_mes' => (int)$desplazamientos_mes,
    'bienes_por_estado' => $bienes_por_estado,
    'bienes_por_area' => $bienes_por_area,
    'ultimos_desplazamientos' => $ultimos_desplazamientos,
    'bienes_sin_asignar' => $bienes_sin_asignar
]);

$conn->close();
?>