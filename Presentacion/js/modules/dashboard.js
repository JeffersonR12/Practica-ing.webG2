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
        
        if (bienes.length === 0) {
            container.innerHTML = '<p class="text-success">✅ Todos los bienes están asignados</p>';
            return;
        }
        
        container.innerHTML = `
            <ul class="alert-items">
                ${bienes.map(b => `
                    <li class="alert-item">
                        <span class="alert-icon">⚠️</span>
                        <span class="alert-content">
                            <strong>${b.codigo_patrimonial}</strong> - ${b.nombre}
                            <small>(${b.estado})</small>
                        </span>
                        <a href="bienes.html" class="btn-link">Asignar →</a>
                    </li>
                `).join('')}
            </ul>
        `;
    }
}

let dashboardModule;
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('dashboard.html')) {
        dashboardModule = new DashboardModule();
        window.dashboardModule = dashboardModule;
    }
});