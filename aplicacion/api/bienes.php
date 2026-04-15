<?php
header("Content-Type: application/json");
include '../../infraestructura/BD/conexion.php';

$method = $_SERVER['REQUEST_METHOD'];


// 🔹 LISTAR BIENES
if ($method === 'GET') {

    $res = $conn->query("SELECT b.*, p.nombre as persona 
                         FROM bien b 
                         LEFT JOIN persona p ON b.persona_id = p.id");

    $data = [];

    while ($row = $res->fetch_assoc()) {
        $data[] = $row;
    }

    echo json_encode($data);
}


// 🔹 CREAR BIEN
if ($method === 'POST') {

    $input = json_decode(file_get_contents("php://input"), true);

    $codigo = $input['cod_patrimonial'];
    $nombre = $input['nombre'];
    $descripcion = $input['descripcion'];
    $estado = $input['estado'];
    $persona = $input['persona_id'];

    $sql = "INSERT INTO bien (codigo_patrimonial,nombre,descripcion,estado,persona_id)
            VALUES ('$codigo','$nombre','$descripcion','$estado','$persona')";

    if ($conn->query($sql)) {
        echo json_encode(["message" => "Bien creado"]);
    } else {
        echo json_encode(["message" => $conn->error]);
    }
}
?>