/**
 * =====================================================
 * 🌐 API CLIENTE - CONEXIÓN REAL CON BACKEND PHP
 * =====================================================
 * 
 * DESCOMENTAR Y USAR ESTE ARCHIVO CUANDO PHP ESTÉ LISTO.
 * ELIMINAR api-mock.js
 */

class APIClient {
    constructor(baseURL) {
        this.baseURL = baseURL;
    }
    
    async request(endpoint, options = {}) {
        const url = this.baseURL + endpoint;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        // 🔧 PHP: Agregar token de autenticación si existe
        const token = localStorage.getItem('auth_token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        try {
            const response = await fetch(url, {
                ...options,
                headers
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error en la petición');
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
    
    // Personas
    getPersonas() {
        return this.request(CONFIG.ENDPOINTS.PERSONAS);
    }
    
    getPersonaById(id) {
        return this.request(CONFIG.ENDPOINTS.PERSONA_ID + id);
    }
    
    // Bienes
    getBienes() {
        return this.request(CONFIG.ENDPOINTS.BIENES);
    }
    
    getBienesPorPersona(personaId) {
        return this.request(CONFIG.ENDPOINTS.BIENES_POR_PERSONA + personaId);
    }
    
    crearBien(bienData) {
        return this.request(CONFIG.ENDPOINTS.BIENES, {
            method: 'POST',
            body: JSON.stringify(bienData)
        });
    }
    
    importarBienes(file) {
        const formData = new FormData();
        formData.append('excel_file', file);
        
        return fetch(this.baseURL + CONFIG.ENDPOINTS.BIEN_IMPORTAR, {
            method: 'POST',
            body: formData
        }).then(res => res.json());
    }
    
    // Desplazamientos
    crearDesplazamiento(desplazamientoData) {
        return this.request(CONFIG.ENDPOINTS.CREAR_DESPLAZAMIENTO, {
            method: 'POST',
            body: JSON.stringify(desplazamientoData)
        });
    }
    
    // Historial
    getHistorialBien(bienId) {
        return this.request(CONFIG.ENDPOINTS.HISTORIAL_BIEN + bienId);
    }
    
    // Reportes
    generarReporteAsignacion(personaId) {
        return this.request(`${CONFIG.ENDPOINTS.REPORTE_ASIGNACION}&persona_id=${personaId}`);
    }
    
    generarReporteDesplazamiento(filtros) {
        let url = CONFIG.ENDPOINTS.REPORTE_DESPLAZAMIENTO;
        if (filtros.fecha_desde) url += `&fecha_desde=${filtros.fecha_desde}`;
        if (filtros.fecha_hasta) url += `&fecha_hasta=${filtros.fecha_hasta}`;
        return this.request(url);
    }
    
    // Dashboard
    getDashboardStats() {
        return this.request(CONFIG.ENDPOINTS.DASHBOARD_STATS);
    }
}

// Instancia global
const API = new APIClient(CONFIG.API_BASE_URL);
window.API = API;