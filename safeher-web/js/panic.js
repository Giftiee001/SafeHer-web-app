/**
 * Panic Button Service
 * Handles emergency panic button with 3-second hold activation
 */

let PanicService = {
    API_URL: 'https://safeher-web-app.onrender.com/api/v1',
    isActive: false,
    holdTimer: null,
    holdDuration: 3000, // 3 seconds
    countdownInterval: null,
    countdown: 3,

    /**
     * Initialize panic button
     */
    init() {
        console.log('Initializing Panic Button Service...');
        this.setupPanicButton();
    },

    /**
     * Set up panic button event listeners
     */
    setupPanicButton() {
        const panicBtn = document.getElementById('panicButton');
        if (!panicBtn) {
            console.warn('Panic button not found in DOM');
            return;
        }

        // Mouse/touch events
        panicBtn.addEventListener('mousedown', () => this.startHold());
        panicBtn.addEventListener('mouseup', () => this.cancelHold());
        panicBtn.addEventListener('mouseleave', () => this.cancelHold());
        
        panicBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startHold();
        });
        panicBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.cancelHold();
        });
        panicBtn.addEventListener('touchcancel', () => this.cancelHold());

        console.log('✓ Panic button initialized');
    },

    /**
     * Start hold timer
     */
    startHold() {
        if (this.isActive) return;

        console.log('Panic button hold started...');
        
        const panicBtn = document.getElementById('panicButton');
        const countdownEl = document.getElementById('panicCountdown');
        
        // Show countdown
        if (countdownEl) {
            countdownEl.style.display = 'block';
        }
        
        // Add pressed class
        if (panicBtn) {
            panicBtn.classList.add('pressed');
        }

        // Reset countdown
        this.countdown = 3;
        this.updateCountdown();

        // Start countdown animation
        this.countdownInterval = setInterval(() => {
            this.countdown--;
            this.updateCountdown();
            
            if (this.countdown <= 0) {
                clearInterval(this.countdownInterval);
            }
        }, 1000);

        // Set timer for activation
        this.holdTimer = setTimeout(() => {
            this.activatePanic();
        }, this.holdDuration);
    },

    /**
     * Cancel hold timer
     */
    cancelHold() {
        if (this.holdTimer) {
            console.log('Panic button hold cancelled');
            clearTimeout(this.holdTimer);
            this.holdTimer = null;
        }

        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }

        const panicBtn = document.getElementById('panicButton');
        const countdownEl = document.getElementById('panicCountdown');

        // Remove pressed class
        if (panicBtn) {
            panicBtn.classList.remove('pressed');
        }

        // Hide countdown
        if (countdownEl) {
            countdownEl.style.display = 'none';
        }

        this.countdown = 3;
    },

    /**
     * Update countdown display
     */
    updateCountdown() {
        const countdownEl = document.getElementById('panicCountdown');
        if (countdownEl) {
            countdownEl.textContent = this.countdown;
        }
    },

    /**
     * Activate panic alert
     */
    async activatePanic() {
        console.log('🚨 PANIC BUTTON ACTIVATED!');
        this.isActive = true;

        const panicBtn = document.getElementById('panicButton');
        const countdownEl = document.getElementById('panicCountdown');

        // Update UI
        if (panicBtn) {
            panicBtn.classList.remove('pressed');
            panicBtn.classList.add('activated');
            panicBtn.innerHTML = '<i class="fas fa-check-circle"></i><span>ALERT SENT!</span>';
        }

        if (countdownEl) {
            countdownEl.style.display = 'none';
        }

        // Vibrate device if supported
        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200, 100, 200]);
        }

        // Get current location
        let location = null;
        if (typeof LocationService !== 'undefined' && LocationService.currentPosition) {
            const pos = LocationService.currentPosition.coords;
            location = {
                latitude: pos.latitude,
                longitude: pos.longitude,
                accuracy: pos.accuracy
            };
        }

        // Send panic alert to server
        try {
            await this.sendPanicAlert(location);
        } catch (error) {
            console.error('Failed to send panic alert:', error);
            NotificationService.show('Alert activation failed. Please try again.', 'error');
        }

        // Show confirmation
        this.showActivationConfirmation();

        // Reset after 5 seconds
        setTimeout(() => {
            this.resetPanicButton();
        }, 5000);
    },

    /**
     * Send panic alert to server
     */
    async sendPanicAlert(location) {
        const token = localStorage.getItem('token');
        if (!token) {
            NotificationService.show('Please login to use panic button', 'error');
            return;
        }

        try {
            const response = await fetch(`${this.API_URL}/emergency/panic`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    location: location,
                    timestamp: new Date().toISOString(),
                    message: 'Emergency panic button activated'
                })
            });

            const data = await response.json();

            if (response.ok) {
                console.log('✓ Panic alert sent successfully');
                NotificationService.show('Emergency alert sent to your contacts!', 'success');
                
                // Show alert details
                if (data.data) {
                    console.log('Alert ID:', data.data.id);
                    console.log('Contacts notified:', data.contactsNotified || 'All');
                }
            } else {
                throw new Error(data.message || 'Failed to send alert');
            }

        } catch (error) {
            console.error('Error sending panic alert:', error);
            throw error;
        }
    },

    /**
     * Show activation confirmation modal
     */
    showActivationConfirmation() {
        // Create confirmation overlay
        const overlay = document.createElement('div');
        overlay.id = 'panicConfirmation';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
        `;

        overlay.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 15px; text-align: center; max-width: 400px; margin: 20px;">
                <div style="font-size: 60px; color: #e91e63; margin-bottom: 20px;">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h2 style="color: #333; margin-bottom: 15px;">Emergency Alert Activated!</h2>
                <p style="color: #666; margin-bottom: 20px;">
                    Your emergency contacts have been notified with your current location.
                </p>
                <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <p style="margin: 5px 0;"><strong>Status:</strong> Alert Sent</p>
                    <p style="margin: 5px 0;"><strong>Time:</strong> ${new Date().toLocaleTimeString()}</p>
                    ${LocationService.currentPosition ? `
                        <p style="margin: 5px 0;"><strong>Location:</strong> Shared</p>
                    ` : ''}
                </div>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button onclick="PanicService.callEmergency()" style="flex: 1; padding: 12px; background: #e91e63; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">
                        <i class="fas fa-phone"></i> Call Emergency Contact
                    </button>
                    <button onclick="PanicService.closeConfirmation()" style="flex: 1; padding: 12px; background: #666; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">
                        Close
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Auto-close after 10 seconds
        setTimeout(() => {
            this.closeConfirmation();
        }, 10000);
    },

    /**
     * Close confirmation modal
     */
    closeConfirmation() {
        const overlay = document.getElementById('panicConfirmation');
        if (overlay) {
            overlay.remove();
        }
    },

    /**
     * Call first emergency contact
     */
    callEmergency() {
        if (SafeHerApp.emergencyContacts.length > 0) {
            const contact = SafeHerApp.emergencyContacts[0];
            window.location.href = `tel:${contact.phone}`;
            this.closeConfirmation();
        } else {
            NotificationService.show('No emergency contacts available', 'warning');
        }
    },

    /**
     * Reset panic button to initial state
     */
    resetPanicButton() {
        this.isActive = false;
        
        const panicBtn = document.getElementById('panicButton');
        if (panicBtn) {
            panicBtn.classList.remove('activated');
            panicBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i><span>HOLD FOR 3 SECONDS</span>';
        }

        console.log('Panic button reset');
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        PanicService.init();
    });
} else {
    PanicService.init();
}

// Make available globally
window.PanicService = PanicService;