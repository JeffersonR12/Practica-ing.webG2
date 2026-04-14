/**
 * =====================================================
 * 🔄 MÓDULO: DESPLAZAMIENTO DE BIENES
 * =====================================================
 * 
 * Maneja:
 * - Selección de persona origen/destino
 * - Selección de bienes a transferir
 * - Creación de desplazamiento
 * 
 * 🔧 INTEGRACIÓN PHP:
 * - POST a desplazamientos.php?action=crear
 * - Backend debe manejar la lógica de negocio:
 *   * Actualizar persona_id en tabla bien
 *   * Registrar en historial_bien
 *   * Crear desplazamiento y detalle
 */

class DesplazamientoModule {
    constructor() {
        this.personas = [];
        this.bienes = [];
        this.bienesDisponibles = [];
        this.bienesSeleccionados = [];
        this.personaOrigenId = null;
        this.personaDestinoId = null;
        
        this.init();
    }
    
    async init() {
        this.setFechaActual();
        await this.cargarPersonas();
        await this.cargarBienes();
        this.setupEventListeners();
    }
    
    setFechaActual() {
        const hoy = new Date();
        document.getElementById('fechaDesplazamiento').value = Utils.formatDate(hoy);
    }
    
    async cargarPersonas() {
        try {
            // 🔧 CAMBIAR A: API.getPersonas()
            this.personas = CONFIG.USE_MOCK ? 
                await MockAPI.getPersonas() : 
                await API.getPersonas();
            
            const origenSelect = document.getElementById('personaOrigen');
            const destinoSelect = document.getElementById('personaDestino');
            
            Utils.populateSelect(origenSelect, this.personas.filter(p => p.estado === 'Activo'));
            Utils.populateSelect(destinoSelect, this.personas.filter(p => p.estado === 'Activo'));
        } catch (error) {
            Utils.showToast('Error al cargar personas: ' + error.message, 'error');
        }
    }
    
    async cargarBienes() {
        try {
            // 🔧 CAMBIAR A: API.getBienes()
            this.bienes = CONFIG.USE_MOCK ? 
                await MockAPI.getBienes() : 
                await API.getBienes();
        } catch (error) {
            Utils.showToast('Error al cargar bienes: ' + error.message, 'error');
        }
    }
    
    setupEventListeners() {
        // Selección de personas
        document.getElementById('personaOrigen').addEventListener('change', (e) => {
            this.personaOrigenId = e.target.value ? parseInt(e.target.value) : null;
            this.cargarBienesDisponibles();
            this.habilitarBusqueda();
        });
        
        document.getElementById('personaDestino').addEventListener('change', (e) => {
            this.personaDestinoId = e.target.value ? parseInt(e.target.value) : null;
            this.validarFormularioCompleto();
        });
        
        document.getElementById('motivoDesplazamiento').addEventListener('change', () => {
            this.validarFormularioCompleto();
        });
        
        // Buscador
        document.getElementById('buscadorBienes').addEventListener('input', () => this.filtrarBienesDisponibles());
        document.getElementById('btnBuscarBien').addEventListener('click', () => this.filtrarBienesDisponibles());
        
        // Selección de bienes
        document.getElementById('selectAllDisponibles').addEventListener('change', (e) => {
            this.seleccionarTodosDisponibles(e.target.checked);
        });
        
        document.getElementById('btnAgregarSeleccionados').addEventListener('click', () => {
            this.agregarBienesSeleccionados();
        });
        
        // Confirmar desplazamiento
        document.getElementById('btnConfirmarDesplazamiento').addEventListener('click', () => {
            this.confirmarDesplazamiento();
        });
    }
    
    habilitarBusqueda() {
        const buscador = document.getElementById('buscadorBienes');
        const btnBuscar = document.getElementById('btnBuscarBien');
        
        if (this.personaOrigenId) {
            buscador.disabled = false;
            btnBuscar.disabled = false;
            buscador.placeholder = '🔍 Buscar por código o nombre...';
        } else {
            buscador.disabled = true;
            btnBuscar.disabled = true;
            buscador.placeholder = 'Seleccione persona origen primero';
        }
    }
    
    cargarBienesDisponibles() {
        if (!this.personaOrigenId) {
            this.bienesDisponibles = [];
            this.renderizarBienesDisponibles();
            return;
        }
        
        // Filtrar bienes asignados a la persona origen
        this.bienesDisponibles = this.bienes.filter(b => 
            b.persona_id === this.personaOrigenId &&
            !this.bienesSeleccionados.some(bs => bs.id === b.id)
        );
        
        this.renderizarBienesDisponibles();
        this.actualizarResumen();
    }
    
    filtrarBienesDisponibles() {
        const termino = document.getElementById('buscadorBienes').value.toLowerCase();
        
        if (!termino) {
            this.cargarBienesDisponibles();
            return;
        }
        
        this.bienesDisponibles = this.bienes.filter(b => 
            b.persona_id === this.personaOrigenId &&
            !this.bienesSeleccionados.some(bs => bs.id === b.id) &&
            (b.cod_patrimonial.toLowerCase().includes(termino) ||
             b.nombre.toLowerCase().includes(termino))
        );
        
        this.renderizarBienesDisponibles();
    }
    
    renderizarBienesDisponibles() {
        const tbody = document.getElementById('bienesDisponiblesBody');
        
        if (!this.personaOrigenId) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center">Seleccione persona origen</td></tr>`;
            return;
        }
        
        if (this.bienesDisponibles.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center">No hay bienes disponibles para transferir</td></tr>`;
            return;
        }
        
        tbody.innerHTML = this.bienesDisponibles.map(bien => `
            <tr>
                <td><input type="checkbox" class="check-bien-disponible" value="${bien.id}"></td>
                <td><strong>${bien.cod_patrimonial}</strong></td>
                <td>${bien.nombre}</td>
                <td><span class="badge badge-${this.getEstadoClass(bien.estado)}">${bien.estado}</span></td>
            </tr>
        `).join('');
        
        // Desmarcar "seleccionar todos"
        document.getElementById('selectAllDisponibles').checked = false;
    }
    
    seleccionarTodosDisponibles(checked) {
        document.querySelectorAll('.check-bien-disponible').forEach(cb => {
            cb.checked = checked;
        });
    }
    
    agregarBienesSeleccionados() {
        const checkboxes = document.querySelectorAll('.check-bien-disponible:checked');
        
        if (checkboxes.length === 0) {
            Utils.showToast('Seleccione al menos un bien para transferir', 'warning');
            return;
        }
        
        const bienesIds = Array.from(checkboxes).map(cb => parseInt(cb.value));
        
        // Mover bienes de disponibles a seleccionados
        bienesIds.forEach(id => {
            const bien = this.bienesDisponibles.find(b => b.id === id);
            if (bien) {
                this.bienesSeleccionados.push(bien);
                this.bienesDisponibles = this.bienesDisponibles.filter(b => b.id !== id);
            }
        });
        
        this.renderizarBienesDisponibles();
        this.renderizarBienesSeleccionados();
        this.actualizarResumen();
        this.validarFormularioCompleto();
        
        Utils.showToast(`✅ ${bienesIds.length} bien(es) agregado(s) para transferencia`, 'success');
    }
    
    renderizarBienesSeleccionados() {
        const tbody = document.getElementById('bienesSeleccionadosBody');
        
        if (this.bienesSeleccionados.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center">No hay bienes seleccionados</td></tr>`;
            return;
        }
        
        tbody.innerHTML = this.bienesSeleccionados.map(bien => `
            <tr>
                <td><strong>${bien.cod_patrimonial}</strong></td>
                <td>${bien.nombre}</td>
                <td><span class="badge badge-${this.getEstadoClass(bien.estado)}">${bien.estado}</span></td>
                <td>
                    <button class="btn-icon" onclick="desplazamientoModule.removerBienSeleccionado(${bien.id})" title="Quitar">
                        ❌
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    removerBienSeleccionado(bienId) {
        const bien = this.bienesSeleccionados.find(b => b.id === bienId);
        if (bien) {
            this.bienesSeleccionados = this.bienesSeleccionados.filter(b => b.id !== bienId);
            
            // Si el bien corresponde a la persona origen actual, volver a disponibles
            if (bien.persona_id === this.personaOrigenId) {
                this.bienesDisponibles.push(bien);
            }
            
            this.renderizarBienesSeleccionados();
            this.renderizarBienesDisponibles();
            this.actualizarResumen();
            this.validarFormularioCompleto();
        }
    }
    
    actualizarResumen() {
        const personaOrigen = this.personas.find(p => p.id === this.personaOrigenId);
        const personaDestino = this.personas.find(p => p.id === this.personaDestinoId);
        
        document.getElementById('totalBienesTransferir').textContent = this.bienesSeleccionados.length;
        document.getElementById('resumenOrigen').textContent = personaOrigen?.nombre || '-';
        document.getElementById('resumenDestino').textContent = personaDestino?.nombre || '-';
    }
    
    validarFormularioCompleto() {
        const motivo = document.getElementById('motivoDesplazamiento').value;
        const btnConfirmar = document.getElementById('btnConfirmarDesplazamiento');
        
        const esValido = this.personaOrigenId && 
                         this.personaDestinoId && 
                         this.personaOrigenId !== this.personaDestinoId &&
                         motivo &&
                         this.bienesSeleccionados.length > 0;
        
        btnConfirmar.disabled = !esValido;
        
        if (esValido) {
            // Generar número de desplazamiento sugerido
            const numeroSugerido = `DESP-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${String(Math.floor(Math.random() * 999) + 1).padStart(3,'0')}`;
            document.getElementById('numeroDesplazamiento').value = numeroSugerido;
            // 🔧 PHP: Backend debe generar el número final único
        }
    }
    
    async confirmarDesplazamiento() {
        if (!await Utils.confirmar('¿Está seguro de realizar este desplazamiento? Se actualizará la asignación de los bienes y se registrará en el historial.')) {
            return;
        }
        
        const desplazamientoData = {
            persona_origen_id: this.personaOrigenId,
            persona_destino_id: this.personaDestinoId,
            motivo: document.getElementById('motivoDesplazamiento').value,
            observacion: document.getElementById('observacionDesplazamiento').value,
            bienes_ids: this.bienesSeleccionados.map(b => b.id)
        };
        
        try {
            // 🔧 CAMBIAR A: await API.crearDesplazamiento(desplazamientoData);
            let resultado;
            if (CONFIG.USE_MOCK) {
                resultado = await MockAPI.crearDesplazamiento(desplazamientoData);
            } else {
                resultado = await API.crearDesplazamiento(desplazamientoData);
            }
            
            Utils.showToast(`✅ Desplazamiento ${resultado.numero} realizado exitosamente`, 'success');
            
            // Redirigir o limpiar
            setTimeout(() => {
                window.location.href = 'historial.html';
            }, 2000);
        } catch (error) {
            Utils.showToast('❌ Error al realizar desplazamiento: ' + error.message, 'error');
        }
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
}

let desplazamientoModule;
document.addEventListener('DOMContentLoaded', () => {
    desplazamientoModule = new DesplazamientoModule();
    window.desplazamientoModule = desplazamientoModule;
});