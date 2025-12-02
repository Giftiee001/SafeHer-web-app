/**
 * Authentication Service
 * Handles user registration, login, and authentication
 */

let AuthService = {
    API_URL: 'https://safeher-web-app.onrender.com/api/v1',

    /**
     * Initialize authentication service
     */
    init() {
        this.setupForms();
    },

    /**
     * Set up authentication forms
     */
    setupForms() {
        // Login form
        const loginForm = document.getElementById('loginFormElement');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Register form
        const registerForm = document.getElementById('registerFormElement');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }

        // Switch to register
        const showRegisterLink = document.getElementById('showRegister');
        if (showRegisterLink) {
            showRegisterLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showRegisterForm();
            });
        }

        // Switch to login
        const showLoginLink = document.getElementById('showLogin');
        if (showLoginLink) {
            showLoginLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLoginForm();
            });
        }
    },

    /**
     * Handle user login
     */
    async handleLogin() {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const submitBtn = document.querySelector('#loginFormElement button[type="submit"]');

        // Validate inputs
        if (!email || !password) {
            this.showError('loginError', 'Please fill in all fields');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showError('loginError', 'Please enter a valid email address');
            return;
        }

        // Disable button and show loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

        try {
            const response = await fetch(`${this.API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Save token and user data
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.data));

                // Update app state
                SafeHerApp.currentUser = data.data;

                // Hide auth screen and show main app
                document.getElementById('authScreen').classList.add('hidden');
                document.getElementById('mainApp').classList.remove('hidden');

                // Show success message
                NotificationService.show('Login successful!', 'success');

                // Initialize location service
                if (typeof LocationService !== 'undefined' && !LocationService.isTracking) {
                    LocationService.init();
                }

                // Redirect to home
                setTimeout(() => {
                    SafeHerApp.showView('home');
                }, 500);

            } else {
                this.showError('loginError', data.message || 'Login failed. Please try again.');
            }

        } catch (error) {
            console.error('Login error:', error);
            this.showError('loginError', 'Network error. Please check your connection and try again.');
        } finally {
            // Re-enable button
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
        }
    },

    /**
     * Handle user registration
     */
    async handleRegister() {
        const nameEl = document.getElementById('registerName');
        const emailEl = document.getElementById('registerEmail');
        const phoneEl = document.getElementById('registerPhone');
        const passwordEl = document.getElementById('registerPassword');

        if (!nameEl || !emailEl || !phoneEl || !passwordEl) {
            this.showError('registerError', 'Form not properly loaded. Please refresh the page.');
            return;
        }

        const name = nameEl.value.trim();
        const email = emailEl.value.trim();
        const phone = phoneEl.value.trim();
        const password = passwordEl.value;
        const submitBtn = document.querySelector('#registerFormElement button[type="submit"]');

        // Clear previous errors
        this.clearError('registerError');

        // Validate inputs
        if (!name || !email || !phone || !password) {
            this.showError('registerError', 'Please fill in all fields');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showError('registerError', 'Please enter a valid email address');
            return;
        }

        if (!this.isValidPhone(phone)) {
            this.showError('registerError', 'Please enter a valid phone number');
            return;
        }

        if (password.length < 6) {
            this.showError('registerError', 'Password must be at least 6 characters long');
            return;
        }

        // Disable button and show loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';

        try {
            const response = await fetch(`${this.API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, phone, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Save token and user data
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.data));

                // Update app state
                SafeHerApp.currentUser = data.data;

                // Hide auth screen and show main app
                document.getElementById('authScreen').classList.add('hidden');
                document.getElementById('mainApp').classList.remove('hidden');

                // Show success message
                NotificationService.show('Registration successful! Welcome to SafeHer!', 'success');

                // Initialize location service
                if (typeof LocationService !== 'undefined' && !LocationService.isTracking) {
                    LocationService.init();
                }

                // Redirect to home
                setTimeout(() => {
                    SafeHerApp.showView('home');
                }, 500);

            } else {
                this.showError('registerError', data.message || 'Registration failed. Please try again.');
            }

        } catch (error) {
            console.error('Registration error:', error);
            this.showError('registerError', 'Network error. Please check your connection and try again.');
        } finally {
            // Re-enable button
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Register';
        }
    },

    /**
     * Validate email format
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * Validate phone format
     */
    isValidPhone(phone) {
        // Accept international formats: +XXX followed by 9-15 digits
        // Also accept local formats starting with 0
        const cleanPhone = phone.replace(/[\s-]/g, '');
        const phoneRegex = /^(\+[1-9][0-9]{8,14}|0[0-9]{9,14})$/;
        return phoneRegex.test(cleanPhone);
    },

    /**
     * Show error message
     */
    showError(elementId, message) {
        const errorDiv = document.getElementById(elementId);
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                this.clearError(elementId);
            }, 5000);
        }
    },

    /**
     * Clear error message
     */
    clearError(elementId) {
        const errorDiv = document.getElementById(elementId);
        if (errorDiv) {
            errorDiv.textContent = '';
            errorDiv.style.display = 'none';
        }
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        const token = localStorage.getItem('token');
        return !!token;
    },

    /**
     * Get authentication token
     */
    getToken() {
        return localStorage.getItem('token');
    },

    /**
     * Get current user
     */
    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                return JSON.parse(userStr);
            } catch (error) {
                console.error('Error parsing user data:', error);
                return null;
            }
        }
        return null;
    },

    /**
     * Show login form
     */
    showLoginForm() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');

        if (loginForm) loginForm.classList.remove('hidden');
        if (registerForm) registerForm.classList.add('hidden');

        // Clear any errors
        this.clearError('loginError');
        this.clearError('registerError');
    },

    /**
     * Show register form
     */
    showRegisterForm() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');

        if (loginForm) loginForm.classList.add('hidden');
        if (registerForm) registerForm.classList.remove('hidden');

        // Clear any errors
        this.clearError('loginError');
        this.clearError('registerError');
    },

    /**
     * Logout user
     */
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        SafeHerApp.currentUser = null;

        // Show auth screen and login form
        const authScreen = document.getElementById('authScreen');
        const mainApp = document.getElementById('mainApp');

        if (authScreen) authScreen.classList.remove('hidden');
        if (mainApp) mainApp.classList.add('hidden');

        this.showLoginForm();
        NotificationService.show('Logged out successfully', 'success');
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        AuthService.init();
    });
} else {
    AuthService.init();
}

// Make available globally
window.AuthService = AuthService;