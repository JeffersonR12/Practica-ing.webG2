<?php
header("Content-Type: application/json");
include '../../infraestructura/BD/conexion.php';

$input = json_decode(file_get_contents("php://input"), true);

$motivo = $input['motivo'];
$persona_origen = $input['persona_origen'];
$persona_destino = $input['persona_destino'];
$bienes = $input['bienes'];

$numero = "DESP-" . rand(1000,9999);

$conn->query("INSERT INTO desplazamiento (numero,motivo,fecha)
VALUES ('$numero','$motivo',NOW())");

$desplazamiento_id = $conn->insert_id;

foreach ($bienes as $bien_id) {

    // actualizar bien
    $conn->query("UPDATE bien SET persona_id=$persona_destino WHERE id=$bien_id");

    // detalle
    $conn->query("INSERT INTO detalle_desplazamiento 
    (desplazamiento_id,bien_id,persona_origen,persona_destino)
    VALUES ($desplazamiento_id,$bien_id,$persona_origen,$persona_destino)");

    // historial
    $conn->query("INSERT INTO historial_bien 
    (bien_id,persona_id,fecha,accion)
    VALUES ($bien_id,$persona_destino,NOW(),'TRANSFERENCIA')");
}

echo json_encode(["message" => "ok"]);
?>