/**
 * =====================================================
 * 🔧 CONFIGURACIÓN - VERSIÓN CORREGIDA
 * =====================================================
 */

const CONFIG = {
    // URL base del backend
    API_BASE_URL: 'http://localhost/Practica-ing.webG2/aplicacion/api/',
    
    // Endpoints (SOLO nombres de archivo, sin ../)
    ENDPOINTS: {
        // Personas
        PERSONAS: 'personas.php',
        PERSONA_ID: 'personas.php?id=',
        
        // Bienes
        BIENES: 'bienes.php',
        BIEN_ID: 'bienes.php?id=',
        BIENES_POR_PERSONA: 'bienes.php?persona_id=',
        BIEN_IMPORTAR: 'bienes.php?action=importar',
        
        // Desplazamientos
        DESPLAZAMIENTOS: 'desplazamiento.php',
        CREAR_DESPLAZAMIENTO: 'desplazamiento.php',
        
        // Historial
        HISTORIAL_BIEN: 'historial.php?bien_id=',
        HISTORIAL_PERSONA: 'historial.php?persona_id=',
        
        // Dashboard
        DASHBOARD_STATS: 'dashboard.php',
        
        // Reportes
        REPORTE_ASIGNACION: 'reportes.php?tipo=asignacion',
        REPORTE_DESPLAZAMIENTO: 'reportes.php?tipo=desplazamiento',
        
        // Autenticación
        LOGIN: 'login.php',      // ✅ SIN ../
        LOGOUT: 'logout.php'     // ✅ SIN ../
    },
    
    UI: {
        ITEMS_PER_PAGE: 10,
        DATE_FORMAT: 'DD/MM/YYYY',
        DATETIME_FORMAT: 'DD/MM/YYYY HH:mm'
    }
};

window.CONFIG = CONFIG;