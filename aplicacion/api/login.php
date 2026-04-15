<?php
header("Content-Type: application/json");
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include '../../infraestructura/BD/conexion.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents("php://input"), true);
    
    $usuario = $conn->real_escape_string($input['usuario'] ?? '');
    $password = $input['password'] ?? '';
    
    $sql = "SELECT * FROM usuario WHERE usuario = '$usuario' AND estado = 'Activo'";
    $res = $conn->query($sql);
    
    if ($res && $res->num_rows > 0) {
        $user = $res->fetch_assoc();
        
        if ($password === $user['password']) {
            echo json_encode([
                'success' => true,
                'user' => [
                    'id' => $user['id'],
                    'usuario' => $user['usuario'],
                    'nombre' => $user['nombre'],
                    'email' => $user['email'],
                    'rol' => $user['rol'],
                    'area' => $user['area'],
                    'permisos' => json_decode($user['permisos'] ?? '[]', true)
                ],
                'message' => 'Autenticación exitosa'
            ]);
        } else {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Contraseña incorrecta']);
        }
    } else {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
    }
}

$conn->close();
?>