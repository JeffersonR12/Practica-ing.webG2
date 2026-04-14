/**
 * =====================================================
 * 🚀 APP.JS - PUNTO DE ENTRADA PRINCIPAL
 * =====================================================
 * 
 * Este archivo inicializa la aplicación en dashboard.html
 * Maneja:
 * - Verificación de autenticación
 * - Carga del dashboard con estadísticas
 * - Inicialización de navegación global
 * - Gestión de estado de usuario
 * - Control de permisos
 * - Cierre de sesión
 * 
 * 🔧 INTEGRACIÓN PHP:
 * - Las estadísticas se cargan desde dashboard.php
 * - El usuario logueado se obtiene de localStorage/sessionStorage
 * - PHP maneja $_SESSION en el backend
 */

class App {
    constructor() {
        // Primero verificar autenticación
        if (!this.verificarAutenticacion()) {
            return; // Detener inicialización si no está autenticado
        }
        
        this.usuarioActual = null;
        this.permisos = [];
        this.init();
    }
    
    /**
     * Verifica si el usuario está autenticado
     * Si no lo está, redirige al login
     */
    verificarAutenticacion() {
        // Obtener token de localStorage o sessionStorage
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        const sessionExpiry = localStorage.getItem('session_expiry') || sessionStorage.getItem('session_expiry');
        
        // Verificar si existe token y no ha expirado
        if (!token || !sessionExpiry) {
            console.warn('No hay sesión activa');
            window.location.href = 'login.html?no_session=true';
            return false;
        }
        
        // Verificar expiración
        const now = new Date().getTime();
        if (now >= parseInt(sessionExpiry)) {
            console.warn('Sesión expirada');
            this.limpiarSesion();
            window.location.href = 'login.html?session_expired=true';
            return false;
        }
        
        return true;
    }
    
    /**
     * Limpia todos los datos de sesión
     */
    limpiarSesion() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        localStorage.removeItem('session_expiry');
        localStorage.removeItem('login_time');
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_name');
        localStorage.removeItem('user_id');
        
        sessionStorage.removeItem('auth_token');
        sessionStorage.removeItem('user_data');
        sessionStorage.removeItem('session_expiry');
    }
    
    /**
     * Inicialización principal
     */
    async init() {
        console.log('🚀 Inicializando Sistema de Gestión Patrimonial...');
        
        // Cargar datos del usuario
        this.cargarUsuarioActual();
        
        // Verificar permisos
        this.verificarPermisos();
        
        // Configurar UI según rol
        this.configurarUIporRol();
        
        // Cargar estadísticas del dashboard
        await this.cargarDashboardStats();
        
        // Inicializar navegación activa
        this.highlightActiveNav();
        
        // Configurar eventos globales
        this.setupGlobalEvents();
        
        // Mostrar información de sesión
        this.mostrarInfoSesion();
        
        // Iniciar monitor de inactividad
        this.iniciarMonitorInactividad();
        
        console.log('✅ Sistema inicializado correctamente');
    }
    
    /**
     * Carga los datos del usuario desde el storage
     */
    cargarUsuarioActual() {
        const userData = localStorage.getItem('user_data') || sessionStorage.getItem('user_data');
        
        if (userData) {
            try {
                this.usuarioActual = JSON.parse(userData);
                this.permisos = this.usuarioActual.permisos || [];
                
                // Actualizar UI con nombre de usuario
                this.actualizarUIUsuario();
            } catch (error) {
                console.error('Error al parsear datos de usuario:', error);
                this.usuarioActual = this.getUsuarioDefault();
            }
        } else {
            this.usuarioActual = this.getUsuarioDefault();
        }
        
        // Guardar en localStorage para acceso global
        if (this.usuarioActual) {
            localStorage.setItem('user_role', this.usuarioActual.rol || 'usuario');
            localStorage.setItem('user_name', this.usuarioActual.nombre || 'Usuario');
            localStorage.setItem('user_id', this.usuarioActual.id || '0');
        }
    }
    
    /**
     * Obtiene usuario por defecto (fallback)
     */
    getUsuarioDefault() {
        return {
            id: 0,
            nombre: 'Usuario',
            rol: 'usuario',
            area: 'General',
            permisos: ['ver_bienes']
        };
    }
    
    /**
     * Actualiza la UI con el nombre del usuario
     */
    actualizarUIUsuario() {
        const userSpan = document.querySelector('.nav-user span');
        const userNameDisplay = document.getElementById('userNameDisplay');
        
        if (userSpan) {
            userSpan.textContent = `👤 ${this.usuarioActual.nombre}`;
        }
        
        if (userNameDisplay) {
            userNameDisplay.textContent = this.usuarioActual.nombre;
        }
        
        // Mostrar rol si existe el elemento
        const roleDisplay = document.getElementById('userRoleDisplay');
        if (roleDisplay) {
            roleDisplay.textContent = this.usuarioActual.rol || 'Usuario';
        }
    }
    
    /**
     * Verifica y aplica permisos del usuario
     */
    verificarPermisos() {
        const rol = this.usuarioActual.rol;
        const permisos = this.usuarioActual.permisos || [];
        
        // Si es admin, tiene todos los permisos
        if (rol === 'admin' || permisos.includes('all')) {
            this.permisos = ['all'];
            return;
        }
        
        this.permisos = permisos;
    }
    
    /**
     * Configura la UI según el rol del usuario
     */
    configurarUIporRol() {
        const rol = this.usuarioActual.rol;
        
        // Elementos que requieren permisos específicos
        const elementosPorPermiso = {
            'gestionar_bienes': [
                '#btnNuevoBien',
                '#btnImportarExcel',
                '.btn-editar-bien',
                '.btn-eliminar-bien'
            ],
            'desplazar': [
                '.nav-link[href*="desplazamiento"]',
                '#btnDesplazar'
            ],
            'reportes': [
                '.nav-link[href*="reportes"]'
            ],
            'ver_historial': [
                '.nav-link[href*="historial"]'
            ],
            'admin': [
                '#adminPanel',
                '#configuracion',
                '#gestionUsuarios'
            ]
        };
        
        // Si es admin, mostrar todo
        if (rol === 'admin' || this.permisos.includes('all')) {
            return;
        }
        
        // Ocultar elementos según permisos
        for (const [permiso, selectores] of Object.entries(elementosPorPermiso)) {
            if (!this.permisos.includes(permiso)) {
                selectores.forEach(selector => {
                    const elementos = document.querySelectorAll(selector);
                    elementos.forEach(el => {
                        if (el) {
                            el.style.display = 'none';
                            // Si es un enlace de navegación, también ocultarlo
                            if (el.classList.contains('nav-link')) {
                                const parentLi = el.closest('li');
                                if (parentLi) parentLi.style.display = 'none';
                            }
                        }
                    });
                });
            }
        }
        
        // Mensaje de permisos limitados (opcional)
        console.log(`Usuario: ${this.usuarioActual.nombre} - Rol: ${rol} - Permisos: ${this.permisos.join(', ')}`);
    }
    
    /**
     * Muestra información de la sesión actual
     */
    mostrarInfoSesion() {
        const loginTime = localStorage.getItem('login_time') || sessionStorage.getItem('login_time');
        const sessionExpiry = localStorage.getItem('session_expiry') || sessionStorage.getItem('session_expiry');
        
        if (loginTime) {
            console.log(`Sesión iniciada: ${new Date(loginTime).toLocaleString()}`);
        }
        
        if (sessionExpiry) {
            const tiempoRestante = parseInt(sessionExpiry) - new Date().getTime();
            const horasRestantes = Math.floor(tiempoRestante / (1000 * 60 * 60));
            const minutosRestantes = Math.floor((tiempoRestante % (1000 * 60 * 60)) / (1000 * 60));
            
            console.log(`Sesión expira en: ${horasRestantes}h ${minutosRestantes}m`);
            
            // Mostrar en UI si existe el elemento
            const expiryDisplay = document.getElementById('sessionExpiryDisplay');
            if (expiryDisplay) {
                expiryDisplay.textContent = `${horasRestantes}h ${minutosRestantes}m`;
            }
        }
    }
    
    /**
     * Inicia monitor de inactividad
     * Cierra sesión después de 30 minutos de inactividad
     */
    iniciarMonitorInactividad() {
        let tiempoInactividad = 0;
        const tiempoLimite = 30 * 60 * 1000; // 30 minutos
        
        const resetearTimer = () => {
            tiempoInactividad = 0;
            localStorage.setItem('last_activity', new Date().toISOString());
        };
        
        const verificarInactividad = () => {
            const lastActivity = localStorage.getItem('last_activity');
            
            if (lastActivity) {
                const tiempoTranscurrido = new Date().getTime() - new Date(lastActivity).getTime();
                
                if (tiempoTranscurrido >= tiempoLimite) {
                    console.warn('Sesión cerrada por inactividad');
                    this.logout(true);
                }
            }
        };
        
        // Eventos que resetean el timer
        const eventos = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        eventos.forEach(evento => {
            document.addEventListener(evento, resetearTimer);
        });
        
        // Verificar cada minuto
        setInterval(verificarInactividad, 60000);
        
        // Inicializar
        resetearTimer();
    }
    
    /**
     * Carga las estadísticas para el dashboard
     * 🔧 PHP: Endpoint dashboard.php
     */
    async cargarDashboardStats() {
        try {
            // Verificar si estamos en el dashboard
            const isDashboard = window.location.pathname.includes('dashboard.html');
            if (!isDashboard) return;
            
            let stats;
            
            // 🔧 CAMBIAR A: const stats = await API.getDashboardStats();
            if (typeof CONFIG !== 'undefined' && CONFIG.USE_MOCK) {
                stats = await MockAPI.getDashboardStats();
            } else if (typeof API !== 'undefined') {
                stats = await API.getDashboardStats();
            } else {
                stats = this.getMockStats();
            }
            
            // Actualizar cards del dashboard
            this.actualizarDashboardCards(stats);
            
            // Si hay gráficos o información adicional
            if (stats.bienes_por_estado) {
                this.renderizarGraficoEstados(stats.bienes_por_estado);
            }
            
        } catch (error) {
            console.error('Error al cargar estadísticas:', error);
            this.mostrarValoresDefault();
        }
    }
    
    /**
     * Mock de estadísticas (fallback)
     */
    getMockStats() {
        return {
            total_bienes: 0,
            total_personas: 0,
            desplazamientos_hoy: 0,
            desplazamientos_mes: 0
        };
    }
    
    /**
     * Actualiza las cards del dashboard
     */
    actualizarDashboardCards(stats) {
        const totalBienesEl = document.getElementById('total-bienes');
        const desplazamientosHoyEl = document.getElementById('desplazamientos-hoy');
        const totalPersonasEl = document.getElementById('total-personas');
        const desplazamientosMesEl = document.getElementById('desplazamientos-mes');
        
        if (totalBienesEl) totalBienesEl.textContent = stats.total_bienes || 0;
        if (desplazamientosHoyEl) desplazamientosHoyEl.textContent = stats.desplazamientos_hoy || 0;
        if (totalPersonasEl) totalPersonasEl.textContent = stats.total_personas || 0;
        if (desplazamientosMesEl) desplazamientosMesEl.textContent = stats.desplazamientos_mes || 0;
    }
    
    /**
     * Muestra valores por defecto en caso de error
     */
    mostrarValoresDefault() {
        const elementos = ['total-bienes', 'desplazamientos-hoy', 'total-personas', 'desplazamientos-mes'];
        elementos.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = '--';
        });
    }
    
    /**
     * Renderiza un gráfico simple de bienes por estado
     */
    renderizarGraficoEstados(data) {
        const container = document.getElementById('grafico-estados');
        if (!container) return;
        
        const total = Object.values(data).reduce((a, b) => a + b, 0);
        
        let html = '<div class="estado-barras">';
        for (const [estado, cantidad] of Object.entries(data)) {
            const porcentaje = total > 0 ? (cantidad / total * 100).toFixed(1) : 0;
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
    
    /**
     * Resalta el enlace de navegación activo según la página actual
     */
    highlightActiveNav() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href) {
                // Extraer nombre de la página
                const pageName = href.split('/').pop().replace('.html', '');
                if (currentPath.includes(pageName)) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            }
        });
    }
    
    /**
     * Configura eventos globales
     */
    setupGlobalEvents() {
        // Cerrar modales con Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.cerrarTodosModales();
            }
        });
        
        // Cerrar modales al hacer clic fuera
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
        
        // Botón de logout
        const logoutBtn = document.getElementById('btnLogout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.confirmarLogout();
            });
        }
        
        // Botón de perfil
        const profileBtn = document.getElementById('btnPerfil');
        if (profileBtn) {
            profileBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.mostrarPerfil();
            });
        }
    }
    
    /**
     * Cierra todos los modales abiertos
     */
    cerrarTodosModales() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }
    
    /**
     * Confirma y ejecuta el cierre de sesión
     */
    confirmarLogout() {
        if (confirm('¿Está seguro de cerrar sesión?')) {
            this.logout(false);
        }
    }
    
    /**
     * Cierra sesión del usuario
     * @param {boolean} porInactividad - Si es true, muestra mensaje de inactividad
     */
    logout(porInactividad = false) {
        // 🔧 PHP: Llamar a logout.php para destruir $_SESSION
        if (typeof CONFIG !== 'undefined' && !CONFIG.USE_MOCK) {
            fetch(CONFIG.API_BASE_URL + 'logout.php', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + (localStorage.getItem('auth_token') || '')
                }
            }).finally(() => {
                this.limpiarSesion();
                const redirectUrl = porInactividad ? 'login.html?inactivity=true' : 'login.html?logout=success';
                window.location.href = redirectUrl;
            });
        } else {
            this.limpiarSesion();
            const redirectUrl = porInactividad ? 'login.html?inactivity=true' : 'login.html?logout=success';
            window.location.href = redirectUrl;
        }
    }
    
    /**
     * Muestra modal de perfil de usuario
     */
    mostrarPerfil() {
        // Crear modal dinámicamente
        const modalHtml = `
            <div class="modal" id="modalPerfil" style="display: block;">
                <div class="modal-content modal-sm">
                    <div class="modal-header">
                        <h2>👤 Perfil de Usuario</h2>
                        <span class="close" onclick="app.cerrarModalPerfil()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="perfil-info">
                            <div class="perfil-avatar">👤</div>
                            <h3>${this.usuarioActual.nombre}</h3>
                            <p><strong>Usuario:</strong> ${this.usuarioActual.usuario || 'N/A'}</p>
                            <p><strong>Email:</strong> ${this.usuarioActual.email || 'N/A'}</p>
                            <p><strong>Rol:</strong> ${this.usuarioActual.rol || 'Usuario'}</p>
                            <p><strong>Área:</strong> ${this.usuarioActual.area || 'General'}</p>
                            <p><strong>Sesión iniciada:</strong> ${new Date(localStorage.getItem('login_time') || Date.now()).toLocaleString()}</p>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="app.cerrarModalPerfil()">Cerrar</button>
                        <button class="btn btn-danger" onclick="app.confirmarLogout()">Cerrar Sesión</button>
                    </div>
                </div>
            </div>
        `;
        
        // Remover modal existente si hay
        const existingModal = document.getElementById('modalPerfil');
        if (existingModal) existingModal.remove();
        
        // Agregar nuevo modal
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }
    
    /**
     * Cierra modal de perfil
     */
    cerrarModalPerfil() {
        const modal = document.getElementById('modalPerfil');
        if (modal) modal.remove();
    }
    
    /**
     * Verifica si el usuario tiene un permiso específico
     */
    tienePermiso(permiso) {
        if (this.permisos.includes('all')) return true;
        return this.permisos.includes(permiso);
    }
    
    /**
     * Obtiene el rol del usuario actual
     */
    getRol() {
        return this.usuarioActual.rol || 'usuario';
    }
    
    /**
     * Refresca el token de sesión (extiende expiración)
     */
    refrescarSesion() {
        const rememberMe = localStorage.getItem('auth_token') !== null;
        const storage = rememberMe ? localStorage : sessionStorage;
        
        const nuevaExpiracion = rememberMe 
            ? new Date().getTime() + (30 * 24 * 60 * 60 * 1000) // 30 días
            : new Date().getTime() + (8 * 60 * 60 * 1000);      // 8 horas
        
        storage.setItem('session_expiry', nuevaExpiracion.toString());
        
        console.log('Sesión refrescada');
    }
}

// =====================================================
// FUNCIONES GLOBALES DE AUTENTICACIÓN
// =====================================================

/**
 * Verifica si el usuario está autenticado
 * Debe llamarse en todas las páginas protegidas
 */
function checkAuth() {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const sessionExpiry = localStorage.getItem('session_expiry') || sessionStorage.getItem('session_expiry');
    
    if (!token || !sessionExpiry) {
        redirectToLogin('no_session');
        return false;
    }
    
    const now = new Date().getTime();
    if (now >= parseInt(sessionExpiry)) {
        // Sesión expirada
        localStorage.clear();
        sessionStorage.clear();
        redirectToLogin('session_expired');
        return false;
    }
    
    return true;
}

/**
 * Redirige al login
 */
function redirectToLogin(reason = '') {
    const params = new URLSearchParams();
    if (reason) params.set(reason, 'true');
    
    const queryString = params.toString();
    const loginUrl = 'login.html' + (queryString ? '?' + queryString : '');
    
    window.location.href = loginUrl;
}

/**
 * Obtiene datos del usuario actual
 */
function getCurrentUser() {
    const userData = localStorage.getItem('user_data') || sessionStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
}

/**
 * Verifica si el usuario tiene un permiso específico
 */
function hasPermission(permission) {
    const user = getCurrentUser();
    if (!user || !user.permisos) return false;
    
    if (user.permisos.includes('all')) return true;
    return user.permisos.includes(permission);
}

/**
 * Obtiene el rol del usuario
 */
function getUserRole() {
    return localStorage.getItem('user_role') || sessionStorage.getItem('user_role') || 'guest';
}

// =====================================================
// INICIALIZACIÓN
// =====================================================

let app;

document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticación antes de inicializar
    // Solo verificar en páginas protegidas (no en login.html)
    const isLoginPage = window.location.pathname.includes('login.html');
    const isIndexPage = window.location.pathname.endsWith('index.html') || 
                        window.location.pathname.endsWith('/');
    
    if (!isLoginPage && !isIndexPage) {
        if (!checkAuth()) {
            return; // Detener si no está autenticado
        }
    }
    
    // Inicializar aplicación
    app = new App();
    window.app = app;
    
    // Exponer funciones globales
    window.checkAuth = checkAuth;
    window.getCurrentUser = getCurrentUser;
    window.hasPermission = hasPermission;
    window.getUserRole = getUserRole;
});

// =====================================================
// EXPORTACIONES (para módulos ES6 si se usan)
// =====================================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { App, checkAuth, getCurrentUser, hasPermission, getUserRole };
}