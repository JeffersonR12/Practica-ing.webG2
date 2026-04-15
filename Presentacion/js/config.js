const CONFIG = {
    USE_MOCK: false,
    
    API_BASE_URL: 'http://localhost/Practica-ing.webG2/aplicacion/api/',
    
    ENDPOINTS: {
        PERSONAS: 'personas.php',
        PERSONA_ID: 'personas.php?id=',
        
        BIENES: 'bienes.php',
        BIEN_ID: 'bienes.php?id=',
        BIEN_IMPORTAR: 'bienes.php?action=importar',
        BIENES_POR_PERSONA: 'bienes.php?persona_id=',
        
        DESPLAZAMIENTOS: 'desplazamiento.php',
        DESPLAZAMIENTO_ID: 'desplazamiento.php?id=',
        CREAR_DESPLAZAMIENTO: 'desplazamiento.php',
        
        HISTORIAL_BIEN: 'historial.php?bien_id=',
        HISTORIAL_PERSONA: 'historial.php?persona_id=',
        
        REPORTE_ASIGNACION: 'reportes.php?tipo=asignacion',
        REPORTE_DESPLAZAMIENTO: 'reportes.php?tipo=desplazamiento',
        
        DASHBOARD_STATS: 'dashboard.php'
    }
};

window.CONFIG = CONFIG;