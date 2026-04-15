<?php
header("Content-Type: application/json");
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

include '../../infraestructura/BD/conexion.php';

$method = $_SERVER['REQUEST_METHOD'];

// 🔹 LISTAR PERSONAS
if ($method === 'GET') {
    $estado = $_GET['estado'] ?? 'Activo';
    
    $sql = "SELECT * FROM persona";
    if ($estado) {
        $sql .= " WHERE estado = '$estado'";
    }
    $sql .= " ORDER BY nombre";
    
    $res = $conn->query($sql);
    $data = [];
    
    while ($row = $res->fetch_assoc()) {
        $data[] = $row;
    }
    
    echo json_encode($data);
}

// 🔹 CREAR PERSONA
if ($method === 'POST') {
    $input = json_decode(file_get_contents("php://input"), true);
    
    $nombre = $conn->real_escape_string($input['nombre'] ?? '');
    $area = $conn->real_escape_string($input['area'] ?? '');
    $cargo = $conn->real_escape_string($input['cargo'] ?? '');
    $email = $conn->real_escape_string($input['email'] ?? '');
    $telefono = $conn->real_escape_string($input['telefono'] ?? '');
    
    $sql = "INSERT INTO persona (nombre, area, cargo, email, telefono, estado)
            VALUES ('$nombre', '$area', '$cargo', '$email', '$telefono', 'Activo')";
    
    if ($conn->query($sql)) {
        echo json_encode([
            "success" => true,
            "message" => "Persona creada exitosamente",
            "id" => $conn->insert_id
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Error: " . $conn->error
        ]);
    }
}

$conn->close();
?>