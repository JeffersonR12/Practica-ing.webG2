<?php
/**
 * =====================================================
 * BIENES.PHP - CON IMPORTACIÓN EXCEL
 * =====================================================
 */

header("Content-Type: application/json");
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

include '../../infraestructura/BD/conexion.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// =============================================
// IMPORTAR EXCEL
// =============================================
if ($method === 'POST' && $action === 'importar') {
    
    // Verificar si se subió un archivo
    if (!isset($_FILES['excel_file']) || $_FILES['excel_file']['error'] !== UPLOAD_ERR_OK) {
        echo json_encode([
            'success' => false,
            'message' => 'No se recibió ningún archivo o hubo un error en la carga'
        ]);
        exit;
    }
    
    $archivo = $_FILES['excel_file'];
    
    // Validar extensión
    $extension = pathinfo($archivo['name'], PATHINFO_EXTENSION);
    if (!in_array($extension, ['xlsx', 'xls', 'csv'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Formato no soportado. Use .xlsx, .xls o .csv'
        ]);
        exit;
    }
    
    // Mover archivo a carpeta temporal
    $uploadDir = '../../uploads/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }
    
    $nombreArchivo = time() . '_' . basename($archivo['name']);
    $rutaArchivo = $uploadDir . $nombreArchivo;
    
    if (!move_uploaded_file($archivo['tmp_name'], $rutaArchivo)) {
        echo json_encode([
            'success' => false,
            'message' => 'Error al guardar el archivo'
        ]);
        exit;
    }
    
    // Procesar Excel
    $resultados = procesarExcel($rutaArchivo, $conn, $extension);
    
    // Eliminar archivo temporal
    unlink($rutaArchivo);
    
    echo json_encode($resultados);
    exit;
}

// =============================================
// FUNCIÓN PARA PROCESAR EXCEL
// =============================================
function procesarExcel($rutaArchivo, $conn, $extension) {
    
    $exitos = 0;
    $errores = [];
    $fila = 2; // Asumiendo que fila 1 es cabecera
    
    // Cargar librería PhpSpreadsheet
    require_once '../../lib/PhpSpreadsheet/src/Bootstrap.php';
    
    try {
        // Identificar tipo de archivo
        if ($extension === 'csv') {
            $reader = new \PhpOffice\PhpSpreadsheet\Reader\Csv();
            $reader->setDelimiter(',');
            $reader->setEnclosure('"');
            $reader->setSheetIndex(0);
        } else {
            $reader = \PhpOffice\PhpSpreadsheet\IOFactory::createReader(ucfirst($extension));
        }
        
        $spreadsheet = $reader->load($rutaArchivo);
        $worksheet = $spreadsheet->getActiveSheet();
        $rows = $worksheet->toArray();
        
        // Saltar cabecera
        for ($i = 1; $i < count($rows); $i++) {
            $row = $rows[$i];
            $fila = $i + 1;
            
            // Verificar si la fila está vacía
            if (empty($row[0]) && empty($row[1])) {
                continue;
            }
            
            $codigo = trim($row[0] ?? '');
            $nombre = trim($row[1] ?? '');
            $descripcion = trim($row[2] ?? '');
            $estado = trim($row[3] ?? '');
            $persona_id = intval($row[4] ?? 0);
            
            // Validaciones
            $errorFila = [];
            
            if (empty($codigo)) {
                $errorFila[] = 'Código requerido';
            } else {
                // Verificar código duplicado
                $check = $conn->query("SELECT id FROM bien WHERE codigo_patrimonial = '" . $conn->real_escape_string($codigo) . "'");
                if ($check && $check->num_rows > 0) {
                    $errorFila[] = 'Código duplicado';
                }
            }
            
            if (empty($nombre)) {
                $errorFila[] = 'Nombre requerido';
            }
            
            if (empty($estado)) {
                $errorFila[] = 'Estado requerido';
            }
            
            if ($persona_id > 0) {
                $checkPersona = $conn->query("SELECT id FROM persona WHERE id = $persona_id");
                if (!$checkPersona || $checkPersona->num_rows === 0) {
                    $errorFila[] = 'Persona no existe';
                }
            }
            
            if (empty($errorFila)) {
                // Insertar bien
                $codigo_esc = $conn->real_escape_string($codigo);
                $nombre_esc = $conn->real_escape_string($nombre);
                $descripcion_esc = $conn->real_escape_string($descripcion);
                $estado_esc = $conn->real_escape_string($estado);
                $persona_val = $persona_id > 0 ? $persona_id : 'NULL';
                
                $sql = "INSERT INTO bien (codigo_patrimonial, nombre, descripcion, estado, persona_id, fecha_registro)
                        VALUES ('$codigo_esc', '$nombre_esc', '$descripcion_esc', '$estado_esc', $persona_val, CURDATE())";
                
                if ($conn->query($sql)) {
                    $bien_id = $conn->insert_id;
                    
                    // Registrar en historial
                    $conn->query("INSERT INTO historial_bien (bien_id, persona_id_nueva, fecha, accion, observacion)
                                  VALUES ($bien_id, $persona_val, NOW(), 'REGISTRO_INICIAL', 'Importado desde Excel')");
                    
                    $exitos++;
                } else {
                    $errores[] = [
                        'fila' => $fila,
                        'codigo' => $codigo,
                        'error' => 'Error BD: ' . $conn->error
                    ];
                }
            } else {
                $errores[] = [
                    'fila' => $fila,
                    'codigo' => $codigo,
                    'error' => implode(', ', $errorFila)
                ];
            }
        }
        
    } catch (Exception $e) {
        $errores[] = [
            'fila' => 0,
            'codigo' => '',
            'error' => 'Error al leer archivo: ' . $e->getMessage()
        ];
    }
    
    return [
        'success' => true,
        'exitos' => $exitos,
        'errores' => $errores,
        'total_procesados' => $exitos + count($errores)
    ];
}

// =============================================
// LISTAR BIENES (GET)
// =============================================
if ($method === 'GET') {
    $persona_id = $_GET['persona_id'] ?? null;
    
    $sql = "SELECT b.*, p.nombre as persona 
            FROM bien b 
            LEFT JOIN persona p ON b.persona_id = p.id";
    
    if ($persona_id) {
        $sql .= " WHERE b.persona_id = " . intval($persona_id);
    }
    
    $sql .= " ORDER BY b.id DESC";
    
    $res = $conn->query($sql);
    $data = [];
    
    while ($row = $res->fetch_assoc()) {
        $data[] = $row;
    }
    
    echo json_encode($data);
    exit;
}

// =============================================
// CREAR BIEN (POST)
// =============================================
if ($method === 'POST' && $action !== 'importar') {
    $input = json_decode(file_get_contents("php://input"), true);

    $codigo = $conn->real_escape_string($input['cod_patrimonial'] ?? '');
    $nombre = $conn->real_escape_string($input['nombre'] ?? '');
    $descripcion = $conn->real_escape_string($input['descripcion'] ?? '');
    $estado = $conn->real_escape_string($input['estado'] ?? 'Operativo');
    $persona_id = intval($input['persona_id'] ?? 0);
    
    // Validar código único
    $check = $conn->query("SELECT id FROM bien WHERE codigo_patrimonial = '$codigo'");
    if ($check && $check->num_rows > 0) {
        echo json_encode([
            "success" => false,
            "message" => "Código patrimonial ya existe"
        ]);
        exit;
    }

    $persona_val = $persona_id > 0 ? $persona_id : 'NULL';
    
    $sql = "INSERT INTO bien (codigo_patrimonial, nombre, descripcion, estado, persona_id, fecha_registro)
            VALUES ('$codigo', '$nombre', '$descripcion', '$estado', $persona_val, CURDATE())";

    if ($conn->query($sql)) {
        $bien_id = $conn->insert_id;
        
        // Registrar en historial
        $conn->query("INSERT INTO historial_bien (bien_id, persona_id_nueva, fecha, accion, observacion)
                      VALUES ($bien_id, $persona_val, NOW(), 'REGISTRO_INICIAL', 'Alta en sistema')");
        
        echo json_encode([
            "success" => true,
            "message" => "Bien creado exitosamente",
            "id" => $bien_id
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Error: " . $conn->error
        ]);
    }
    exit;

    // =============================================
// ASIGNAR BIEN INICIAL (sin desplazamiento)
// =============================================
if ($method === 'POST' && isset($_GET['action']) && $_GET['action'] === 'asignar') {
    $input = json_decode(file_get_contents("php://input"), true);
    
    $bien_id = intval($input['bien_id'] ?? 0);
    $persona_id = intval($input['persona_id'] ?? 0);
    $observacion = $conn->real_escape_string($input['observacion'] ?? 'Asignación inicial');
    
    // Validaciones
    if (!$bien_id || !$persona_id) {
        echo json_encode([
            'success' => false,
            'message' => 'Faltan datos requeridos'
        ]);
        exit;
    }
    
    // Verificar que el bien existe y no está asignado
    $check = $conn->query("SELECT persona_id FROM bien WHERE id = $bien_id");
    $bien = $check->fetch_assoc();
    
    if (!$bien) {
        echo json_encode(['success' => false, 'message' => 'Bien no encontrado']);
        exit;
    }
    
    if ($bien['persona_id'] !== null) {
        echo json_encode(['success' => false, 'message' => 'El bien ya está asignado. Use la función de desplazamiento.']);
        exit;
    }
    
    // Verificar que la persona existe
    $checkPersona = $conn->query("SELECT id FROM persona WHERE id = $persona_id AND estado = 'Activo'");
    if ($checkPersona->num_rows === 0) {
        echo json_encode(['success' => false, 'message' => 'Persona no encontrada o inactiva']);
        exit;
    }
    
    // Actualizar bien
    $sql = "UPDATE bien SET persona_id = $persona_id WHERE id = $bien_id";
    
    if ($conn->query($sql)) {
        // Registrar en historial
        $conn->query("INSERT INTO historial_bien 
            (bien_id, persona_id_anterior, persona_id_nueva, accion, fecha, observacion)
            VALUES ($bien_id, NULL, $persona_id, 'ASIGNACION_INICIAL', NOW(), '$observacion')");
        
        echo json_encode([
            'success' => true,
            'message' => 'Bien asignado correctamente'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Error: ' . $conn->error
        ]);
    }
    exit;
}
}

$conn->close();
?>