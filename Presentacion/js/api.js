/**
 * =====================================================
 * 🌐 API CLIENTE - CONEXIÓN REAL CON BACKEND PHP
 * =====================================================
 */

class APIClient {
    constructor(baseURL) {
        this.baseURL = baseURL;
    }
    
    /**
     * Realiza una petición HTTP
     */
    async request(endpoint, options = {}) {
        const url = this.baseURL + endpoint;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        try {
            const response = await fetch(url, {
                ...options,
                headers
            });
            
            if (!response.ok) {
                const error = await response.text();
                throw new Error(error || `Error ${response.status}`);
            }
            
            const data = await response.json();
            return data;
            
        } catch (error) {
            console.error('❌ API Error:', error);
            throw error;
        }
    }
    
    // =============================================
    // PERSONAS
    // =============================================
    async getPersonas() {
        return await this.request(CONFIG.ENDPOINTS.PERSONAS);
    }
    
    async getPersonaById(id) {
        return await this.request(CONFIG.ENDPOINTS.PERSONA_ID + id);
    }
    
    async crearPersona(personaData) {
        return await this.request(CONFIG.ENDPOINTS.PERSONAS, {
            method: 'POST',
            body: JSON.stringify(personaData)
        });
    }
    
    // =============================================
    // BIENES
    // =============================================
    async getBienes() {
        const bienes = await this.request(CONFIG.ENDPOINTS.BIENES);
        
        // Adaptar nombres de campos del backend al frontend
        return bienes.map(b => ({
            ...b,
            cod_patrimonial: b.codigo_patrimonial, // Mapeo para el frontend
            persona_nombre: b.persona || 'No asignado',
            persona_id: b.persona_id
        }));
    }
    
    async getBienesPorPersona(personaId) {
        const bienes = await this.request(`${CONFIG.ENDPOINTS.BIENES}?persona_id=${personaId}`);
        return bienes.map(b => ({
            ...b,
            cod_patrimonial: b.codigo_patrimonial,
            persona_nombre: b.persona || 'No asignado'
        }));
    }
    
    async getBienById(id) {
        return await this.request(CONFIG.ENDPOINTS.BIEN_ID + id);
    }
    
    async crearBien(bienData) {
        const payload = {
            cod_patrimonial: bienData.cod_patrimonial,
            nombre: bienData.nombre,
            descripcion: bienData.descripcion || '',
            estado: bienData.estado,
            persona_id: parseInt(bienData.persona_id) || null
        };
        
        const response = await this.request(CONFIG.ENDPOINTS.BIENES, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        
        return {
            success: response.success || response.message?.includes('creado'),
            message: response.message,
            id: response.id
        };
    }
    
    async importarBienes(file) {
        const formData = new FormData();
        formData.append('excel_file', file);
        
        const url = this.baseURL + 'bienes.php?action=importar';
        
        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });
        
        return await response.json();
    }
    
    // =============================================
    // DESPLAZAMIENTOS
    // =============================================
    async getDesplazamientos() {
        return await this.request(CONFIG.ENDPOINTS.DESPLAZAMIENTOS);
    }
    
    async crearDesplazamiento(desplazamientoData) {
        const payload = {
            motivo: desplazamientoData.motivo,
            persona_origen: parseInt(desplazamientoData.persona_origen_id),
            persona_destino: parseInt(desplazamientoData.persona_destino_id),
            bienes: desplazamientoData.bienes_ids,
            observacion: desplazamientoData.observacion || ''
        };
        
        const response = await this.request(CONFIG.ENDPOINTS.CREAR_DESPLAZAMIENTO, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        
        return {
            success: response.success || response.message === 'ok',
            message: response.message,
            numero: response.numero
        };
    }
    
    // =============================================
    // HISTORIAL
    // =============================================
    async getHistorialBien(bienId) {
        return await this.request(CONFIG.ENDPOINTS.HISTORIAL_BIEN + bienId);
    }
    
    async getHistorialPersona(personaId) {
        return await this.request(CONFIG.ENDPOINTS.HISTORIAL_PERSONA + personaId);
    }
    
    // =============================================
    // DASHBOARD
    // =============================================
    async getDashboardStats() {
        return await this.request(CONFIG.ENDPOINTS.DASHBOARD_STATS);
    }
    
    // =============================================
    // AUTENTICACIÓN
    // =============================================
    async login(usuario, password, rememberMe = false) {
        const url = this.baseURL+ CONFIG.ENDPOINTS.LOGIN;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, password, remember_me: rememberMe })
        });
        
        const data = await response.json();
    
        if (!response.ok) {
            throw new Error(data.message || 'Error de autenticación');
        }
        
        return data;
    }
    
    async logout() {
        const url = this.baseURL.replace('/api/', '/') + 'logout.php';
        
        return await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
    }


    /**
 * Asigna un bien sin dueño a una persona (primera asignación)
 */
async asignarBienInicial(bienId, personaId, observacion = '') {
    const url = this.baseURL + 'bienes.php?action=asignar';
    
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            bien_id: bienId,
            persona_id: personaId,
            observacion: observacion
        })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.message || 'Error al asignar');
    }
    
    return data;
}
}

// Instancia global
const API = new APIClient(CONFIG.API_BASE_URL);
window.API = API;

console.log('✅ API Client inicializado - Backend:', CONFIG.API_BASE_URL);