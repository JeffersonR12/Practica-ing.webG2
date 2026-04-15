/**
 * =====================================================
 * 📋 MÓDULO: HISTORIAL DE MOVIMIENTOS (PRODUCCIÓN)
 * =====================================================
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
    
    async cargarCatalogos() {
        try {
            this.bienes = await API.getBienes();
            this.personas = await API.getPersonas();
            
            this.llenarSelectBienes();
            this.llenarSelectPersonas();
        } catch (error) {
            console.error('Error al cargar catálogos:', error);
            Utils.showToast('Error al cargar datos', 'error');
        }
    }
    
    llenarSelectBienes() {
        const select = document.getElementById('selectBien');
        if (!select) return;
        
        Utils.populateSelect(select, this.bienes, 'id', 'cod_patrimonial', '-- Seleccionar bien --');
        
        Array.from(select.options).forEach((opt, index) => {
            if (index > 0) {
                const bien = this.bienes.find(b => b.id == opt.value);
                if (bien) {
                    opt.textContent = `${bien.cod_patrimonial || bien.codigo_patrimonial} - ${bien.nombre}`;
                }
            }
        });
    }
    
    llenarSelectPersonas() {
        const select = document.getElementById('selectPersona');
        if (!select) return;
        
        const personasActivas = this.personas.filter(p => p.estado === 'Activo');
        Utils.populateSelect(select, personasActivas, 'id', 'nombre', '-- Seleccionar persona --');
    }
    
    setupEventListeners() {
        document.getElementById('selectBien')?.addEventListener('change', (e) => {
            const bienId = e.target.value;
            if (bienId) {
                document.getElementById('selectPersona').value = '';
                this.personaSeleccionada = null;
                this.cargarHistorialPorBien(bienId);
            } else {
                this.limpiarVista();
            }
        });
        
        document.getElementById('selectPersona')?.addEventListener('change', (e) => {
            const personaId = e.target.value;
            if (personaId) {
                document.getElementById('selectBien').value = '';
                this.bienSeleccionado = null;
                this.cargarHistorialPorPersona(personaId);
            } else {
                this.limpiarVista();
            }
        });
        
        document.getElementById('btnFiltrarHistorial')?.addEventListener('click', () => {
            this.filtrarPorFechas();
        });
        
        document.getElementById('btnLimpiarFiltros')?.addEventListener('click', () => {
            this.limpiarFiltros();
        });
    }
    
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
    
    async cargarHistorialPorBien(bienId) {
        try {
            this.historial = await API.getHistorialBien(bienId);
            this.bienSeleccionado = this.bienes.find(b => b.id == bienId);
            
            this.mostrarInfoBien();
            this.renderizarTimeline();
            this.renderizarTabla();
        } catch (error) {
            console.error('Error al cargar historial:', error);
            Utils.showToast('Error al cargar historial', 'error');
            this.historial = [];
        }
    }
    
    async cargarHistorialPorPersona(personaId) {
        try {
            this.historial = await API.getHistorialPersona(personaId);
            this.personaSeleccionada = this.personas.find(p => p.id == personaId);
            
            this.ocultarInfoBien();
            this.renderizarTimeline();
            this.renderizarTabla();
        } catch (error) {
            console.error('Error al cargar historial:', error);
            Utils.showToast('Error al cargar historial', 'error');
            this.historial = [];
        }
    }
    
    filtrarPorFechas() {
        const fechaDesde = document.getElementById('fechaDesde')?.value;
        const fechaHasta = document.getElementById('fechaHasta')?.value;
        
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
    
    limpiarFiltros() {
        const selectBien = document.getElementById('selectBien');
        const selectPersona = document.getElementById('selectPersona');
        const fechaDesde = document.getElementById('fechaDesde');
        const fechaHasta = document.getElementById('fechaHasta');
        
        if (selectBien) selectBien.value = '';
        if (selectPersona) selectPersona.value = '';
        if (fechaDesde) fechaDesde.value = '';
        if (fechaHasta) fechaHasta.value = '';
        
        this.bienSeleccionado = null;
        this.personaSeleccionada = null;
        this.historial = [];
        
        this.limpiarVista();
    }
    
    limpiarVista() {
        this.ocultarInfoBien();
        
        const timeline = document.getElementById('timelineHistorial');
        if (timeline) {
            timeline.innerHTML = '<p class="text-center">Seleccione un bien o persona para ver su historial</p>';
        }
        
        const tbody = document.getElementById('historialTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Utilice los filtros para buscar movimientos</td></tr>';
        }
    }
    
    mostrarInfoBien() {
        if (!this.bienSeleccionado) return;
        
        const card = document.getElementById('bienInfoCard');
        if (!card) return;
        
        card.style.display = 'block';
        
        document.getElementById('infoCodigo').textContent = this.bienSeleccionado.cod_patrimonial || this.bienSeleccionado.codigo_patrimonial;
        document.getElementById('infoNombre').textContent = this.bienSeleccionado.nombre;
        document.getElementById('infoEstado').textContent = this.bienSeleccionado.estado;
        document.getElementById('infoPersonaActual').textContent = this.bienSeleccionado.persona_nombre || this.bienSeleccionado.persona || 'No asignado';
    }
    
    ocultarInfoBien() {
        const card = document.getElementById('bienInfoCard');
        if (card) card.style.display = 'none';
    }
    
    renderizarTimeline(historialData = null) {
        const timeline = document.getElementById('timelineHistorial');
        if (!timeline) return;
        
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
                        <div class="timeline-date">${Utils.formatDateTime(item.fecha)}</div>
                        <div class="timeline-title">${this.getTituloAccion(item)}</div>
                        <div class="timeline-details">${this.getDetallesAccion(item)}</div>
                        ${item.observacion ? `<div class="timeline-note">📝 ${item.observacion}</div>` : ''}
                    </div>
                </div>
            `;
        });
        
        timeline.innerHTML = html;
    }
    
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
    
    getTituloAccion(item) {
        if (this.bienSeleccionado) {
            return `${item.accion} - ${item.motivo || ''}`;
        } else {
            return `${item.accion} - ${item.bien_codigo || item.codigo_patrimonial || ''} (${item.bien_nombre || item.nombre || ''})`;
        }
    }
    
    getDetallesAccion(item) {
        if (this.bienSeleccionado) {
            return `De: ${item.persona_anterior || 'N/A'} → A: ${item.persona_nueva || 'N/A'}`;
        } else {
            return `Responsable: ${item.persona_nueva || 'N/A'}`;
        }
    }
    
    renderizarTabla(historialData = null) {
        const tbody = document.getElementById('historialTableBody');
        if (!tbody) return;
        
        const data = historialData || this.historial;
        
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay movimientos registrados</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.map(item => {
            const bienInfo = this.bienSeleccionado 
                ? `<strong>${this.bienSeleccionado.cod_patrimonial || this.bienSeleccionado.codigo_patrimonial}</strong><br><small>${this.bienSeleccionado.nombre}</small>`
                : `<strong>${item.codigo_patrimonial || item.bien_codigo || 'N/A'}</strong><br><small>${item.nombre || item.bien_nombre || ''}</small>`;
            
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

let historialModule;
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('historial.html')) {
        historialModule = new HistorialModule();
        window.historialModule = historialModule;
    }
});