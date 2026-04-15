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
        console.log('📦 Cargando bienes desde API...');
        const bienesRaw = await API.getBienes();
        
        // ✅ Asegurar que los IDs sean números
        this.bienes = bienesRaw.map(b => ({
            ...b,
            id: parseInt(b.id)
        }));
        
        console.log('✅ Bienes cargados:', this.bienes.length);
    } catch (error) {
        console.error('❌ Error al cargar bienes:', error);
        Utils.showToast('Error al cargar bienes', 'error');
        this.bienes = [];
    }
}
    
    setupEventListeners() {
    // Persona origen
    document.getElementById('personaOrigen')?.addEventListener('change', (e) => {
        this.personaOrigenId = e.target.value ? parseInt(e.target.value) : null;
        console.log('👤 Persona origen seleccionada:', this.personaOrigenId); // Depuración
        this.cargarBienesDisponibles();
        this.habilitarBusqueda();
    });
    
    // Buscador - Evento input (mientras escribe)
    document.getElementById('buscadorBienes')?.addEventListener('input', () => {
        console.log('⌨️ Escribiendo en buscador...'); // Depuración
        this.filtrarBienesDisponibles();
    });
    
    // Buscador - Evento keypress (Enter)
    document.getElementById('buscadorBienes')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            console.log('⏎ Enter presionado en buscador');
            this.filtrarBienesDisponibles();
        }
    });
    
    // Botón Buscar
    document.getElementById('btnBuscarBien')?.addEventListener('click', () => {
        console.log('🔍 Botón Buscar clickeado'); // Depuración
        this.filtrarBienesDisponibles();
    });
    
    // Resto de eventos...
    document.getElementById('personaDestino')?.addEventListener('change', (e) => {
        this.personaDestinoId = e.target.value ? parseInt(e.target.value) : null;
        this.validarFormularioCompleto();
    });
    
    document.getElementById('motivoDesplazamiento')?.addEventListener('change', () => {
        this.validarFormularioCompleto();
    });
    
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
    }
    
    cargarBienesDisponibles() {
    if (!this.personaOrigenId) {
        this.bienesDisponibles = [];
        this.renderizarBienesDisponibles();
        return;
    }
    
    console.log('📋 Cargando bienes para persona:', this.personaOrigenId);
    
    // Filtrar bienes por persona origen y no seleccionados
    this.bienesDisponibles = this.bienes.filter(b => {
        const personaIdBien = b.persona_id || b.personaId;
        return personaIdBien == this.personaOrigenId &&
               !this.bienesSeleccionados.some(bs => bs.id === b.id);
    });
    
    console.log('📦 Bienes disponibles:', this.bienesDisponibles.length);
    
    // Limpiar el campo de búsqueda
    const buscador = document.getElementById('buscadorBienes');
    if (buscador) buscador.value = '';
    
    this.renderizarBienesDisponibles();
    this.actualizarResumen();
    }
    
    filtrarBienesDisponibles() {
    const termino = document.getElementById('buscadorBienes')?.value.toLowerCase().trim() || '';
    
    console.log('🔍 Filtrando por:', termino);
    
    if (!termino) {
        // Si no hay término de búsqueda, mostrar todos los disponibles
        this.cargarBienesDisponibles();
        return;
    }
    
    // Filtrar bienes que coincidan con el término
    this.bienesDisponibles = this.bienes.filter(b => {
        // Verificar que el bien pertenece a la persona origen
        const personaIdBien = b.persona_id || b.personaId;
        if (personaIdBien != this.personaOrigenId) return false;
        
        // Verificar que no esté ya seleccionado
        if (this.bienesSeleccionados.some(bs => bs.id === b.id)) return false;
        
        // Obtener campos para buscar (soportar diferentes nombres de campos)
        const codigo = (b.codigo_patrimonial || b.codigo_patrimonial || '').toLowerCase();
        const nombre = (b.nombre || '').toLowerCase();
        const descripcion = (b.descripcion || '').toLowerCase();
        
        // Buscar en código, nombre y descripción
        return codigo.includes(termino) || 
               nombre.includes(termino) || 
               descripcion.includes(termino);
    });
    
    console.log('📦 Resultados encontrados:', this.bienesDisponibles.length);
    
    // Mostrar mensaje si no hay resultados
    if (this.bienesDisponibles.length === 0) {
        console.log('⚠️ No se encontraron bienes que coincidan con "' + termino + '"');
    }
    
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
        tbody.innerHTML = `<tr><td colspan="4" class="text-center">No hay bienes disponibles para transferir</td></tr>`;
        return;
    }
    
    tbody.innerHTML = this.bienesDisponibles.map(bien => {
        const codigo = bien.codigo_patrimonial || bien.cod_patrimonial || 'N/A';
        const nombre = bien.nombre || 'N/A';
        const estado = bien.estado || 'N/A';
        
        return `
            <tr>
                <td><input type="checkbox" class="check-bien-disponible" value="${bien.id}"></td>
                <td><strong>${codigo}</strong></td>
                <td>${nombre}</td>
                <td><span class="badge badge-${this.getEstadoClass(estado)}">${estado}</span></td>
            </tr>
        `;
    }).join('');
    
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
    
    console.log('📦 Checkboxes seleccionados:', checkboxes.length);
    
    if (checkboxes.length === 0) {
        Utils.showToast('Seleccione al menos un bien para transferir', 'warning');
        return;
    }
    
    let agregados = 0;
    
    checkboxes.forEach(cb => {
        // ✅ CORREGIDO: Convertir a número y comparar correctamente
        const bienId = parseInt(cb.value);
        
        console.log('🔍 Buscando bien con ID:', bienId, 'Tipo:', typeof bienId);
        
        // Mostrar IDs disponibles para depuración
        console.log('IDs disponibles:', this.bienesDisponibles.map(b => ({ id: b.id, tipo: typeof b.id })));
        
        // Buscar el bien (comparando como número)
        const bien = this.bienesDisponibles.find(b => parseInt(b.id) === bienId);
        
        if (bien) {
            console.log('✅ Agregando bien:', bien.codigo_patrimonial || bien.cod_patrimonial, bien.nombre);
            
            this.bienesSeleccionados.push(bien);
            agregados++;
        } else {
            console.warn('⚠️ No se encontró el bien con ID:', bienId);
            console.log('Bienes disponibles:', this.bienesDisponibles);
        }
    });
    
    // Filtrar los bienes agregados de la lista de disponibles
    if (agregados > 0) {
        const idsAgregados = this.bienesSeleccionados.map(b => b.id);
        this.bienesDisponibles = this.bienesDisponibles.filter(b => !idsAgregados.includes(b.id));
    }
    
    console.log('📊 Total agregados:', agregados);
    console.log('📦 Seleccionados actuales:', this.bienesSeleccionados.length);
    
    // Renderizar ambas listas
    this.renderizarBienesDisponibles();
    this.renderizarBienesSeleccionados();
    this.actualizarResumen();
    this.validarFormularioCompleto();
    
    if (agregados > 0) {
        Utils.showToast(`✅ ${agregados} bien(es) agregado(s) para transferencia`, 'success');
        
        const selectAll = document.getElementById('selectAllDisponibles');
        if (selectAll) selectAll.checked = false;
    }
}
    
    renderizarBienesSeleccionados() {
    const tbody = document.getElementById('bienesSeleccionadosBody');
    if (!tbody) {
        console.error('❌ No se encontró el tbody de bienes seleccionados');
        return;
    }
    
    console.log('🎨 Renderizando bienes seleccionados:', this.bienesSeleccionados.length);
    
    if (this.bienesSeleccionados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center">No hay bienes seleccionados</td></tr>`;
        return;
    }
    
    tbody.innerHTML = this.bienesSeleccionados.map(bien => {
        const codigo = bien.codigo_patrimonial || bien.cod_patrimonial || 'N/A';
        const nombre = bien.nombre || 'N/A';
        const estado = bien.estado || 'N/A';
        
        return `
            <tr>
                <td><strong>${codigo}</strong></td>
                <td>${nombre}</td>
                <td><span class="badge badge-${this.getEstadoClass(estado)}">${estado}</span></td>
                <td>
                    <button class="btn-icon" onclick="desplazamientoModule.removerBienSeleccionado(${bien.id})" title="Quitar">
                        ❌
                    </button>
                </td>
            </tr>
        `;
    }).join('');
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