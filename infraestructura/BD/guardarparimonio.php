<?php
include 'conexion.php';

// Verificar si es una petición POST
if ($_SERVER["REQUEST_METHOD"] == "POST") {

    $codigo      = $_POST['codigo'];
    $nombre      = $_POST['nombre'];
    $descripcion = $_POST['descripcion'];
    $estado      = $_POST['estado'];
    $persona     = $_POST['persona'];

    // Consulta SQL
    $sql = "INSERT INTO bien 
            (codigo_patrimonial, nombre, descripcion, estado, persona_id) 
            VALUES 
            ('$codigo', '$nombre', '$descripcion', '$estado', '$persona')";

    // Ejecutar
    if (mysqli_query($conexion, $sql)) {
        echo "Bien registrado correctamente";
    } else {
        echo "Error: " . mysqli_error($conexion);
    }
}

// Cerrar conexión
mysqli_close($conexion);
?>