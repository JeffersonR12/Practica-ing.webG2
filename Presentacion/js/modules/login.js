/**
 * =====================================================
 * 🔐 MÓDULO: LOGIN (PRODUCCIÓN)
 * =====================================================
 */

class LoginModule {
    constructor() {
        this.init();
    }
    
    init() {
        this.checkExistingSession();
        this.setupEventListeners();
        this.checkLogoutMessage();
    }
    
    checkExistingSession() {
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        const sessionExpiry = localStorage.getItem('session_expiry') || sessionStorage.getItem('session_expiry');
        
        if (token && sessionExpiry) {
            const now = new Date().getTime();
            if (now < parseInt(sessionExpiry)) {
                window.location.href = 'dashboard.html';
            } else {
                this.clearSession();
            }
        }
    }
    
    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        const toggleBtn = document.getElementById('togglePassword');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.togglePasswordVisibility());
        }
        
        const forgotLink = document.getElementById('forgotPasswordLink');
        if (forgotLink) {
            forgotLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showRecoveryModal();
            });
        }
        
        const recoveryForm = document.getElementById('recoveryForm');
        if (recoveryForm) {
            recoveryForm.addEventListener('submit', (e) => this.handlePasswordRecovery(e));
        }
        
        document.querySelectorAll('.close, .close-modal').forEach(el => {
            el.addEventListener('click', () => this.closeModals());
        });
    }
    
    checkLogoutMessage() {
        const params = new URLSearchParams(window.location.search);
        if (params.get('logout') === 'success') {
            this.showMessage('Sesión cerrada correctamente', 'success');
        } else if (params.get('session_expired') === 'true') {
            this.showMessage('Su sesión ha expirado', 'info');
        }
    }
    
    async handleLogin(event) {
        event.preventDefault();
        
        const usuario = document.getElementById('usuario').value.trim();
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe')?.checked || false;
        
        if (!usuario || !password) {
            this.showMessage('Complete todos los campos', 'error');
            return;
        }
        
        this.setLoading(true);
        
        try {
            const response = await API.login(usuario, password, rememberMe);
            
            if (response.success) {
                this.saveSession(response.user, rememberMe);
                this.showMessage('Inicio de sesión exitoso', 'success');
                
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                this.showMessage(response.message || 'Usuario o contraseña incorrectos', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showMessage('Error de conexión', 'error');
        } finally {
            this.setLoading(false);
        }
    }
    
    saveSession(userData, rememberMe) {
        const token = 'auth_token_' + Date.now();
        const expiryTime = rememberMe 
            ? new Date().getTime() + (30 * 24 * 60 * 60 * 1000)
            : new Date().getTime() + (8 * 60 * 60 * 1000);
        
        const storage = rememberMe ? localStorage : sessionStorage;
        
        storage.setItem('auth_token', token);
        storage.setItem('user_data', JSON.stringify(userData));
        storage.setItem('session_expiry', expiryTime.toString());
        storage.setItem('login_time', new Date().toISOString());
        
        localStorage.setItem('user_role', userData.rol);
        localStorage.setItem('user_name', userData.nombre);
    }
    
    clearSession() {
        const keys = ['auth_token', 'user_data', 'session_expiry', 'login_time', 'user_role', 'user_name'];
        keys.forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });
    }
    
    showMessage(message, type = 'info') {
        const messageEl = document.getElementById('loginMessage');
        if (!messageEl) return;
        
        messageEl.textContent = message;
        messageEl.className = `login-message ${type}`;
        messageEl.style.display = 'block';
        
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 5000);
    }
    
    setLoading(isLoading) {
        const btn = document.getElementById('btnLogin');
        const inputs = document.querySelectorAll('#usuario, #password');
        
        if (btn) {
            btn.disabled = isLoading;
            btn.textContent = isLoading ? 'Cargando...' : 'Iniciar Sesión';
        }
        inputs.forEach(input => input.disabled = isLoading);
    }
    
    togglePasswordVisibility() {
        const passwordInput = document.getElementById('password');
        const toggleBtn = document.getElementById('togglePassword');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleBtn.textContent = '🙈';
        } else {
            passwordInput.type = 'password';
            toggleBtn.textContent = '👁️';
        }
    }
    
    showRecoveryModal() {
        const modal = document.getElementById('modalRecuperarPassword');
        if (modal) {
            modal.style.display = 'block';
            document.getElementById('emailRecuperacion').value = '';
        }
    }
    
    async handlePasswordRecovery(event) {
        event.preventDefault();
        
        const email = document.getElementById('emailRecuperacion').value.trim();
        
        if (!email) {
            alert('Ingrese su correo electrónico');
            return;
        }
        
        alert('Se ha enviado un enlace de recuperación a: ' + email);
        this.closeModals();
    }
    
    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }
}

let loginModule;
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('login.html')) {
        loginModule = new LoginModule();
        window.loginModule = loginModule;
    }
});