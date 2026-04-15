/**
 * =====================================================
 * 📦 MÓDULO: GESTIÓN DE BIENES (VERSIÓN PRODUCCIÓN)
 * =====================================================
 */

class BienesModule {
    constructor() {
        this.bienes = [];
        this.personas = [];
        this.filteredBienes = [];
        this.currentPage = 1;
        this.itemsPerPage = CONFIG.UI.ITEMS_PER_PAGE;
        this.excelData = [];
        
        this.init();
    }
    
    async init() {
        await this.cargarPersonas();
        await this.cargarBienes();
        this.setupEventListeners();
        this.renderizarTabla();
        this.renderizarPaginacion();
    }
    
    async cargarPersonas() {
        try {
            this.personas = await API.getPersonas();
            this.llenarSelectsPersonas();
        } catch (error) {
            console.error('Error al cargar personas:', error);
            Utils.showToast('Error al cargar personas', 'error');
        }
    }
    
    llenarSelectsPersonas() {
        const filterPersona = document.getElementById('filterPersona');
        const personaSelect = document.getElementById('personaAsignada');
        
        if (filterPersona) {
            this.personas.filter(p => p.estado === 'Activo').forEach(persona => {
                const option = document.createElement('option');
                option.value = persona.id;
                option.textContent = persona.nombre;
                filterPersona.appendChild(option);
            });
        }
        
        if (personaSelect) {
            this.personas.filter(p => p.estado === 'Activo').forEach(persona => {
                const option = document.createElement('option');
                option.value = persona.id;
                option.textContent = persona.nombre;
                personaSelect.appendChild(option);
            });
        }
    }
    
    async cargarBienes() {
        try {
            this.bienes = await API.getBienes();
            this.filteredBienes = [...this.bienes];
        } catch (error) {
            console.error('Error al cargar bienes:', error);
            Utils.showToast('Error al cargar bienes', 'error');
            this.bienes = [];
            this.filteredBienes = [];
        }
    }
    
    setupEventListeners() {
        document.getElementById('btnNuevoBien')?.addEventListener('click', () => this.abrirModalNuevoBien());
        document.getElementById('btnImportarExcel')?.addEventListener('click', () => this.abrirModalImportar());
        document.getElementById('formNuevoBien')?.addEventListener('submit', (e) => this.guardarNuevoBien(e));
        
        document.getElementById('searchInput')?.addEventListener('input', () => this.filtrarBienes());
        document.getElementById('filterEstado')?.addEventListener('change', () => this.filtrarBienes());
        document.getElementById('filterPersona')?.addEventListener('change', () => this.filtrarBienes());
        
        document.querySelectorAll('.close, .close-modal').forEach(el => {
            el.addEventListener('click', () => this.cerrarModales());
        });
        
        // ✅ Agregar evento para descargar plantilla
        const downloadTemplate = document.getElementById('downloadTemplate');
        if (downloadTemplate) {
            downloadTemplate.addEventListener('click', (e) => {
                e.preventDefault();
                this.descargarPlantilla();
            });
        }

        this.setupExcelListeners();
    }
    
    setupExcelListeners() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('excelFileInput');
        
        if (uploadArea && fileInput) {
            uploadArea.addEventListener('click', () => fileInput.click());
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });
            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('dragover');
            });
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                const file = e.dataTransfer.files[0];
                if (file) this.procesarExcel(file);
            });
            
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) this.procesarExcel(file);
            });
        }
        
        document.getElementById('btnConfirmarImport')?.addEventListener('click', () => this.confirmarImportacion());
    }
    
    filtrarBienes() {
        const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
        const estado = document.getElementById('filterEstado')?.value || '';
        const personaId = document.getElementById('filterPersona')?.value || '';
        
        this.filteredBienes = this.bienes.filter(bien => {
            const codigo = bien.cod_patrimonial || bien.codigo_patrimonial || '';
            const nombre = bien.nombre || '';
            
            const matchSearch = !searchTerm || 
                codigo.toLowerCase().includes(searchTerm) ||
                nombre.toLowerCase().includes(searchTerm);
            const matchEstado = !estado || bien.estado === estado;
            const matchPersona = !personaId || bien.persona_id == personaId;
            
            return matchSearch && matchEstado && matchPersona;
        });
        
        this.currentPage = 1;
        this.renderizarTabla();
        this.renderizarPaginacion();
    }
    
    renderizarTabla() {
        const tbody = document.getElementById('bienesTableBody');
        if (!tbody) return;
        
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const paginaBienes = this.filteredBienes.slice(start, end);
        
        if (paginaBienes.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center">No se encontraron bienes</td></tr>`;
            return;
        }
        
        tbody.innerHTML = paginaBienes.map(bien => `
            <tr>
                <td><strong>${bien.cod_patrimonial || bien.codigo_patrimonial}</strong></td>
                <td>${bien.nombre}</td>
                <td>${bien.descripcion || '-'}</td>
                <td><span class="badge badge-${this.getEstadoClass(bien.estado)}">${bien.estado}</span></td>
                <td>${bien.persona_nombre || bien.persona || 'No asignado'}</td>
                <td class="action-cell">
                    <button class="btn-icon" onclick="bienesModule.verHistorial(${bien.id})" title="Ver historial">📋</button>
                </td>
            </tr>
        `).join('');
    }
    
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
    
    renderizarPaginacion() {
        const totalPages = Math.ceil(this.filteredBienes.length / this.itemsPerPage);
        const pagination = document.getElementById('pagination');
        if (!pagination) return;
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }
        
        let html = '';
        for (let i = 1; i <= totalPages; i++) {
            html += `<button class="page-btn ${i === this.currentPage ? 'active' : ''}" 
                           onclick="bienesModule.goToPage(${i})">${i}</button>`;
        }
        pagination.innerHTML = html;
    }
    
    goToPage(page) {
        this.currentPage = page;
        this.renderizarTabla();
        this.renderizarPaginacion();
    }
    
    abrirModalNuevoBien() {
        const modal = document.getElementById('modalNuevoBien');
        const form = document.getElementById('formNuevoBien');
        if (modal) modal.style.display = 'block';
        if (form) form.reset();
    }
    
    async guardarNuevoBien(event) {
        event.preventDefault();
        
        const formData = Utils.serializeForm(event.target);
        
        if (!Utils.validarCodigoPatrimonial(formData.cod_patrimonial)) {
            Utils.showToast('Código patrimonial inválido', 'error');
            return;
        }
        
        try {
            const response = await API.crearBien(formData);
            
            if (response.success) {
                Utils.showToast('✅ Bien registrado exitosamente', 'success');
                this.cerrarModales();
                await this.cargarBienes();
                this.filtrarBienes();
            } else {
                Utils.showToast('❌ Error: ' + response.message, 'error');
            }
        } catch (error) {
            Utils.showToast('❌ Error: ' + error.message, 'error');
        }
    }
    
    abrirModalImportar() {
        const modal = document.getElementById('modalImportarExcel');
        const validationResults = document.getElementById('validationResults');
        const btnConfirmar = document.getElementById('btnConfirmarImport');
        
        if (modal) modal.style.display = 'block';
        if (validationResults) validationResults.style.display = 'none';
        if (btnConfirmar) btnConfirmar.disabled = true;
        
        this.excelData = [];
    }
    
    procesarExcel(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
                
                this.validarDatosExcel(rows);
            } catch (error) {
                Utils.showToast('Error al leer el archivo Excel', 'error');
            }
        };
        
        reader.readAsArrayBuffer(file);
    }
    
    validarDatosExcel(rows) {
        if (rows.length < 2) {
            Utils.showToast('El archivo Excel está vacío', 'error');
            return;
        }
        
        const dataRows = rows.slice(1);
        this.validacionResultados = [];
        this.excelData = [];
        
        const codigosExistentes = this.bienes.map(b => b.cod_patrimonial || b.codigo_patrimonial);
        
        dataRows.forEach((row, index) => {
            const filaNum = index + 2;
            const codigo = row[0]?.toString().trim() || '';
            const nombre = row[1]?.toString().trim() || '';
            const descripcion = row[2]?.toString().trim() || '';
            const estado = row[3]?.toString().trim() || '';
            const personaId = parseInt(row[4]) || null;
            
            const errores = [];
            
            if (!codigo) errores.push('Código requerido');
            else if (codigosExistentes.includes(codigo)) errores.push('Código duplicado');
            if (!nombre) errores.push('Nombre requerido');
            if (!estado) errores.push('Estado requerido');
            
            const esValido = errores.length === 0;
            
            this.validacionResultados.push({
                fila: filaNum,
                codigo,
                nombre,
                estado,
                errores,
                esValido
            });
            
            if (esValido) {
                this.excelData.push({
                    cod_patrimonial: codigo,
                    nombre,
                    descripcion,
                    estado,
                    persona_id: personaId
                });
            }
        });
        
        this.mostrarResultadosValidacion();
    }
    
    mostrarResultadosValidacion() {
        const resultadosDiv = document.getElementById('validationResults');
        const summaryDiv = document.getElementById('resultsSummary');
        const tbody = document.getElementById('resultsTableBody');
        
        if (!resultadosDiv || !summaryDiv || !tbody) return;
        
        const total = this.validacionResultados.length;
        const validos = this.validacionResultados.filter(r => r.esValido).length;
        const errores = total - validos;
        
        summaryDiv.innerHTML = `
            <p>Total registros: ${total} | 
               <span class="text-success">✅ Válidos: ${validos}</span> | 
               <span class="text-danger">❌ Errores: ${errores}</span>
            </p>
        `;
        
        tbody.innerHTML = this.validacionResultados.map(r => `
            <tr class="${r.esValido ? 'row-success' : 'row-error'}">
                <td>${r.fila}</td>
                <td>${r.codigo}</td>
                <td>${r.nombre}</td>
                <td>${r.estado}</td>
                <td>${r.esValido ? '✅ Válido' : '❌ ' + r.errores.join(', ')}</td>
            </tr>
        `).join('');
        
        resultadosDiv.style.display = 'block';
        
        const btnConfirmar = document.getElementById('btnConfirmarImport');
        if (btnConfirmar) btnConfirmar.disabled = validos === 0;
    }
    
    async confirmarImportacion() {
    if (this.excelData.length === 0) {
        Utils.showToast('No hay datos válidos para importar', 'warning');
        return;
    }
    
    const fileInput = document.getElementById('excelFileInput');
    const file = fileInput.files[0];
    
    if (!file) {
        Utils.showToast('No hay archivo seleccionado', 'error');
        return;
    }
    
    try {
        // Crear FormData para enviar archivo
        const formData = new FormData();
        formData.append('excel_file', file);
        
        const url = CONFIG.API_BASE_URL + 'bienes.php?action=importar';
        
        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });
        
        const resultado = await response.json();
        
        if (resultado.success) {
            Utils.showToast(`✅ Importación: ${resultado.exitos} exitosos, ${resultado.errores.length} errores`, 'success');
            this.cerrarModales();
            await this.cargarBienes();
            this.filtrarBienes();
        } else {
            Utils.showToast('❌ Error: ' + resultado.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        Utils.showToast('❌ Error en la importación', 'error');
    }
}
    
    verHistorial(bienId) {
        window.location.href = `historial.html?bien_id=${bienId}`;
    }
    

    descargarPlantilla() {
    // Datos de ejemplo para la plantilla
    const templateData = [
        ['Código', 'Nombre', 'Descripción', 'Estado', 'Persona ID'],
        
        ['', '', '', '', ''] // Fila vacía para más datos
    ];
    
    // Crear libro de Excel
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    
    // Ajustar ancho de columnas
    ws['!cols'] = [
        { wch: 15 },  // Código
        { wch: 25 },  // Nombre
        { wch: 35 },  // Descripción
        { wch: 15 },  // Estado
        { wch: 12 }   // Persona ID
    ];
    
    // Agregar hoja al libro
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');
    
    // Descargar archivo
    XLSX.writeFile(wb, 'Plantilla_importacion_bienes.xlsx');
    
    Utils.showToast('📥 Plantilla descargada correctamente', 'success');
    }



    cerrarModales() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }
}

let bienesModule;
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('bienes.html')) {
        bienesModule = new BienesModule();
        window.bienesModule = bienesModule;
    }
});

