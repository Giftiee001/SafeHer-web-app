/**
 * Authentication Service
 * Handles user registration, login, and authentication
 */

const AuthService = {
    API_URL: 'http://localhost:5000/api/v1',

    /**
     * Initialize authentication service
     */
    init() {
        console.log('Initializing Auth Service...');
        this.setupForms();
    },

    /**
     * Set up authentication forms
     */
    setupForms() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Register form
        const registerForm = document.getElementById('registerForm');
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
                SafeHerApp.showView('register');
            });
        }

        // Switch to login
        const showLoginLink = document.getElementById('showLogin');
        if (showLoginLink) {
            showLoginLink.addEventListener('click', (e) => {
                e.preventDefault();
                SafeHerApp.showView('login');
            });
        }
    },

    /**
     * Handle user login
     */
    async handleLogin() {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const submitBtn = document.querySelector('#loginForm button[type="submit"]');

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
                
                // Show success message
                NotificationService.show('Login successful!', 'success');

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
        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const phone = document.getElementById('registerPhone').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;
        const submitBtn = document.querySelector('#registerForm button[type="submit"]');

        // Clear previous errors
        this.clearError('registerError');

        // Validate inputs
        if (!name || !email || !phone || !password || !confirmPassword) {
            this.showError('registerError', 'Please fill in all fields');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showError('registerError', 'Please enter a valid email address');
            return;
        }

        if (!this.isValidPhone(phone)) {
            this.showError('registerError', 'Please enter a valid phone number (e.g., +234-801-234-5678)');
            return;
        }

        if (password.length < 6) {
            this.showError('registerError', 'Password must be at least 6 characters long');
            return;
        }

        if (password !== confirmPassword) {
            this.showError('registerError', 'Passwords do not match');
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

                // Show success message
                NotificationService.show('Registration successful! Welcome to SafeHer!', 'success');

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
        // Accept formats: +234-801-234-5678, +2348012345678, 08012345678
        const phoneRegex = /^(\+234|0)[0-9]{10}$|^\+234-[0-9]{3}-[0-9]{3}-[0-9]{4}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
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
     * Logout user
     */
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        SafeHerApp.currentUser = null;
        SafeHerApp.showView('login');
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