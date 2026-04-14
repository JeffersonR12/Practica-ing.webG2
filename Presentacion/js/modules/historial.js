/**
 * =====================================================
 * 📋 MÓDULO: HISTORIAL DE MOVIMIENTOS
 * =====================================================
 * 
 * Maneja:
 * - Consulta de historial por bien o persona
 * - Visualización en timeline y tabla
 * - Filtros por fecha
 * 
 * 🔧 INTEGRACIÓN PHP:
 * - GET historial.php?bien_id=X
 * - GET historial.php?persona_id=X
 * - GET historial.php?fecha_desde=X&fecha_hasta=Y
 */

class HistorialModule {
    constructor() {
        this.bienes = [];
        this.personas = [];
        this.historial = [];
        this.bienSeleccionado = null;
        this.personaSeleccionada = null;
        
        this.init();
    }
    
    async init() {
        await this.cargarCatalogos();
        this.setupEventListeners();
        this.verificarParametrosURL();
    }
    
    /**
     * Carga catálogos para los selects
     */
    async cargarCatalogos() {
        try {
            // 🔧 CAMBIAR A: API.getBienes() y API.getPersonas()
            if (CONFIG.USE_MOCK) {
                this.bienes = await MockAPI.getBienes();
                this.personas = await MockAPI.getPersonas();
            } else {
                this.bienes = await API.getBienes();
                this.personas = await API.getPersonas();
            }
            
            this.llenarSelectBienes();
            this.llenarSelectPersonas();
            
        } catch (error) {
            Utils.showToast('Error al cargar catálogos: ' + error.message, 'error');
        }
    }
    
    /**
     * Llena el select de bienes
     */
    llenarSelectBienes() {
        const select = document.getElementById('selectBien');
        Utils.populateSelect(select, this.bienes, 'id', 'cod_patrimonial', '-- Seleccionar bien --');
        
        // Agregar nombre del bien al texto
        Array.from(select.options).forEach((opt, index) => {
            if (index > 0) {
                const bien = this.bienes.find(b => b.id == opt.value);
                if (bien) {
                    opt.textContent = `${bien.cod_patrimonial} - ${bien.nombre}`;
                }
            }
        });
    }
    
    /**
     * Llena el select de personas
     */
    llenarSelectPersonas() {
        const select = document.getElementById('selectPersona');
        Utils.populateSelect(select, this.personas.filter(p => p.estado === 'Activo'), 'id', 'nombre', '-- Seleccionar persona --');
    }
    
    /**
     * Configura event listeners
     */
    setupEventListeners() {
        // Búsqueda por bien
        document.getElementById('selectBien').addEventListener('change', (e) => {
            const bienId = e.target.value;
            if (bienId) {
                document.getElementById('selectPersona').value = '';
                this.personaSeleccionada = null;
                this.cargarHistorialPorBien(bienId);
            } else {
                this.limpiarVista();
            }
        });
        
        // Búsqueda por persona
        document.getElementById('selectPersona').addEventListener('change', (e) => {
            const personaId = e.target.value;
            if (personaId) {
                document.getElementById('selectBien').value = '';
                this.bienSeleccionado = null;
                this.cargarHistorialPorPersona(personaId);
            } else {
                this.limpiarVista();
            }
        });
        
        // Botón filtrar
        document.getElementById('btnFiltrarHistorial').addEventListener('click', () => {
            this.filtrarPorFechas();
        });
        
        // Botón limpiar
        document.getElementById('btnLimpiarFiltros').addEventListener('click', () => {
            this.limpiarFiltros();
        });
    }
    
    /**
     * Verifica si hay parámetros en la URL (ej: historial.html?bien_id=5)
     */
    verificarParametrosURL() {
        const params = new URLSearchParams(window.location.search);
        const bienId = params.get('bien_id');
        const personaId = params.get('persona_id');
        
        if (bienId) {
            document.getElementById('selectBien').value = bienId;
            this.cargarHistorialPorBien(bienId);
        } else if (personaId) {
            document.getElementById('selectPersona').value = personaId;
            this.cargarHistorialPorPersona(personaId);
        }
    }
    
    /**
     * Carga historial de un bien específico
     * 🔧 PHP: GET historial.php?bien_id=X
     */
    async cargarHistorialPorBien(bienId) {
        try {
            // 🔧 CAMBIAR A: const historial = await API.getHistorialBien(bienId);
            let historial;
            if (CONFIG.USE_MOCK) {
                historial = await MockAPI.getHistorialBien(bienId);
            } else {
                historial = await API.getHistorialBien(bienId);
            }
            
            this.bienSeleccionado = this.bienes.find(b => b.id == bienId);
            this.historial = historial;
            
            this.mostrarInfoBien();
            this.renderizarTimeline();
            this.renderizarTabla();
            
        } catch (error) {
            Utils.showToast('Error al cargar historial: ' + error.message, 'error');
        }
    }
    
    /**
     * Carga historial de movimientos de una persona
     * 🔧 PHP: GET historial.php?persona_id=X
     */
    async cargarHistorialPorPersona(personaId) {
        try {
            // 🔧 CAMBIAR A: const historial = await API.getHistorialPersona(personaId);
            let historial;
            if (CONFIG.USE_MOCK) {
                historial = await this.getMockHistorialPersona(personaId);
            } else {
                // historial = await API.getHistorialPersona(personaId);
                historial = await this.getMockHistorialPersona(personaId);
            }
            
            this.personaSeleccionada = this.personas.find(p => p.id == personaId);
            this.historial = historial;
            
            this.ocultarInfoBien();
            this.renderizarTimeline();
            this.renderizarTabla();
            
        } catch (error) {
            Utils.showToast('Error al cargar historial: ' + error.message, 'error');
        }
    }
    
    /**
     * Mock de historial por persona
     */
    async getMockHistorialPersona(personaId) {
        const persona = this.personas.find(p => p.id == personaId);
        const bienesPersona = this.bienes.filter(b => b.persona_id == personaId);
        
        let historial = [];
        bienesPersona.forEach(bien => {
            historial.push({
                id: historial.length + 1,
                fecha: '2024-03-01T09:00:00',
                bien_id: bien.id,
                bien_codigo: bien.cod_patrimonial,
                bien_nombre: bien.nombre,
                accion: 'ASIGNACION',
                persona_anterior: 'Almacén',
                persona_nueva: persona.nombre,
                motivo: 'Asignación inicial',
                observacion: 'Entrega de equipo'
            });
        });
        
        return historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    }
    
    /**
     * Filtra por rango de fechas
     */
    filtrarPorFechas() {
        const fechaDesde = document.getElementById('fechaDesde').value;
        const fechaHasta = document.getElementById('fechaHasta').value;
        
        if (!fechaDesde && !fechaHasta) {
            Utils.showToast('Seleccione al menos una fecha', 'warning');
            return;
        }
        
        let historialFiltrado = [...this.historial];
        
        if (fechaDesde) {
            historialFiltrado = historialFiltrado.filter(h => 
                new Date(h.fecha) >= new Date(fechaDesde)
            );
        }
        
        if (fechaHasta) {
            historialFiltrado = historialFiltrado.filter(h => 
                new Date(h.fecha) <= new Date(fechaHasta + 'T23:59:59')
            );
        }
        
        this.renderizarTimeline(historialFiltrado);
        this.renderizarTabla(historialFiltrado);
        
        Utils.showToast(`Mostrando ${historialFiltrado.length} registros`, 'info');
    }
    
    /**
     * Limpia todos los filtros
     */
    limpiarFiltros() {
        document.getElementById('selectBien').value = '';
        document.getElementById('selectPersona').value = '';
        document.getElementById('fechaDesde').value = '';
        document.getElementById('fechaHasta').value = '';
        
        this.bienSeleccionado = null;
        this.personaSeleccionada = null;
        this.historial = [];
        
        this.limpiarVista();
    }
    
    /**
     * Limpia la vista
     */
    limpiarVista() {
        this.ocultarInfoBien();
        
        const timeline = document.getElementById('timelineHistorial');
        timeline.innerHTML = '<p class="text-center">Seleccione un bien o persona para ver su historial</p>';
        
        const tbody = document.getElementById('historialTableBody');
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Utilice los filtros para buscar movimientos</td></tr>';
    }
    
    /**
     * Muestra información del bien seleccionado
     */
    mostrarInfoBien() {
        if (!this.bienSeleccionado) return;
        
        const card = document.getElementById('bienInfoCard');
        card.style.display = 'block';
        
        document.getElementById('infoCodigo').textContent = this.bienSeleccionado.cod_patrimonial;
        document.getElementById('infoNombre').textContent = this.bienSeleccionado.nombre;
        document.getElementById('infoEstado').textContent = this.bienSeleccionado.estado;
        document.getElementById('infoPersonaActual').textContent = this.bienSeleccionado.persona_nombre || 'No asignado';
    }
    
    /**
     * Oculta información del bien
     */
    ocultarInfoBien() {
        document.getElementById('bienInfoCard').style.display = 'none';
    }
    
    /**
     * Renderiza el timeline visual
     */
    renderizarTimeline(historialData = null) {
        const timeline = document.getElementById('timelineHistorial');
        const data = historialData || this.historial;
        
        if (!data || data.length === 0) {
            timeline.innerHTML = '<p class="text-center">No hay movimientos registrados</p>';
            return;
        }
        
        let html = '';
        data.forEach(item => {
            const fecha = new Date(item.fecha);
            const icono = this.getIconoAccion(item.accion);
            const color = this.getColorAccion(item.accion);
            
            html += `
                <div class="timeline-item" style="border-left-color: ${color};">
                    <div class="timeline-marker" style="background: ${color};">
                        <span>${icono}</span>
                    </div>
                    <div class="timeline-content">
                        <div class="timeline-date">
                            ${Utils.formatDateTime(item.fecha)}
                        </div>
                        <div class="timeline-title">
                            ${this.getTituloAccion(item)}
                        </div>
                        <div class="timeline-details">
                            ${this.getDetallesAccion(item)}
                        </div>
                        ${item.observacion ? `<div class="timeline-note">📝 ${item.observacion}</div>` : ''}
                    </div>
                </div>
            `;
        });
        
        timeline.innerHTML = html;
    }
    
    /**
     * Obtiene icono según tipo de acción
     */
    getIconoAccion(accion) {
        const iconos = {
            'REGISTRO_INICIAL': '📦',
            'TRANSFERENCIA': '🔄',
            'ASIGNACION': '✅',
            'DEVOLUCION': '↩️',
            'MANTENIMIENTO': '🔧',
            'BAJA': '❌'
        };
        return iconos[accion] || '📋';
    }
    
    /**
     * Obtiene color según tipo de acción
     */
    getColorAccion(accion) {
        const colores = {
            'REGISTRO_INICIAL': '#2563eb',
            'TRANSFERENCIA': '#f59e0b',
            'ASIGNACION': '#10b981',
            'DEVOLUCION': '#8b5cf6',
            'MANTENIMIENTO': '#ef4444',
            'BAJA': '#6b7280'
        };
        return colores[accion] || '#64748b';
    }
    
    /**
     * Obtiene título de la acción
     */
    getTituloAccion(item) {
        if (this.bienSeleccionado) {
            return `${item.accion} - ${item.motivo || ''}`;
        } else {
            return `${item.accion} - ${item.bien_codigo} (${item.bien_nombre})`;
        }
    }
    
    /**
     * Obtiene detalles de la acción
     */
    getDetallesAccion(item) {
        if (this.bienSeleccionado) {
            return `De: ${item.persona_anterior || 'N/A'} → A: ${item.persona_nueva || 'N/A'}`;
        } else {
            return `Responsable: ${item.persona_nueva || 'N/A'}`;
        }
    }
    
    /**
     * Renderiza la tabla de historial
     */
    renderizarTabla(historialData = null) {
        const tbody = document.getElementById('historialTableBody');
        const data = historialData || this.historial;
        
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay movimientos registrados</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.map(item => {
            const bienInfo = this.bienSeleccionado 
                ? `<strong>${this.bienSeleccionado.cod_patrimonial}</strong><br><small>${this.bienSeleccionado.nombre}</small>`
                : `<strong>${item.bien_codigo || 'N/A'}</strong><br><small>${item.bien_nombre || ''}</small>`;
            
            return `
                <tr>
                    <td>${Utils.formatDateTime(item.fecha)}</td>
                    <td>${bienInfo}</td>
                    <td>
                        <span class="badge" style="background: ${this.getColorAccion(item.accion)}20; color: ${this.getColorAccion(item.accion)};">
                            ${item.accion}
                        </span>
                    </td>
                    <td>${item.persona_anterior || '-'}</td>
                    <td>${item.persona_nueva || '-'}</td>
                    <td>${item.motivo || '-'}</td>
                    <td>${item.observacion || '-'}</td>
                </tr>
            `;
        }).join('');
    }
}

// Inicializar módulo
let historialModule;
document.addEventListener('DOMContentLoaded', () => {
    historialModule = new HistorialModule();
    window.historialModule = historialModule;
});