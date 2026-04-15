<?php
/**
 * =====================================================
 * RECUPERAR.PHP - Recuperación de contraseña
 * =====================================================
 */

header("Content-Type: application/json");
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

include '../../infraestructura/BD/conexion.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents("php://input"), true);
    $email = $conn->real_escape_string($input['email'] ?? '');
    
    // Verificar si el email existe
    $sql = "SELECT * FROM usuario WHERE email = '$email' AND estado = 'Activo'";
    $res = $conn->query($sql);
    
    if ($res->num_rows > 0) {
        $user = $res->fetch_assoc();
        
        // Generar token de recuperación
        $token = bin2hex(random_bytes(32));
        $expiracion = date('Y-m-d H:i:s', strtotime('+1 hour'));
        
        $conn->query("UPDATE usuario SET 
            token_recuperacion = '$token',
            token_expiracion = '$expiracion'
            WHERE id = " . $user['id']);
        
        // En producción: enviar email con el token
        // mail($email, "Recuperación de contraseña", "Su token: $token");
        
        echo json_encode([
            'success' => true,
            'message' => 'Se ha enviado un enlace de recuperación a su correo'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'El correo no está registrado'
        ]);
    }
}

$conn->close();
?>