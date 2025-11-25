/**
 * SafeHer Main Application
 * Core application logic and navigation
 */

let SafeHerApp = {
    // API Configuration
    API_URL: 'http://localhost:5000/api/v1',
    currentUser: null,
    emergencyContacts: [],
    
    /**
     * Initialize application
     */
    init() {
        console.log('Initializing SafeHer App...');

        this.checkAuth();
        this.setupNavigation();
        this.setupEventListeners();

        console.log('✓ SafeHer App initialized');
    },

    /**
     * Check authentication status
     */
    checkAuth() {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');

        if (token && user) {
            try {
                this.currentUser = JSON.parse(user);
                console.log('User logged in:', this.currentUser.name);
                this.showView('home');
                this.updateUserDisplay();
                this.loadEmergencyContacts();

                if (typeof LocationService !== 'undefined' && !LocationService.isTracking) {
                    LocationService.init();
                }
            } catch (error) {
                console.error('Error parsing user data:', error);
                this.logout();
            }
        } else {
            console.log('No user logged in');
            this.showView('login');
        }
    },

    /**
     * Set up navigation
     */
    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = item.getAttribute('data-view');
                this.showView(view);

                navItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');

                const sidebar = document.getElementById('sidebar');
                if (sidebar) {
                    sidebar.classList.remove('active');
                }
            });
        });

        // Handle quick action cards
        const actionCards = document.querySelectorAll('.action-card[data-view]');
        actionCards.forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                const view = card.getAttribute('data-view');
                this.showView(view);
            });
        });

        // Share location button
        const shareLocationBtn = document.getElementById('shareLocationBtn');
        if (shareLocationBtn) {
            shareLocationBtn.addEventListener('click', () => {
                if (typeof LocationService !== 'undefined') {
                    LocationService.shareCurrentLocation();
                } else {
                    alert('Location service not available');
                }
            });
        }

        // Call helpline button
        const callHelplineBtn = document.getElementById('callHelplineBtn');
        if (callHelplineBtn) {
            callHelplineBtn.addEventListener('click', () => {
                // Nigerian emergency helpline
                window.location.href = 'tel:112';
            });
        }
    },

    /**
     * Show specific view
     */
    showView(viewName) {
        console.log('Showing view:', viewName);

        const authScreen = document.getElementById('authScreen');
        const mainApp = document.getElementById('mainApp');

        // Handle login/register views
        if (viewName === 'login' || viewName === 'register') {
            // Show auth screen, hide main app
            if (authScreen) authScreen.classList.remove('hidden');
            if (mainApp) mainApp.classList.add('hidden');

            // Toggle between login and register forms
            if (viewName === 'login') {
                window.AuthService.showLoginForm();
            } else {
                window.AuthService.showRegisterForm();
            }
            return;
        }

        // Show main app, hide auth screen for all other views
        if (authScreen) authScreen.classList.add('hidden');
        if (mainApp) mainApp.classList.remove('hidden');

        // Hide all views
        const views = document.querySelectorAll('.view');
        views.forEach(view => view.classList.remove('active'));

        // Show requested view
        const targetView = document.getElementById(`${viewName}View`);
        if (targetView) {
            targetView.classList.add('active');
        }

        // Load view-specific data
        this.loadViewData(viewName);

        // Reinitialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    },

    /**
     * Load data for specific view
     */
    loadViewData(viewName) {
        switch(viewName) {
            case 'home':
                this.loadEmergencyContacts();
                break;
            case 'healthcare':
                if (typeof HealthcareService !== 'undefined') {
                    HealthcareService.loadProviders();
                }
                break;
            case 'contacts':
                this.displayEmergencyContacts();
                break;
            case 'profile':
                this.loadUserProfile();
                break;
        }
    },

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        const menuBtn = document.getElementById('menuBtn');
        const closeSidebar = document.getElementById('closeSidebar');
        const sidebar = document.getElementById('sidebar');

        if (menuBtn && sidebar) {
            menuBtn.addEventListener('click', () => {
                sidebar.classList.add('active');
            });
        }

        if (closeSidebar && sidebar) {
            closeSidebar.addEventListener('click', () => {
                sidebar.classList.remove('active');
            });
        }

        const addContactBtn = document.getElementById('addContactBtn');
        const addContactForm = document.getElementById('addContactForm');
        const cancelContactBtn = document.getElementById('cancelContactBtn');

        if (addContactBtn && addContactForm) {
            addContactBtn.addEventListener('click', () => {
                addContactForm.classList.remove('hidden');
            });
        }

        if (cancelContactBtn && addContactForm) {
            cancelContactBtn.addEventListener('click', () => {
                addContactForm.classList.add('hidden');
                document.getElementById('contactFormElement').reset();
            });
        }

        const contactFormElement = document.getElementById('contactFormElement');
        if (contactFormElement) {
            contactFormElement.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addEmergencyContact();
            });
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        const editProfileBtn = document.getElementById('editProfileBtn');
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => {
                NotificationService.show('Profile editing coming soon!', 'info');
            });
        }

        const notificationBtn = document.getElementById('notificationBtn');
        if (notificationBtn) {
            notificationBtn.addEventListener('click', () => {
                NotificationService.show('No new notifications', 'info');
            });
        }
    },

    /**
     * Update user display in header
     */
    updateUserDisplay() {
        const userName = document.getElementById('userName');
        if (userName && this.currentUser) {
            userName.textContent = this.currentUser.name;
        }
    },

    /**
     * Load emergency contacts
     */
    async loadEmergencyContacts() {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(`${this.API_URL}/emergency/contacts`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.emergencyContacts = data.data || [];
                console.log('Emergency contacts loaded:', this.emergencyContacts.length);
                this.displayEmergencyContacts();
            }
        } catch (error) {
            console.error('Error loading contacts:', error);
        }
    },

    /**
     * Display emergency contacts
     */
    displayEmergencyContacts() {
        const contactsList = document.getElementById('contactsList');
        if (!contactsList) return;

        if (this.emergencyContacts.length === 0) {
            contactsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-user-friends"></i>
                    <p>No emergency contacts added yet</p>
                    <button onclick="SafeHerApp.showAddContactForm()" class="btn btn-primary">
                        Add First Contact
                    </button>
                </div>
            `;
            return;
        }

        contactsList.innerHTML = this.emergencyContacts.map(contact => `
            <div class="contact-card">
                <div class="contact-info">
                    <h3>${contact.name}</h3>
                    <p><i class="fas fa-phone"></i> ${contact.phone}</p>
                    <p><i class="fas fa-heart"></i> ${contact.relationship}</p>
                </div>
                <div class="contact-actions">
                    <button onclick="SafeHerApp.callContact('${contact.phone}')" class="btn-icon">
                        <i class="fas fa-phone"></i>
                    </button>
                    <button onclick="SafeHerApp.deleteContact('${contact.id}')" class="btn-icon btn-danger">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    },

    /**
     * Show add contact form
     */
    showAddContactForm() {
        const modal = document.getElementById('addContactModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    },

    /**
     * Hide add contact form
     */
    hideAddContactForm() {
        const modal = document.getElementById('addContactModal');
        if (modal) {
            modal.style.display = 'none';
        }
        
        // Reset form
        const form = document.getElementById('addContactForm');
        if (form) {
            form.reset();
        }
    },

    /**
     * Add emergency contact
     */
    async addEmergencyContact() {
        const name = document.getElementById('contactName').value;
        const phone = document.getElementById('contactPhone').value;
        const relationship = document.getElementById('contactRelation').value;

        const token = localStorage.getItem('token');
        if (!token) {
            NotificationService.show('Please login first', 'error');
            return;
        }

        try {
            const response = await fetch(`${this.API_URL}/emergency/contacts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name, phone, relationship })
            });

            const data = await response.json();

            if (response.ok) {
                NotificationService.show('Contact added successfully!', 'success');
                const addContactForm = document.getElementById('addContactForm');
                if (addContactForm) {
                    addContactForm.classList.add('hidden');
                }
                document.getElementById('contactFormElement').reset();
                this.loadEmergencyContacts();
            } else {
                NotificationService.show(data.message || 'Failed to add contact', 'error');
            }
        } catch (error) {
            console.error('Error adding contact:', error);
            NotificationService.show('Failed to add contact', 'error');
        }
    },

    /**
     * Delete emergency contact
     */
    async deleteContact(contactId) {
        if (!confirm('Are you sure you want to delete this contact?')) {
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(`${this.API_URL}/emergency/contacts/${contactId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                NotificationService.show('Contact deleted', 'success');
                this.loadEmergencyContacts();
            } else {
                NotificationService.show('Failed to delete contact', 'error');
            }
        } catch (error) {
            console.error('Error deleting contact:', error);
            NotificationService.show('Failed to delete contact', 'error');
        }
    },

    /**
     * Call emergency contact
     */
    callContact(phone) {
        window.location.href = `tel:${phone}`;
    },

    /**
     * Load user profile
     */
    loadUserProfile() {
        if (!this.currentUser) return;

        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        const profilePhone = document.getElementById('profilePhone');
        const profileContactsCount = document.getElementById('profileContactsCount');

        if (profileName) profileName.textContent = this.currentUser.name || '-';
        if (profileEmail) profileEmail.textContent = this.currentUser.email || '-';
        if (profilePhone) profilePhone.textContent = this.currentUser.phone || '-';
        if (profileContactsCount) profileContactsCount.textContent = this.emergencyContacts.length;
    },

    /**
     * Update user profile
     */
    async updateProfile() {
        const name = document.getElementById('profileName').value;
        const phone = document.getElementById('profilePhone').value;

        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(`${this.API_URL}/auth/update-details`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name, phone })
            });

            const data = await response.json();

            if (response.ok) {
                this.currentUser = data.data;
                localStorage.setItem('user', JSON.stringify(this.currentUser));
                NotificationService.show('Profile updated successfully!', 'success');
                this.updateUserDisplay();
            } else {
                NotificationService.show(data.message || 'Failed to update profile', 'error');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            NotificationService.show('Failed to update profile', 'error');
        }
    },

    /**
     * Logout user
     */
    logout() {
        console.log('Logging out...');
        
        // Clear local storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Reset app state
        this.currentUser = null;
        this.emergencyContacts = [];
        
        // Stop location tracking
        if (typeof LocationService !== 'undefined' && LocationService.isTracking) {
            LocationService.stopTracking();
        }
        
        // Show login view
        this.showView('login');
        
        NotificationService.show('Logged out successfully', 'success');
    }
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        SafeHerApp.init();
    });
} else {
    SafeHerApp.init();
}

// Make available globally
window.SafeHerApp = SafeHerApp;