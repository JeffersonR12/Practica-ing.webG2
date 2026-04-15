<?php
/**
 * =====================================================
 * LOGOUT.PHP - Cierre de sesión
 * =====================================================
 */

header("Content-Type: application/json");
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Iniciar sesión si se usa PHP Session
session_start();
session_destroy();

echo json_encode([
    'success' => true,
    'message' => 'Sesión cerrada correctamente'
]);
?>