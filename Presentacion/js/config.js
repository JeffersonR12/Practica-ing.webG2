/**
 * =====================================================
 * 🔧 CONFIGURACIÓN CENTRAL PARA INTEGRACIÓN CON PHP
 * =====================================================
 * 
 * INSTRUCCIONES PARA BACKEND PHP:
 * 1. Cambiar USE_MOCK a false cuando el backend esté listo
 * 2. Ajustar API_BASE_URL a la ruta de tu API PHP
 * 3. Verificar que los endpoints coincidan con tus archivos PHP
 */

const CONFIG = {
    // ⚠️ CAMBIAR A false CUANDO PHP ESTÉ LISTO
    USE_MOCK: true,
    
    // 🔧 URL BASE DE LA API PHP (Ejemplo: 'http://localhost/patrimonio-backend/api/')
    API_BASE_URL: 'http://localhost/patrimonio-backend/api/',
    
    // 📌 ENDPOINTS - Ajustar según estructura PHP
    ENDPOINTS: {
        // Personas
        PERSONAS: 'personas.php',
        PERSONA_ID: 'personas.php?id=',
        
        // Bienes
        BIENES: 'bienes.php',
        BIEN_ID: 'bienes.php?id=',
        BIEN_IMPORTAR: 'bienes.php?action=importar',
        BIENES_POR_PERSONA: 'bienes.php?persona_id=',
        
        // Desplazamientos
        DESPLAZAMIENTOS: 'desplazamientos.php',
        DESPLAZAMIENTO_ID: 'desplazamientos.php?id=',
        CREAR_DESPLAZAMIENTO: 'desplazamientos.php?action=crear',
        
        // Historial
        HISTORIAL_BIEN: 'historial.php?bien_id=',
        HISTORIAL_PERSONA: 'historial.php?persona_id=',
        
        // Reportes
        REPORTE_ASIGNACION: 'reportes.php?tipo=asignacion',
        REPORTE_DESPLAZAMIENTO: 'reportes.php?tipo=desplazamiento',
        
        // Dashboard
        DASHBOARD_STATS: 'dashboard.php'
    },
    
    // 🎨 Configuración UI
    UI: {
        ITEMS_PER_PAGE: 10,
        DATE_FORMAT: 'DD/MM/YYYY',
        DATETIME_FORMAT: 'DD/MM/YYYY HH:mm'
    }
};

// 🚫 NO MODIFICAR - Variable global de entorno
window.CONFIG = CONFIG;