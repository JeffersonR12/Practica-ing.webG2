/**
 * =====================================================
 * 🧪 API MOCK - SIMULACIÓN TEMPORAL DEL BACKEND
 * =====================================================
 * 
 * ATENCIÓN: Este archivo simula las respuestas del backend PHP.
 * ELIMINAR ESTE ARCHIVO CUANDO api.js ESTÉ FUNCIONANDO.
 * 
 * Estructura de datos simulada basada en las tablas:
 * - persona, bien, desplazamiento, detalle_desplazamiento, historial_bien
 */

// Base de datos en memoria (localStorage)
const MockDB = {
    init() {
        if (!localStorage.getItem('mock_personas')) {
            localStorage.setItem('mock_personas', JSON.stringify([
                { id: 1, nombre: 'Juan Pérez', area: 'Sistemas', estado: 'Activo' },
                { id: 2, nombre: 'María García', area: 'Contabilidad', estado: 'Activo' },
                { id: 3, nombre: 'Carlos López', area: 'Logística', estado: 'Inactivo' }
            ]));
        }
        if (!localStorage.getItem('mock_bienes')) {
            localStorage.setItem('mock_bienes', JSON.stringify([
                { 
                    id: 1, 
                    cod_patrimonial: 'PC-001', 
                    nombre: 'Laptop HP', 
                    descripcion: 'Core i5, 8GB RAM',
                    estado: 'Operativo',
                    persona_id: 1,
                    fecha_registro: '2024-01-15'
                },
                { 
                    id: 2, 
                    cod_patrimonial: 'MUE-045', 
                    nombre: 'Escritorio Ejecutivo', 
                    descripcion: 'Madera, 1.5m',
                    estado: 'Bueno',
                    persona_id: 2,
                    fecha_registro: '2023-11-20'
                }
            ]));
        }
        if (!localStorage.getItem('mock_desplazamientos')) {
            localStorage.setItem('mock_desplazamientos', JSON.stringify([]));
        }
        if (!localStorage.getItem('mock_detalle_desplazamiento')) {
            localStorage.setItem('mock_detalle_desplazamiento', JSON.stringify([]));
        }
        if (!localStorage.getItem('mock_historial_bien')) {
            localStorage.setItem('mock_historial_bien', JSON.stringify([]));
        }
    },
    
    get(table) {
        return JSON.parse(localStorage.getItem(`mock_${table}`)) || [];
    },
    
    set(table, data) {
        localStorage.setItem(`mock_${table}`, JSON.stringify(data));
    },
    
    add(table, item) {
        const items = this.get(table);
        item.id = items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
        items.push(item);
        this.set(table, items);
        return item;
    }
};

MockDB.init();

// =====================================================
// FUNCIONES DE API SIMULADA
// =====================================================
const MockAPI = {
    // Personas
    async getPersonas() {
        await delay(300);
        return MockDB.get('personas');
    },
    
    async getPersonaById(id) {
        await delay(200);
        return MockDB.get('personas').find(p => p.id == id);
    },
    
    // Bienes
    async getBienes() {
        await delay(400);
        const bienes = MockDB.get('bienes');
        const personas = MockDB.get('personas');
        return bienes.map(b => ({
            ...b,
            persona_nombre: personas.find(p => p.id === b.persona_id)?.nombre || 'No asignado'
        }));
    },
    
    async getBienesPorPersona(personaId) {
        const bienes = await this.getBienes();
        return bienes.filter(b => b.persona_id == personaId);
    },
    
    async crearBien(bienData) {
        await delay(500);
        // Validar código duplicado
        const bienes = MockDB.get('bienes');
        if (bienes.find(b => b.cod_patrimonial === bienData.cod_patrimonial)) {
            throw new Error('Código patrimonial duplicado');
        }
        const nuevoBien = MockDB.add('bienes', {
            ...bienData,
            fecha_registro: new Date().toISOString().split('T')[0]
        });
        
        // Registrar en historial
        MockDB.add('historial_bien', {
            bien_id: nuevoBien.id,
            persona_id: bienData.persona_id,
            accion: 'REGISTRO_INICIAL',
            fecha: new Date().toISOString(),
            observacion: 'Registro inicial del bien'
        });
        
        return nuevoBien;
    },
    
    async importarBienes(bienesArray) {
        await delay(1000);
        const resultados = { exitos: 0, errores: [] };
        for (const bien of bienesArray) {
            try {
                await this.crearBien(bien);
                resultados.exitos++;
            } catch (error) {
                resultados.errores.push({ bien, error: error.message });
            }
        }
        return resultados;
    },
    
    // Desplazamientos
    async crearDesplazamiento(desplazamientoData) {
        await delay(600);
        // desplazamientoData = { persona_origen_id, persona_destino_id, motivo, bienes_ids: [] }
        
        const numero = `DESP-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${String(MockDB.get('desplazamientos').length + 1).padStart(3,'0')}`;
        
        const nuevoDesp = MockDB.add('desplazamientos', {
            numero,
            persona_origen_id: desplazamientoData.persona_origen_id,
            persona_destino_id: desplazamientoData.persona_destino_id,
            motivo: desplazamientoData.motivo,
            fecha: new Date().toISOString(),
            usuario_id: 1 // 🔧 PHP: Obtener de sesión
        });
        
        // Procesar detalle y actualizar bienes
        for (const bienId of desplazamientoData.bienes_ids) {
            MockDB.add('detalle_desplazamiento', {
                desplazamiento_id: nuevoDesp.id,
                bien_id: bienId
            });
            
            // Actualizar persona asignada del bien
            const bienes = MockDB.get('bienes');
            const bienIndex = bienes.findIndex(b => b.id == bienId);
            const personaAnterior = bienes[bienIndex].persona_id;
            bienes[bienIndex].persona_id = desplazamientoData.persona_destino_id;
            MockDB.set('bienes', bienes);
            
            // Registrar historial
            MockDB.add('historial_bien', {
                bien_id: bienId,
                persona_id_anterior: personaAnterior,
                persona_id_nueva: desplazamientoData.persona_destino_id,
                desplazamiento_id: nuevoDesp.id,
                accion: 'TRANSFERENCIA',
                fecha: new Date().toISOString(),
                observacion: `Transferido por ${desplazamientoData.motivo}`
            });
        }
        
        return nuevoDesp;
    },
    
    // Historial
    async getHistorialBien(bienId) {
        await delay(300);
        return MockDB.get('historial_bien')
            .filter(h => h.bien_id == bienId)
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    },
    
    // Dashboard
    async getDashboardStats() {
        await delay(200);
        return {
            total_bienes: MockDB.get('bienes').length,
            total_personas: MockDB.get('personas').filter(p => p.estado === 'Activo').length,
            desplazamientos_hoy: MockDB.get('desplazamientos').filter(d => 
                d.fecha.startsWith(new Date().toISOString().split('T')[0])
            ).length
        };
    }
};

// Simular latencia de red
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

window.MockAPI = MockAPI;