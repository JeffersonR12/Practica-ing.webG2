/**
 * =====================================================
 * 📊 MÓDULO: DASHBOARD (PRODUCCIÓN)
 * =====================================================
 */

class DashboardModule {
    constructor() {
        this.init();
    }
    
    async init() {
        this.setFechaActual();
        await this.cargarDatosDashboard();
    }
    
    setFechaActual() {
        const fechaEl = document.getElementById('fechaActual');
        if (fechaEl) {
            const hoy = new Date();
            const opciones = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            };
            fechaEl.textContent = hoy.toLocaleDateString('es-ES', opciones);
        }
    }
    
    async cargarDatosDashboard() {
        try {
            const stats = await API.getDashboardStats();
            
            this.bienesSinAsignar = stats.bienes_sin_asignar || [];
            console.log('📦 Bienes sin asignar cargados:', this.bienesSinAsignar.length);
            this.actualizarCards(stats);
            this.renderizarGraficoEstados(stats.bienes_por_estado || {});
            this.renderizarGraficoAreas(stats.bienes_por_area || []);
            this.renderizarUltimosDesplazamientos(stats.ultimos_desplazamientos || []);
            this.renderizarBienesSinAsignar(stats.bienes_sin_asignar || []);
            
            const desplazamientosMesEl = document.getElementById('desplazamientos-mes');
            if (desplazamientosMesEl) {
                desplazamientosMesEl.textContent = stats.desplazamientos_mes || 0;
            }
            
        } catch (error) {
            console.error('Error al cargar dashboard:', error);
            this.mostrarValoresDefault();
        }
    }
    
    actualizarCards(stats) {
        const totalBienes = document.getElementById('total-bienes');
        const totalPersonas = document.getElementById('total-personas');
        const desplazamientosHoy = document.getElementById('desplazamientos-hoy');
        
        if (totalBienes) totalBienes.textContent = stats.total_bienes || 0;
        if (totalPersonas) totalPersonas.textContent = stats.total_personas || 0;
        if (desplazamientosHoy) desplazamientosHoy.textContent = stats.desplazamientos_hoy || 0;
    }
    asignarBien(bienId) {
    // Redirigir a la página de desplazamiento
    // Pasar el ID del bien para preseleccionarlo
    window.location.href = `pages/desplazamiento.html?bien_id=${bienId}`;
    }
    mostrarValoresDefault() {
        ['total-bienes', 'total-personas', 'desplazamientos-hoy', 'desplazamientos-mes'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = '--';
        });
    }
    
    renderizarGraficoEstados(data) {
        const container = document.getElementById('grafico-estados');
        if (!container) return;
        
        const total = Object.values(data).reduce((a, b) => a + b, 0);
        
        if (total === 0) {
            container.innerHTML = '<p class="text-center">No hay datos disponibles</p>';
            return;
        }
        
        let html = '<div class="estado-barras">';
        for (const [estado, cantidad] of Object.entries(data)) {
            const porcentaje = ((cantidad / total) * 100).toFixed(1);
            html += `
                <div class="estado-bar-item">
                    <span class="estado-label">${estado}</span>
                    <div class="barra-container">
                        <div class="barra" style="width: ${porcentaje}%;"></div>
                    </div>
                    <span class="estado-cantidad">${cantidad} (${porcentaje}%)</span>
                </div>
            `;
        }
        html += '</div>';
        
        container.innerHTML = html;
    }
    
    renderizarGraficoAreas(data) {
        const container = document.getElementById('grafico-areas');
        if (!container) return;
        
        if (!data || data.length === 0) {
            container.innerHTML = '<p class="text-center">No hay datos disponibles</p>';
            return;
        }
        
        const maxCantidad = Math.max(...data.map(d => d.cantidad));
        
        let html = '<div class="area-barras">';
        data.forEach(item => {
            const porcentaje = ((item.cantidad / maxCantidad) * 100).toFixed(0);
            html += `
                <div class="area-bar-item">
                    <span class="area-label">${item.area}</span>
                    <div class="barra-area-container">
                        <div class="barra-area" style="width: ${porcentaje}%;">
                            <span class="barra-valor">${item.cantidad}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        container.innerHTML = html;
    }
    
    renderizarUltimosDesplazamientos(desplazamientos) {
        const tbody = document.getElementById('ultimos-desplazamientos');
        if (!tbody) return;
        
        if (desplazamientos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay desplazamientos recientes</td></tr>';
            return;
        }
        
        tbody.innerHTML = desplazamientos.map(d => `
            <tr>
                <td><strong>${d.numero}</strong></td>
                <td>${Utils.formatDate(d.fecha)}</td>
                <td>${d.persona_origen || '-'}</td>
                <td>${d.persona_destino || '-'}</td>
                <td>${d.cantidad_bienes || 0}</td>
                <td>${d.motivo || '-'}</td>
                <td><span class="badge badge-success">Completado</span></td>
            </tr>
        `).join('');
    }
    
  renderizarBienesSinAsignar(bienes) {
    const container = document.getElementById('bienes-sin-asignar');
    if (!container) return;
    
    // Guardar los bienes sin asignar para usarlos después
    this.bienesSinAsignar = bienes || [];
    
    console.log('🎨 Renderizando bienes sin asignar:', this.bienesSinAsignar.length);
    
    if (!bienes || bienes.length === 0) {
        container.innerHTML = '<p class="text-success">✅ Todos los bienes están asignados</p>';
        return;
    }
    
    container.innerHTML = `
        <ul class="alert-items">
            ${bienes.map(b => `
                <li class="alert-item">
                    <span class="alert-icon">⚠️</span>
                    <span class="alert-content">
                        <strong>${b.codigo_patrimonial || b.cod_patrimonial}</strong> - ${b.nombre}
                        <small>(${b.estado})</small>
                    </span>
                    <button class="btn-link" onclick="dashboardModule.abrirModalAsignacionInicial(${b.id})" style="background: none; border: none; cursor: pointer; color: #2563eb;">
                        Asignar →
                    </button>
                </li>
            `).join('')}
        </ul>
    `;
}

/**
 * Abre modal para asignación inicial de un bien sin dueño
 */
async abrirModalAsignacionInicial(bienId) {
    console.log('🔍 Abriendo modal para bien ID:', bienId);
    console.log('📦 Bienes disponibles:', this.bienesSinAsignar);
    
    // ✅ Convertir ID a número para comparación
    const id = parseInt(bienId);
    
    // Buscar el bien (soportar diferentes nombres de campo ID)
    const bien = this.bienesSinAsignar.find(b => {
        const bienIdNum = parseInt(b.id || b.ID || b.Id);
        console.log(`  Comparando: ${bienIdNum} === ${id}?`, bienIdNum === id);
        return bienIdNum === id;
    });
    
    if (!bien) {
        Utils.showToast('Bien no encontrado', 'error');
        return;
    }
    
    try {
        // Cargar personas activas
        const personas = await API.getPersonas();
        const personasActivas = personas.filter(p => p.estado === 'Activo');
        
        // Crear modal
        const modalHtml = `
            <div class="modal" id="modalAsignacionInicial" style="display: block;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>📦 Asignar Bien (Primera Asignación)</h2>
                        <span class="close" onclick="dashboardModule.cerrarModalAsignacion()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="bien-info-card" style="background: #f1f5f9; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
                            <p><strong>🏷️ Código:</strong> ${bien.codigo_patrimonial || bien.cod_patrimonial}</p>
                            <p><strong>📦 Nombre:</strong> ${bien.nombre}</p>
                            <p><strong>📝 Descripción:</strong> ${bien.descripcion || 'N/A'}</p>
                            <p><strong>📊 Estado:</strong> <span class="badge badge-${this.getEstadoClass(bien.estado)}">${bien.estado}</span></p>
                        </div>
                        
                        <div class="form-group">
                            <label for="personaAsignar">👤 Asignar a:</label>
                            <select id="personaAsignar" class="form-control" required>
                                <option value="">-- Seleccionar persona responsable --</option>
                                ${personasActivas.map(p => `
                                    <option value="${p.id}">${p.nombre} ${p.area ? '(' + p.area + ')' : ''}</option>
                                `).join('')}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="observacionAsignacion">📋 Observación (opcional):</label>
                            <textarea id="observacionAsignacion" class="form-control" rows="2" placeholder="Ej: Entrega de equipo nuevo"></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-success" onclick="dashboardModule.confirmarAsignacionInicial(${bienId})">
                            ✅ Confirmar Asignación
                        </button>
                        <button class="btn btn-secondary" onclick="dashboardModule.cerrarModalAsignacion()">
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
    } catch (error) {
        console.error('Error al abrir modal:', error);
        Utils.showToast('Error al cargar personas', 'error');
    }
}

/**
 * Confirma la asignación inicial del bien
 */
async confirmarAsignacionInicial(bienId) {
    const personaId = document.getElementById('personaAsignar')?.value;
    const observacion = document.getElementById('observacionAsignacion')?.value || 'Asignación inicial desde Dashboard';
    
    if (!personaId) {
        Utils.showToast('Seleccione una persona para asignar el bien', 'warning');
        return;
    }
    
    try {
        // Mostrar loading
        Utils.showToast('Asignando bien...', 'info');
        
        // ✅ Llamar al endpoint de asignación directa (sin desplazamiento)
        const response = await API.asignarBienInicial(bienId, parseInt(personaId), observacion);
        
        if (response.success) {
            Utils.showToast('✅ Bien asignado correctamente', 'success');
            this.cerrarModalAsignacion();
            
            // Recargar datos del dashboard
            setTimeout(async () => {
                await this.cargarDatosDashboard();
            }, 500);
        } else {
            Utils.showToast('❌ Error: ' + (response.message || 'No se pudo asignar'), 'error');
        }
    } catch (error) {
        console.error('Error al asignar:', error);
        Utils.showToast('❌ Error al asignar el bien', 'error');
    }
}

/**
 * Cierra el modal de asignación
 */
cerrarModalAsignacion() {
    const modal = document.getElementById('modalAsignacionInicial');
    if (modal) modal.remove();
}

/**
 * Obtiene clase CSS según estado
 */
getEstadoClass(estado) {
    const classes = {
        'Operativo': 'success',
        'Bueno': 'success',
        'Regular': 'warning',
        'Malo': 'danger',
        'Inoperativo': 'danger'
    };
    return classes[estado] || 'secondary';
}
}

let dashboardModule;
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('dashboard.html')) {
        dashboardModule = new DashboardModule();
        window.dashboardModule = dashboardModule;
    }
});