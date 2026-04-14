<?php
header("Content-Type: application/json");
include '../../infraestructura/BD/conexion.php';

$res = $conn->query("SELECT * FROM persona");

$data = [];

while ($row = $res->fetch_assoc()) {
    $data[] = $row;
}

echo json_encode($data);
?>