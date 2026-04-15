/**
 * =====================================================
 * 📊 MÓDULO: GENERACIÓN DE REPORTES (PRODUCCIÓN)
 * =====================================================
 */

class ReportesModule {
    constructor() {
        this.personas = [];
        this.bienes = [];
        this.reporteActual = null;
        
        this.init();
    }
    
    async init() {
        await this.cargarCatalogos();
        this.setupEventListeners();
        this.setFechasPorDefecto();
    }
    
    setFechasPorDefecto() {
        const hoy = new Date();
        const mesAnterior = new Date();
        mesAnterior.setMonth(mesAnterior.getMonth() - 1);
        
        const fechaDesde = document.getElementById('fechaDesdeReporte');
        const fechaHasta = document.getElementById('fechaHastaReporte');
        
        if (fechaDesde) fechaDesde.value = this.formatDateForInput(mesAnterior);
        if (fechaHasta) fechaHasta.value = this.formatDateForInput(hoy);
    }
    
    formatDateForInput(date) {
        return date.toISOString().split('T')[0];
    }
    
    async cargarCatalogos() {
        try {
            this.personas = await API.getPersonas();
            this.bienes = await API.getBienes();
            
            this.llenarSelectPersonas();
        } catch (error) {
            console.error('Error al cargar catálogos:', error);
            Utils.showToast('Error al cargar datos', 'error');
        }
    }
    
    llenarSelectPersonas() {
        const select = document.getElementById('reportePersona');
        if (!select) return;
        
        const personasActivas = this.personas.filter(p => p.estado === 'Activo');
        Utils.populateSelect(select, personasActivas, 'id', 'nombre', '-- Seleccionar persona --');
    }
    
    setupEventListeners() {
        document.getElementById('btnGenerarReporteAsignacion')?.addEventListener('click', () => {
            this.generarReporteAsignacion('pdf');
        });
        
        document.getElementById('btnVistaPreviaAsignacion')?.addEventListener('click', () => {
            this.generarReporteAsignacion('preview');
        });
        
        document.getElementById('btnGenerarReporteDesplazamiento')?.addEventListener('click', () => {
            this.generarReporteDesplazamiento('pdf');
        });
        
        document.getElementById('btnVistaPreviaDesplazamiento')?.addEventListener('click', () => {
            this.generarReporteDesplazamiento('preview');
        });
        
        document.getElementById('btnGenerarReporteInventario')?.addEventListener('click', () => {
            this.generarReporteInventario('pdf');
        });
        
        document.querySelectorAll('.close, .close-modal').forEach(el => {
            el.addEventListener('click', () => this.cerrarModal());
        });
        
        document.getElementById('btnDescargarDesdePrevia')?.addEventListener('click', () => {
            this.descargarDesdeVistaPrevia();
        });
    }
    
    async generarReporteAsignacion(modo = 'pdf') {
        const personaId = document.getElementById('reportePersona')?.value;
        
        if (!personaId) {
            Utils.showToast('Seleccione una persona', 'warning');
            return;
        }
        
        const persona = this.personas.find(p => p.id == personaId);
        
        try {
            const bienesPersona = await API.getBienesPorPersona(personaId);
            
            if (bienesPersona.length === 0) {
                Utils.showToast(`No hay bienes asignados a ${persona.nombre}`, 'info');
                return;
            }
            
            const datosReporte = {
                tipo: 'ASIGNACION',
                titulo: 'Reporte de Bienes Asignados',
                subtitulo: `Persona: ${persona.nombre} - ${persona.area || ''}`,
                fecha: new Date(),
                persona: persona,
                bienes: bienesPersona,
                total: bienesPersona.length
            };
            
            if (modo === 'preview') {
                this.mostrarVistaPrevia(datosReporte);
            } else {
                this.generarPDFAsignacion(datosReporte);
            }
        } catch (error) {
            console.error('Error:', error);
            Utils.showToast('Error al generar reporte', 'error');
        }
    }
    
    async generarReporteDesplazamiento(modo = 'pdf') {
        const fechaDesde = document.getElementById('fechaDesdeReporte')?.value;
        const fechaHasta = document.getElementById('fechaHastaReporte')?.value;
        const motivo = document.getElementById('motivoReporte')?.value;
        
        if (!fechaDesde || !fechaHasta) {
            Utils.showToast('Seleccione el rango de fechas', 'warning');
            return;
        }
        
        try {
            // Obtener desplazamientos del backend
            const desplazamientos = await API.getDesplazamientos();
            
            // Filtrar por fecha y motivo
            let desplazamientosFiltrados = desplazamientos.filter(d => {
                const fechaDesp = new Date(d.fecha);
                const cumpleFecha = fechaDesp >= new Date(fechaDesde) && fechaDesp <= new Date(fechaHasta + 'T23:59:59');
                const cumpleMotivo = !motivo || d.motivo === motivo;
                return cumpleFecha && cumpleMotivo;
            });
            
            const datosReporte = {
                tipo: 'DESPLAZAMIENTOS',
                titulo: 'Reporte de Desplazamientos',
                subtitulo: `Período: ${Utils.formatDate(fechaDesde)} - ${Utils.formatDate(fechaHasta)}${motivo ? ` | Motivo: ${motivo}` : ''}`,
                fecha: new Date(),
                desplazamientos: desplazamientosFiltrados,
                total: desplazamientosFiltrados.length
            };
            
            if (modo === 'preview') {
                this.mostrarVistaPrevia(datosReporte);
            } else {
                this.generarPDFDesplazamientos(datosReporte);
            }
        } catch (error) {
            console.error('Error:', error);
            Utils.showToast('Error al generar reporte', 'error');
        }
    }
    
    async generarReporteInventario(modo = 'pdf') {
        const estado = document.getElementById('estadoReporte')?.value;
        
        try {
            let bienesFiltrados = [...this.bienes];
            if (estado) {
                bienesFiltrados = bienesFiltrados.filter(b => b.estado === estado);
            }
            
            const resumenEstados = {};
            this.bienes.forEach(b => {
                resumenEstados[b.estado] = (resumenEstados[b.estado] || 0) + 1;
            });
            
            const datosReporte = {
                tipo: 'INVENTARIO',
                titulo: 'Reporte de Inventario General',
                subtitulo: estado ? `Filtrado por estado: ${estado}` : 'Todos los bienes',
                fecha: new Date(),
                bienes: bienesFiltrados,
                resumenEstados: resumenEstados,
                total: bienesFiltrados.length,
                totalGeneral: this.bienes.length
            };
            
            if (modo === 'preview') {
                this.mostrarVistaPrevia(datosReporte);
            } else {
                this.generarPDFInventario(datosReporte);
            }
        } catch (error) {
            console.error('Error:', error);
            Utils.showToast('Error al generar reporte', 'error');
        }
    }
    
    mostrarVistaPrevia(datos) {
        this.reporteActual = datos;
        
        const modal = document.getElementById('modalVistaPrevia');
        const content = document.getElementById('vistaPreviaContent');
        
        if (!modal || !content) return;
        
        let html = `
            <div class="preview-reporte">
                <div class="preview-header">
                    <h2>${datos.titulo}</h2>
                    <p>${datos.subtitulo}</p>
                    <p class="preview-fecha">Generado: ${Utils.formatDateTime(datos.fecha)}</p>
                </div>
                <hr>
        `;
        
        if (datos.tipo === 'ASIGNACION') {
            html += this.renderPreviewAsignacion(datos);
        } else if (datos.tipo === 'DESPLAZAMIENTOS') {
            html += this.renderPreviewDesplazamientos(datos);
        } else if (datos.tipo === 'INVENTARIO') {
            html += this.renderPreviewInventario(datos);
        }
        
        html += '</div>';
        
        content.innerHTML = html;
        modal.style.display = 'block';
    }
    
    renderPreviewAsignacion(datos) {
        let html = `
            <div class="preview-summary">
                <p><strong>Total de bienes asignados:</strong> ${datos.total}</p>
            </div>
            <table class="preview-table">
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Nombre</th>
                        <th>Descripción</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        datos.bienes.forEach(bien => {
            html += `
                <tr>
                    <td>${bien.cod_patrimonial || bien.codigo_patrimonial}</td>
                    <td>${bien.nombre}</td>
                    <td>${bien.descripcion || '-'}</td>
                    <td>${bien.estado}</td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        return html;
    }
    
    renderPreviewDesplazamientos(datos) {
        let html = `
            <div class="preview-summary">
                <p><strong>Total de desplazamientos:</strong> ${datos.total}</p>
            </div>
            <table class="preview-table">
                <thead>
                    <tr>
                        <th>N° Desplazamiento</th>
                        <th>Fecha</th>
                        <th>Origen</th>
                        <th>Destino</th>
                        <th>Motivo</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        datos.desplazamientos.forEach(d => {
            html += `
                <tr>
                    <td>${d.numero}</td>
                    <td>${Utils.formatDateTime(d.fecha)}</td>
                    <td>${d.persona_origen || '-'}</td>
                    <td>${d.persona_destino || '-'}</td>
                    <td>${d.motivo}</td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        return html;
    }
    
    renderPreviewInventario(datos) {
        let html = `
            <div class="preview-summary">
                <p><strong>Total de bienes mostrados:</strong> ${datos.total} de ${datos.totalGeneral}</p>
            </div>
            
            <div class="preview-resumen">
                <h3>Resumen por Estado</h3>
                <div class="resumen-grid">
        `;
        
        for (const [estado, cantidad] of Object.entries(datos.resumenEstados)) {
            const porcentaje = ((cantidad / datos.totalGeneral) * 100).toFixed(1);
            html += `
                <div class="resumen-item">
                    <span>${estado}:</span>
                    <strong>${cantidad}</strong>
                    <span>(${porcentaje}%)</span>
                </div>
            `;
        }
        
        html += `
                </div>
            </div>
            
            <table class="preview-table">
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Nombre</th>
                        <th>Estado</th>
                        <th>Asignado a</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        datos.bienes.slice(0, 50).forEach(bien => {
            html += `
                <tr>
                    <td>${bien.cod_patrimonial || bien.codigo_patrimonial}</td>
                    <td>${bien.nombre}</td>
                    <td>${bien.estado}</td>
                    <td>${bien.persona_nombre || bien.persona || 'No asignado'}</td>
                </tr>
            `;
        });
        
        if (datos.bienes.length > 50) {
            html += `<tr><td colspan="4" class="text-center">... y ${datos.bienes.length - 50} bienes más</td></tr>`;
        }
        
        html += '</tbody></table>';
        return html;
    }
    
    descargarDesdeVistaPrevia() {
        if (!this.reporteActual) return;
        
        if (this.reporteActual.tipo === 'ASIGNACION') {
            this.generarPDFAsignacion(this.reporteActual);
        } else if (this.reporteActual.tipo === 'DESPLAZAMIENTOS') {
            this.generarPDFDesplazamientos(this.reporteActual);
        } else if (this.reporteActual.tipo === 'INVENTARIO') {
            this.generarPDFInventario(this.reporteActual);
        }
    }
    
    generarPDFAsignacion(datos) {
        const printWindow = window.open('', '_blank');
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${datos.titulo}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { color: #2563eb; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background: #f1f5f9; }
                    .header { margin-bottom: 20px; }
                    .footer { margin-top: 30px; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${datos.titulo}</h1>
                    <p>${datos.subtitulo}</p>
                    <p>Fecha: ${Utils.formatDateTime(datos.fecha)}</p>
                </div>
                ${this.renderPreviewAsignacion(datos)}
                <div class="footer">
                    <p>Sistema de Gestión Patrimonial - ${Utils.formatDateTime(new Date())}</p>
                </div>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 500);
    }
    
    generarPDFDesplazamientos(datos) {
        const printWindow = window.open('', '_blank');
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${datos.titulo}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { color: #f59e0b; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background: #f1f5f9; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${datos.titulo}</h1>
                    <p>${datos.subtitulo}</p>
                    <p>Fecha: ${Utils.formatDateTime(datos.fecha)}</p>
                </div>
                ${this.renderPreviewDesplazamientos(datos)}
                <div class="footer">
                    <p>Sistema de Gestión Patrimonial - ${Utils.formatDateTime(new Date())}</p>
                </div>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 500);
    }
    
    generarPDFInventario(datos) {
        const printWindow = window.open('', '_blank');
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${datos.titulo}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { color: #10b981; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background: #f1f5f9; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${datos.titulo}</h1>
                    <p>${datos.subtitulo}</p>
                    <p>Fecha: ${Utils.formatDateTime(datos.fecha)}</p>
                </div>
                ${this.renderPreviewInventario(datos)}
                <div class="footer">
                    <p>Sistema de Gestión Patrimonial - ${Utils.formatDateTime(new Date())}</p>
                </div>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 500);
    }
    
    cerrarModal() {
        const modal = document.getElementById('modalVistaPrevia');
        if (modal) modal.style.display = 'none';
    }
}

let reportesModule;
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('reportes.html')) {
        reportesModule = new ReportesModule();
        window.reportesModule = reportesModule;
    }
});