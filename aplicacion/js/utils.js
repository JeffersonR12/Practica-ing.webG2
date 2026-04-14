/**
 * =====================================================
 * 🛠️ UTILIDADES - FUNCIONES REUTILIZABLES
 * =====================================================
 */

const Utils = {
    // Formatear fecha a DD/MM/YYYY
    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    },
    
    formatDateTime(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    // Mostrar mensaje Toast
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.remove(), 3000);
    },
    
    // Mostrar modal de confirmación
    async confirmar(mensaje) {
        return new Promise((resolve) => {
            if (confirm(mensaje)) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    },
    
    // Validar código patrimonial (formato básico)
    validarCodigoPatrimonial(codigo) {
        return /^[A-Z0-9\-]{3,20}$/.test(codigo);
    },
    
    // Generar opciones para select
    populateSelect(selectElement, items, valueKey = 'id', textKey = 'nombre', emptyOption = '-- Seleccionar --') {
        selectElement.innerHTML = '';
        if (emptyOption) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = emptyOption;
            selectElement.appendChild(option);
        }
        items.forEach(item => {
            const option = document.createElement('option');
            option.value = item[valueKey];
            option.textContent = item[textKey];
            selectElement.appendChild(option);
        });
    },
    
    // Serializar formulario a objeto
    serializeForm(formElement) {
        const formData = new FormData(formElement);
        const data = {};
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        return data;
    },
    
    // Descargar archivo (para reportes PDF)
    downloadFile(content, filename, mimeType = 'application/pdf') {
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }
};

window.Utils = Utils;