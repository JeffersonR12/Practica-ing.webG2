/**
 * =====================================================
 * 📦 MÓDULO: GESTIÓN DE BIENES
 * =====================================================
 * 
 * Maneja:
 * - Listado y filtrado de bienes
 * - Creación de nuevo bien
 * - Importación masiva desde Excel
 * 
 * 🔧 INTEGRACIÓN PHP:
 * - Los fetch actuales usan MockAPI (simulación)
 * - Cambiar a API.getBienes(), API.crearBien(), etc.
 * - Los endpoints esperados están en config.js
 */

class BienesModule {
    constructor() {
        this.bienes = [];
        this.personas = [];
        this.filteredBienes = [];
        this.currentPage = 1;
        this.itemsPerPage = CONFIG.UI.ITEMS_PER_PAGE;
        this.excelData = [];
        this.validacionResultados = [];
        
        this.init();
    }
    
    async init() {
        await this.cargarPersonas();
        await this.cargarBienes();
        this.setupEventListeners();
        this.renderizarTabla();
        this.renderizarPaginacion();
    }
    
    // =============================================
    // CARGA DE DATOS
    // =============================================
    async cargarPersonas() {
        try {
            // 🔧 CAMBIAR A: this.personas = await API.getPersonas();
            this.personas = CONFIG.USE_MOCK ? 
                await MockAPI.getPersonas() : 
                await API.getPersonas();
            
            // Llenar selects
            const filterPersona = document.getElementById('filterPersona');
            const personaSelect = document.getElementById('personaAsignada');
            
            this.personas.filter(p => p.estado === 'Activo').forEach(persona => {
                // Select de filtro
                const option1 = document.createElement('option');
                option1.value = persona.id;
                option1.textContent = persona.nombre;
                filterPersona.appendChild(option1);
                
                // Select del modal
                const option2 = document.createElement('option');
                option2.value = persona.id;
                option2.textContent = persona.nombre;
                personaSelect.appendChild(option2);
            });
        } catch (error) {
            Utils.showToast('Error al cargar personas: ' + error.message, 'error');
        }
    }
    
    async cargarBienes() {
        try {
            // 🔧 CAMBIAR A: this.bienes = await API.getBienes();
            this.bienes = CONFIG.USE_MOCK ? 
                await MockAPI.getBienes() : 
                await API.getBienes();
            
            this.filteredBienes = [...this.bienes];
        } catch (error) {
            Utils.showToast('Error al cargar bienes: ' + error.message, 'error');
        }
    }
    
    // =============================================
    // EVENT LISTENERS
    // =============================================
    setupEventListeners() {
        // Botones principales
        document.getElementById('btnNuevoBien').addEventListener('click', () => this.abrirModalNuevoBien());
        document.getElementById('btnImportarExcel').addEventListener('click', () => this.abrirModalImportar());
        
        // Formulario nuevo bien
        document.getElementById('formNuevoBien').addEventListener('submit', (e) => this.guardarNuevoBien(e));
        
        // Filtros
        document.getElementById('searchInput').addEventListener('input', () => this.filtrarBienes());
        document.getElementById('filterEstado').addEventListener('change', () => this.filtrarBienes());
        document.getElementById('filterPersona').addEventListener('change', () => this.filtrarBienes());
        
        // Importación Excel
        this.setupExcelListeners();
        
        // Modales (cerrar)
        document.querySelectorAll('.close, .close-modal').forEach(el => {
            el.addEventListener('click', () => this.cerrarModales());
        });
    }
    
    setupExcelListeners() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('excelFileInput');
        
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
        
        document.getElementById('btnConfirmarImport').addEventListener('click', () => this.confirmarImportacion());
        document.getElementById('downloadTemplate').addEventListener('click', (e) => {
            e.preventDefault();
            this.descargarPlantilla();
        });
    }
    
    // =============================================
    // FILTRADO Y RENDERIZADO
    // =============================================
    filtrarBienes() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const estado = document.getElementById('filterEstado').value;
        const personaId = document.getElementById('filterPersona').value;
        
        this.filteredBienes = this.bienes.filter(bien => {
            const matchSearch = !searchTerm || 
                bien.cod_patrimonial.toLowerCase().includes(searchTerm) ||
                bien.nombre.toLowerCase().includes(searchTerm);
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
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const paginaBienes = this.filteredBienes.slice(start, end);
        
        if (paginaBienes.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center">No se encontraron bienes</td></tr>`;
            return;
        }
        
        tbody.innerHTML = paginaBienes.map(bien => `
            <tr>
                <td><strong>${bien.cod_patrimonial}</strong></td>
                <td>${bien.nombre}</td>
                <td>${bien.descripcion || '-'}</td>
                <td><span class="badge badge-${this.getEstadoClass(bien.estado)}">${bien.estado}</span></td>
                <td>${bien.persona_nombre || 'No asignado'}</td>
                <td class="action-cell">
                    <button class="btn-icon" onclick="bienesModule.verHistorial(${bien.id})" title="Ver historial">📋</button>
                    <!-- 🔧 PHP: Acciones adicionales (editar, dar de baja) -->
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
    
    // =============================================
    // NUEVO BIEN
    // =============================================
    abrirModalNuevoBien() {
        document.getElementById('modalNuevoBien').style.display = 'block';
        document.getElementById('formNuevoBien').reset();
    }
    
    async guardarNuevoBien(event) {
        event.preventDefault();
        
        const formData = Utils.serializeForm(event.target);
        
        // Validar código patrimonial
        if (!Utils.validarCodigoPatrimonial(formData.cod_patrimonial)) {
            Utils.showToast('Código patrimonial inválido', 'error');
            return;
        }
        
        try {
            // 🔧 CAMBIAR A: await API.crearBien(formData);
            if (CONFIG.USE_MOCK) {
                await MockAPI.crearBien(formData);
            } else {
                await API.crearBien(formData);
            }
            
            Utils.showToast('✅ Bien registrado exitosamente', 'success');
            this.cerrarModales();
            await this.cargarBienes();
            this.filtrarBienes();
        } catch (error) {
            Utils.showToast('❌ Error: ' + error.message, 'error');
        }
    }
    
    // =============================================
    // IMPORTACIÓN EXCEL
    // =============================================
    abrirModalImportar() {
        document.getElementById('modalImportarExcel').style.display = 'block';
        document.getElementById('validationResults').style.display = 'none';
        document.getElementById('btnConfirmarImport').disabled = true;
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
        
        // Asumir primera fila como cabecera
        const headers = rows[0];
        const dataRows = rows.slice(1);
        
        this.validacionResultados = [];
        this.excelData = [];
        
        const codigosExistentes = this.bienes.map(b => b.cod_patrimonial);
        
        dataRows.forEach((row, index) => {
            const filaNum = index + 2; // +2 por 0-index y cabecera
            const codigo = row[0]?.toString().trim() || '';
            const nombre = row[1]?.toString().trim() || '';
            const descripcion = row[2]?.toString().trim() || '';
            const estado = row[3]?.toString().trim() || '';
            const personaId = parseInt(row[4]) || null;
            
            const errores = [];
            
            // Validaciones según RF
            if (!codigo) errores.push('Código requerido');
            else if (!Utils.validarCodigoPatrimonial(codigo)) errores.push('Formato inválido');
            else if (codigosExistentes.includes(codigo)) errores.push('Código duplicado');
            
            if (!nombre) errores.push('Nombre requerido');
            if (!estado) errores.push('Estado requerido');
            if (!personaId) errores.push('Persona ID requerido');
            else if (!this.personas.find(p => p.id === personaId)) errores.push('Persona no existe');
            
            const esValido = errores.length === 0;
            
            this.validacionResultados.push({
                fila: filaNum,
                codigo,
                nombre,
                estado,
                personaId,
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
        document.getElementById('btnConfirmarImport').disabled = validos === 0;
    }
    
    async confirmarImportacion() {
        if (this.excelData.length === 0) {
            Utils.showToast('No hay datos válidos para importar', 'warning');
            return;
        }
        
        try {
            // 🔧 CAMBIAR A: await API.importarBienes(this.excelData);
            let resultado;
            if (CONFIG.USE_MOCK) {
                resultado = await MockAPI.importarBienes(this.excelData);
            } else {
                // Para API real, enviar archivo
                const fileInput = document.getElementById('excelFileInput');
                resultado = await API.importarBienes(fileInput.files[0]);
            }
            
            Utils.showToast(`✅ Importación completada: ${this.excelData.length} bienes registrados`, 'success');
            this.cerrarModales();
            await this.cargarBienes();
            this.filtrarBienes();
        } catch (error) {
            Utils.showToast('❌ Error en la importación: ' + error.message, 'error');
        }
    }
    
    descargarPlantilla() {
        // Crear plantilla Excel para descargar
        const templateData = [
            ['Código', 'Nombre', 'Descripción', 'Estado', 'Persona_ID'],
            ['PC-001', 'Laptop HP', 'Core i5 8GB', 'Operativo', '1'],
            ['MUE-001', 'Escritorio', 'Madera 1.5m', 'Bueno', '2']
        ];
        
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(templateData);
        XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');
        XLSX.writeFile(wb, 'plantilla_bienes.xlsx');
    }
    
    // =============================================
    // UTILIDADES
    // =============================================
    verHistorial(bienId) {
        window.location.href = `historial.html?bien_id=${bienId}`;
    }
    
    cerrarModales() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }
}

// Inicializar módulo cuando el DOM esté listo
let bienesModule;
document.addEventListener('DOMContentLoaded', () => {
    bienesModule = new BienesModule();
    window.bienesModule = bienesModule;
});