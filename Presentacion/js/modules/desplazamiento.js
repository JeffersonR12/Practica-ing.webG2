/**
 * =====================================================
 * 🔄 MÓDULO: DESPLAZAMIENTO (VERSIÓN PRODUCCIÓN)
 * =====================================================
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
        const fechaEl = document.getElementById('fechaDesplazamiento');
        if (fechaEl) {
            fechaEl.value = Utils.formatDate(new Date());
        }
    }
    
    async cargarPersonas() {
        try {
            this.personas = await API.getPersonas();
            
            const origenSelect = document.getElementById('personaOrigen');
            const destinoSelect = document.getElementById('personaDestino');
            
            if (origenSelect) {
                Utils.populateSelect(origenSelect, this.personas.filter(p => p.estado === 'Activo'));
            }
            if (destinoSelect) {
                Utils.populateSelect(destinoSelect, this.personas.filter(p => p.estado === 'Activo'));
            }
        } catch (error) {
            console.error('Error al cargar personas:', error);
            Utils.showToast('Error al cargar personas', 'error');
        }
    }
    
    async cargarBienes() {
        try {
            this.bienes = await API.getBienes();
        } catch (error) {
            console.error('Error al cargar bienes:', error);
            Utils.showToast('Error al cargar bienes', 'error');
        }
    }
    
    setupEventListeners() {
        document.getElementById('personaOrigen')?.addEventListener('change', (e) => {
            this.personaOrigenId = e.target.value ? parseInt(e.target.value) : null;
            this.cargarBienesDisponibles();
            this.habilitarBusqueda();
        });
        
        document.getElementById('personaDestino')?.addEventListener('change', (e) => {
            this.personaDestinoId = e.target.value ? parseInt(e.target.value) : null;
            this.validarFormularioCompleto();
        });
        
        document.getElementById('motivoDesplazamiento')?.addEventListener('change', () => {
            this.validarFormularioCompleto();
        });
        
        document.getElementById('buscadorBienes')?.addEventListener('input', () => this.filtrarBienesDisponibles());
        document.getElementById('btnBuscarBien')?.addEventListener('click', () => this.filtrarBienesDisponibles());
        
        document.getElementById('selectAllDisponibles')?.addEventListener('change', (e) => {
            this.seleccionarTodosDisponibles(e.target.checked);
        });
        
        document.getElementById('btnAgregarSeleccionados')?.addEventListener('click', () => {
            this.agregarBienesSeleccionados();
        });
        
        document.getElementById('btnConfirmarDesplazamiento')?.addEventListener('click', () => {
            this.confirmarDesplazamiento();
        });
    }
    
    habilitarBusqueda() {
        const buscador = document.getElementById('buscadorBienes');
        const btnBuscar = document.getElementById('btnBuscarBien');
        
        if (buscador && btnBuscar) {
            buscador.disabled = !this.personaOrigenId;
            btnBuscar.disabled = !this.personaOrigenId;
            buscador.placeholder = this.personaOrigenId ? '🔍 Buscar por código o nombre...' : 'Seleccione persona origen primero';
        }
    }
    
    cargarBienesDisponibles() {
        if (!this.personaOrigenId) {
            this.bienesDisponibles = [];
            this.renderizarBienesDisponibles();
            return;
        }
        
        this.bienesDisponibles = this.bienes.filter(b => 
            b.persona_id === this.personaOrigenId &&
            !this.bienesSeleccionados.some(bs => bs.id === b.id)
        );
        
        this.renderizarBienesDisponibles();
        this.actualizarResumen();
    }
    
    filtrarBienesDisponibles() {
        const termino = document.getElementById('buscadorBienes')?.value.toLowerCase() || '';
        
        if (!termino) {
            this.cargarBienesDisponibles();
            return;
        }
        
        this.bienesDisponibles = this.bienes.filter(b => {
            const codigo = b.cod_patrimonial || b.codigo_patrimonial || '';
            return b.persona_id === this.personaOrigenId &&
                   !this.bienesSeleccionados.some(bs => bs.id === b.id) &&
                   (codigo.toLowerCase().includes(termino) ||
                    b.nombre.toLowerCase().includes(termino));
        });
        
        this.renderizarBienesDisponibles();
    }
    
    renderizarBienesDisponibles() {
        const tbody = document.getElementById('bienesDisponiblesBody');
        if (!tbody) return;
        
        if (!this.personaOrigenId) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center">Seleccione persona origen</td></tr>`;
            return;
        }
        
        if (this.bienesDisponibles.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center">No hay bienes disponibles</td></tr>`;
            return;
        }
        
        tbody.innerHTML = this.bienesDisponibles.map(bien => `
            <tr>
                <td><input type="checkbox" class="check-bien-disponible" value="${bien.id}"></td>
                <td><strong>${bien.cod_patrimonial || bien.codigo_patrimonial}</strong></td>
                <td>${bien.nombre}</td>
                <td><span class="badge badge-${this.getEstadoClass(bien.estado)}">${bien.estado}</span></td>
            </tr>
        `).join('');
        
        const selectAll = document.getElementById('selectAllDisponibles');
        if (selectAll) selectAll.checked = false;
    }
    
    seleccionarTodosDisponibles(checked) {
        document.querySelectorAll('.check-bien-disponible').forEach(cb => {
            cb.checked = checked;
        });
    }
    
    agregarBienesSeleccionados() {
        const checkboxes = document.querySelectorAll('.check-bien-disponible:checked');
        
        if (checkboxes.length === 0) {
            Utils.showToast('Seleccione al menos un bien', 'warning');
            return;
        }
        
        const bienesIds = Array.from(checkboxes).map(cb => parseInt(cb.value));
        
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
        
        Utils.showToast(`✅ ${bienesIds.length} bien(es) agregado(s)`, 'success');
    }
    
    renderizarBienesSeleccionados() {
        const tbody = document.getElementById('bienesSeleccionadosBody');
        if (!tbody) return;
        
        if (this.bienesSeleccionados.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center">No hay bienes seleccionados</td></tr>`;
            return;
        }
        
        tbody.innerHTML = this.bienesSeleccionados.map(bien => `
            <tr>
                <td><strong>${bien.cod_patrimonial || bien.codigo_patrimonial}</strong></td>
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
        
        const totalEl = document.getElementById('totalBienesTransferir');
        const origenEl = document.getElementById('resumenOrigen');
        const destinoEl = document.getElementById('resumenDestino');
        
        if (totalEl) totalEl.textContent = this.bienesSeleccionados.length;
        if (origenEl) origenEl.textContent = personaOrigen?.nombre || '-';
        if (destinoEl) destinoEl.textContent = personaDestino?.nombre || '-';
    }
    
    validarFormularioCompleto() {
        const motivo = document.getElementById('motivoDesplazamiento')?.value;
        const btnConfirmar = document.getElementById('btnConfirmarDesplazamiento');
        const numeroInput = document.getElementById('numeroDesplazamiento');
        
        const esValido = this.personaOrigenId && 
                         this.personaDestinoId && 
                         this.personaOrigenId !== this.personaDestinoId &&
                         motivo &&
                         this.bienesSeleccionados.length > 0;
        
        if (btnConfirmar) btnConfirmar.disabled = !esValido;
        
        if (esValido && numeroInput) {
            const numero = `DESP-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${String(Math.floor(Math.random() * 999) + 1).padStart(3,'0')}`;
            numeroInput.value = numero;
        }
    }
    
    async confirmarDesplazamiento() {
        if (!await Utils.confirmar('¿Está seguro de realizar este desplazamiento?')) {
            return;
        }
        
        const desplazamientoData = {
            persona_origen_id: this.personaOrigenId,
            persona_destino_id: this.personaDestinoId,
            motivo: document.getElementById('motivoDesplazamiento')?.value,
            observacion: document.getElementById('observacionDesplazamiento')?.value || '',
            bienes_ids: this.bienesSeleccionados.map(b => b.id)
        };
        
        try {
            const response = await API.crearDesplazamiento(desplazamientoData);
            
            if (response.success) {
                Utils.showToast(`✅ Desplazamiento ${response.numero || ''} realizado exitosamente`, 'success');
                setTimeout(() => {
                    window.location.href = 'bienes.html';
                }, 1500);
            } else {
                Utils.showToast('❌ Error: ' + response.message, 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            Utils.showToast('❌ Error: ' + error.message, 'error');
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
    if (window.location.pathname.includes('desplazamiento.html')) {
        desplazamientoModule = new DesplazamientoModule();
        window.desplazamientoModule = desplazamientoModule;
    }
});