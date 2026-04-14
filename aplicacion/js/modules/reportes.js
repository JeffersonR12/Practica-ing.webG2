/**
 * =====================================================
 * 📊 MÓDULO: GENERACIÓN DE REPORTES
 * =====================================================
 * 
 * Maneja:
 * - Reporte de asignación por persona
 * - Reporte de desplazamientos por período
 * - Reporte de inventario general
 * - Generación de PDF (jsPDF) o descarga desde PHP
 * 
 * 🔧 INTEGRACIÓN PHP:
 * - reportes.php?tipo=asignacion&persona_id=X
 * - reportes.php?tipo=desplazamiento&fecha_desde=X&fecha_hasta=Y
 * - reportes.php?tipo=inventario&estado=X
 */

class ReportesModule {
    constructor() {
        this.personas = [];
        this.bienes = [];
        this.reporteActual = null;
        this.datosVistaPrevia = null;
        
        this.init();
    }
    
    async init() {
        await this.cargarCatalogos();
        this.setupEventListeners();
        this.setFechasPorDefecto();
    }
    
    /**
     * Establece fechas por defecto (último mes)
     */
    setFechasPorDefecto() {
        const hoy = new Date();
        const mesAnterior = new Date();
        mesAnterior.setMonth(mesAnterior.getMonth() - 1);
        
        document.getElementById('fechaDesdeReporte').value = this.formatDateForInput(mesAnterior);
        document.getElementById('fechaHastaReporte').value = this.formatDateForInput(hoy);
    }
    
    /**
     * Formatea fecha para input date (YYYY-MM-DD)
     */
    formatDateForInput(date) {
        return date.toISOString().split('T')[0];
    }
    
    /**
     * Carga catálogos para los selects
     */
    async cargarCatalogos() {
        try {
            // 🔧 CAMBIAR A: API.getPersonas()
            if (CONFIG.USE_MOCK) {
                this.personas = await MockAPI.getPersonas();
                this.bienes = await MockAPI.getBienes();
            } else {
                this.personas = await API.getPersonas();
                this.bienes = await API.getBienes();
            }
            
            this.llenarSelectPersonas();
            
        } catch (error) {
            Utils.showToast('Error al cargar catálogos: ' + error.message, 'error');
        }
    }
    
    /**
     * Llena el select de personas para reporte de asignación
     */
    llenarSelectPersonas() {
        const select = document.getElementById('reportePersona');
        Utils.populateSelect(select, this.personas.filter(p => p.estado === 'Activo'), 'id', 'nombre', '-- Seleccionar persona --');
    }
    
    /**
     * Configura event listeners
     */
    setupEventListeners() {
        // Reporte de Asignación
        document.getElementById('btnGenerarReporteAsignacion').addEventListener('click', () => {
            this.generarReporteAsignacion('pdf');
        });
        
        document.getElementById('btnVistaPreviaAsignacion').addEventListener('click', () => {
            this.generarReporteAsignacion('preview');
        });
        
        // Reporte de Desplazamientos
        document.getElementById('btnGenerarReporteDesplazamiento').addEventListener('click', () => {
            this.generarReporteDesplazamiento('pdf');
        });
        
        document.getElementById('btnVistaPreviaDesplazamiento').addEventListener('click', () => {
            this.generarReporteDesplazamiento('preview');
        });
        
        // Reporte de Inventario
        document.getElementById('btnGenerarReporteInventario').addEventListener('click', () => {
            this.generarReporteInventario('pdf');
        });
        
        // Modal
        document.querySelectorAll('.close, .close-modal').forEach(el => {
            el.addEventListener('click', () => this.cerrarModal());
        });
        
        document.getElementById('btnDescargarDesdePrevia').addEventListener('click', () => {
            this.descargarDesdeVistaPrevia();
        });
    }
    
    /**
     * Genera reporte de asignación por persona
     * 🔧 PHP: GET reportes.php?tipo=asignacion&persona_id=X
     */
    async generarReporteAsignacion(modo = 'pdf') {
        const personaId = document.getElementById('reportePersona').value;
        
        if (!personaId) {
            Utils.showToast('Seleccione una persona', 'warning');
            return;
        }
        
        const persona = this.personas.find(p => p.id == personaId);
        const bienesPersona = this.bienes.filter(b => b.persona_id == personaId);
        
        if (bienesPersona.length === 0) {
            Utils.showToast(`No hay bienes asignados a ${persona.nombre}`, 'info');
            return;
        }
        
        const datosReporte = {
            tipo: 'ASIGNACION',
            titulo: `Reporte de Bienes Asignados`,
            subtitulo: `Persona: ${persona.nombre} - ${persona.area || ''}`,
            fecha: new Date(),
            persona: persona,
            bienes: bienesPersona,
            total: bienesPersona.length
        };
        
        if (modo === 'preview') {
            this.mostrarVistaPrevia(datosReporte);
        } else {
            // 🔧 PHP: Redirigir a PDF generado por PHP
            if (!CONFIG.USE_MOCK) {
                window.open(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.REPORTE_ASIGNACION}&persona_id=${personaId}`, '_blank');
            } else {
                this.generarPDFAsignacion(datosReporte);
            }
        }
    }
    
    /**
     * Genera reporte de desplazamientos por período
     * 🔧 PHP: GET reportes.php?tipo=desplazamiento&fecha_desde=X&fecha_hasta=Y
     */
    async generarReporteDesplazamiento(modo = 'pdf') {
        const fechaDesde = document.getElementById('fechaDesdeReporte').value;
        const fechaHasta = document.getElementById('fechaHastaReporte').value;
        const motivo = document.getElementById('motivoReporte').value;
        
        if (!fechaDesde || !fechaHasta) {
            Utils.showToast('Seleccione el rango de fechas', 'warning');
            return;
        }
        
        try {
            // 🔧 CAMBIAR A: const desplazamientos = await API.generarReporteDesplazamiento({fecha_desde, fecha_hasta});
            let desplazamientos;
            if (CONFIG.USE_MOCK) {
                desplazamientos = await this.getMockDesplazamientos(fechaDesde, fechaHasta, motivo);
            } else {
                const filtros = { fecha_desde: fechaDesde, fecha_hasta: fechaHasta };
                desplazamientos = await API.generarReporteDesplazamiento(filtros);
            }
            
            const datosReporte = {
                tipo: 'DESPLAZAMIENTOS',
                titulo: 'Reporte de Desplazamientos',
                subtitulo: `Período: ${Utils.formatDate(fechaDesde)} - ${Utils.formatDate(fechaHasta)}${motivo ? ` | Motivo: ${motivo}` : ''}`,
                fecha: new Date(),
                desplazamientos: desplazamientos,
                total: desplazamientos.length
            };
            
            if (modo === 'preview') {
                this.mostrarVistaPrevia(datosReporte);
            } else {
                if (!CONFIG.USE_MOCK) {
                    let url = `${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.REPORTE_DESPLAZAMIENTO}&fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}`;
                    if (motivo) url += `&motivo=${encodeURIComponent(motivo)}`;
                    window.open(url, '_blank');
                } else {
                    this.generarPDFDesplazamientos(datosReporte);
                }
            }
            
        } catch (error) {
            Utils.showToast('Error al generar reporte: ' + error.message, 'error');
        }
    }
    
    /**
     * Mock de desplazamientos para reporte
     */
    async getMockDesplazamientos(fechaDesde, fechaHasta, motivo) {
        return [
            {
                numero: 'DESP-20240315-001',
                fecha: '2024-03-15T10:30:00',
                persona_origen: 'Juan Pérez',
                persona_destino: 'María García',
                motivo: 'Cambio de área',
                cantidad_bienes: 3,
                observacion: 'Reestructuración'
            },
            {
                numero: 'DESP-20240314-002',
                fecha: '2024-03-14T14:20:00',
                persona_origen: 'Carlos López',
                persona_destino: 'Ana Martínez',
                motivo: 'Renuncia',
                cantidad_bienes: 1,
                observacion: 'Devolución de equipo'
            },
            {
                numero: 'DESP-20240310-005',
                fecha: '2024-03-10T09:15:00',
                persona_origen: 'María García',
                persona_destino: 'Luis Torres',
                motivo: 'Préstamo',
                cantidad_bienes: 2,
                observacion: 'Préstamo temporal'
            }
        ].filter(d => {
            if (motivo && d.motivo !== motivo) return false;
            return true;
        });
    }
    
    /**
     * Genera reporte de inventario general
     * 🔧 PHP: GET reportes.php?tipo=inventario&estado=X
     */
    async generarReporteInventario(modo = 'pdf') {
        const estado = document.getElementById('estadoReporte').value;
        
        let bienesFiltrados = [...this.bienes];
        if (estado) {
            bienesFiltrados = bienesFiltrados.filter(b => b.estado === estado);
        }
        
        // Agrupar por estado para resumen
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
            if (!CONFIG.USE_MOCK) {
                let url = `${CONFIG.API_BASE_URL}reportes.php?tipo=inventario`;
                if (estado) url += `&estado=${encodeURIComponent(estado)}`;
                window.open(url, '_blank');
            } else {
                this.generarPDFInventario(datosReporte);
            }
        }
    }
    
    /**
     * Muestra vista previa en modal
     */
    mostrarVistaPrevia(datos) {
        this.reporteActual = datos;
        this.datosVistaPrevia = datos;
        
        const modal = document.getElementById('modalVistaPrevia');
        const content = document.getElementById('vistaPreviaContent');
        
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
    
    /**
     * Renderiza preview de asignación
     */
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
                        <th>Fecha Registro</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        datos.bienes.forEach(bien => {
            html += `
                <tr>
                    <td>${bien.cod_patrimonial}</td>
                    <td>${bien.nombre}</td>
                    <td>${bien.descripcion || '-'}</td>
                    <td>${bien.estado}</td>
                    <td>${bien.fecha_registro || '-'}</td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        return html;
    }
    
    /**
     * Renderiza preview de desplazamientos
     */
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
                        <th>Bienes</th>
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
                    <td>${d.persona_origen}</td>
                    <td>${d.persona_destino}</td>
                    <td>${d.cantidad_bienes}</td>
                    <td>${d.motivo}</td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        return html;
    }
    
    /**
     * Renderiza preview de inventario
     */
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
                    <td>${bien.cod_patrimonial}</td>
                    <td>${bien.nombre}</td>
                    <td>${bien.estado}</td>
                    <td>${bien.persona_nombre || 'No asignado'}</td>
                </tr>
            `;
        });
        
        if (datos.bienes.length > 50) {
            html += `<tr><td colspan="4" class="text-center">... y ${datos.bienes.length - 50} bienes más</td></tr>`;
        }
        
        html += '</tbody></table>';
        return html;
    }
    
    /**
     * Descarga PDF desde la vista previa
     */
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
    
    /**
     * Genera PDF de asignación (usando jsPDF o window.print)
     */
    generarPDFAsignacion(datos) {
        // Para simplicidad, usamos window.print() en el contenido de la vista previa
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
                    <p>Fecha de generación: ${Utils.formatDateTime(datos.fecha)}</p>
                </div>
                ${this.renderPreviewAsignacion(datos)}
                <div class="footer">
                    <p>Sistema de Gestión Patrimonial - Reporte generado el ${Utils.formatDateTime(new Date())}</p>
                </div>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
        }, 500);
    }
    
    /**
     * Genera PDF de desplazamientos
     */
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
                    <p>Fecha de generación: ${Utils.formatDateTime(datos.fecha)}</p>
                </div>
                ${this.renderPreviewDesplazamientos(datos)}
                <div class="footer">
                    <p>Sistema de Gestión Patrimonial - Reporte generado el ${Utils.formatDateTime(new Date())}</p>
                </div>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
        }, 500);
    }
    
    /**
     * Genera PDF de inventario
     */
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
                    .resumen { display: flex; gap: 20px; margin: 20px 0; }
                    .resumen-item { padding: 10px; background: #f1f5f9; border-radius: 8px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${datos.titulo}</h1>
                    <p>${datos.subtitulo}</p>
                    <p>Fecha de generación: ${Utils.formatDateTime(datos.fecha)}</p>
                </div>
                ${this.renderPreviewInventario(datos)}
                <div class="footer">
                    <p>Sistema de Gestión Patrimonial - Reporte generado el ${Utils.formatDateTime(new Date())}</p>
                </div>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
        }, 500);
    }
    
    /**
     * Cierra el modal de vista previa
     */
    cerrarModal() {
        document.getElementById('modalVistaPrevia').style.display = 'none';
    }
}

// Inicializar módulo
let reportesModule;
document.addEventListener('DOMContentLoaded', () => {
    reportesModule = new ReportesModule();
    window.reportesModule = reportesModule;
});