/**
 * Notification Service
 * Handles in-app notifications and alerts
 */

let NotificationService = {
    notifications: [],
    container: null,

    /**
     * Initialize notification service
     */
    init() {
        console.log('Initializing Notification Service...');
        this.createContainer();
    },

    /**
     * Create notification container
     */
    createContainer() {
        if (this.container) return;

        this.container = document.createElement('div');
        this.container.id = 'notificationContainer';
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
            pointer-events: none;
        `;
        document.body.appendChild(this.container);
    },

    /**
     * Show notification
     * @param {string} message - Notification message
     * @param {string} type - Notification type: success, error, warning, info
     * @param {number} duration - Duration in milliseconds (default: 5000)
     */
    show(message, type = 'info', duration = 5000) {
        if (!this.container) {
            this.createContainer();
        }

        const notification = this.createNotification(message, type);
        this.container.appendChild(notification);
        this.notifications.push(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        }, 10);

        // Auto remove after duration
        if (duration > 0) {
            setTimeout(() => {
                this.remove(notification);
            }, duration);
        }

        return notification;
    },

    /**
     * Create notification element
     */
    createNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const colors = {
            success: { bg: '#4caf50', icon: 'check-circle' },
            error: { bg: '#f44336', icon: 'exclamation-circle' },
            warning: { bg: '#ff9800', icon: 'exclamation-triangle' },
            info: { bg: '#2196f3', icon: 'info-circle' }
        };

        const config = colors[type] || colors.info;

        notification.style.cssText = `
            background: ${config.bg};
            color: white;
            padding: 16px 20px;
            border-radius: 8px;
            margin-bottom: 10px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 300px;
            transform: translateX(400px);
            opacity: 0;
            transition: all 0.3s ease;
            pointer-events: auto;
            cursor: pointer;
        `;

        notification.innerHTML = `
            <i class="fas fa-${config.icon}" style="font-size: 20px;"></i>
            <div style="flex: 1;">
                <p style="margin: 0; font-size: 14px; line-height: 1.4;">${message}</p>
            </div>
            <button onclick="NotificationService.remove(this.parentElement)" 
                    style="background: none; border: none; color: white; cursor: pointer; font-size: 18px; padding: 0; opacity: 0.8;">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Click to dismiss
        notification.addEventListener('click', (e) => {
            if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'I') {
                this.remove(notification);
            }
        });

        return notification;
    },

    /**
     * Remove notification
     */
    remove(notification) {
        if (!notification || !notification.parentElement) return;

        // Animate out
        notification.style.transform = 'translateX(400px)';
        notification.style.opacity = '0';

        setTimeout(() => {
            if (notification.parentElement) {
                notification.parentElement.removeChild(notification);
            }
            
            const index = this.notifications.indexOf(notification);
            if (index > -1) {
                this.notifications.splice(index, 1);
            }
        }, 300);
    },

    /**
     * Show success notification
     */
    success(message, duration = 5000) {
        return this.show(message, 'success', duration);
    },

    /**
     * Show error notification
     */
    error(message, duration = 5000) {
        return this.show(message, 'error', duration);
    },

    /**
     * Show warning notification
     */
    warning(message, duration = 5000) {
        return this.show(message, 'warning', duration);
    },

    /**
     * Show info notification
     */
    info(message, duration = 5000) {
        return this.show(message, 'info', duration);
    },

    /**
     * Show confirmation dialog
     * @param {string} message - Confirmation message
     * @param {function} onConfirm - Callback when confirmed
     * @param {function} onCancel - Callback when cancelled
     */
    confirm(message, onConfirm, onCancel) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
            animation: fadeIn 0.2s ease;
        `;

        overlay.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 12px; max-width: 400px; margin: 20px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);">
                <h3 style="margin: 0 0 15px 0; color: #333;">Confirm Action</h3>
                <p style="margin: 0 0 25px 0; color: #666; line-height: 1.5;">${message}</p>
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button id="confirmCancel" style="padding: 10px 20px; background: #e0e0e0; color: #333; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">
                        Cancel
                    </button>
                    <button id="confirmOk" style="padding: 10px 20px; background: #e91e63; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">
                        Confirm
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const okBtn = overlay.querySelector('#confirmOk');
        const cancelBtn = overlay.querySelector('#confirmCancel');

        const close = () => {
            overlay.remove();
        };

        okBtn.addEventListener('click', () => {
            close();
            if (onConfirm) onConfirm();
        });

        cancelBtn.addEventListener('click', () => {
            close();
            if (onCancel) onCancel();
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                close();
                if (onCancel) onCancel();
            }
        });
    },

    /**
     * Show loading notification
     * @param {string} message - Loading message
     * @returns {object} Notification element
     */
    showLoading(message = 'Loading...') {
        const notification = this.createNotification(message, 'info');
        notification.querySelector('.fa-info-circle').className = 'fas fa-spinner fa-spin';
        
        if (!this.container) {
            this.createContainer();
        }
        
        this.container.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        }, 10);

        return notification;
    },

    /**
     * Clear all notifications
     */
    clearAll() {
        this.notifications.forEach(notification => {
            this.remove(notification);
        });
        this.notifications = [];
    }
};

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    .notification {
        animation: slideIn 0.3s ease;
    }

    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        NotificationService.init();
    });
} else {
    NotificationService.init();
}

// Make available globally
window.NotificationService = NotificationService;