<?php
/**
 * =====================================================
 * CONEXIÓN A BASE DE DATOS
 * =====================================================
 */

$host = 'localhost';
$user = 'root';           // ← CORREGIDO: era $usuario
$pass = '';               // ← CORREGIDO: era $password (vacío en XAMPP)
$db = 'patrimonio';       // ← CORREGIDO: era $base_datos

$conn = new mysqli($host, $user, $pass, $db);

// Verificar conexión
if ($conn->connect_error) {
    die(json_encode(['error' => 'Error de conexión: ' . $conn->connect_error]));
}

// Establecer charset
$conn->set_charset('utf8mb4');

// No cerrar aquí, se cierra en cada archivo API
?>