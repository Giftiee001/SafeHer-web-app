/**
 * Location Service - Enhanced with better error handling
 * Handles GPS tracking and location-based features
 */

const LocationService = {
    currentPosition: null,
    watchId: null,
    isTracking: false,

    /**
     * Initialize location services with better error handling
     */
    init() {
        console.log('Initializing location service...');
        
        // Check if geolocation is supported
        if (!navigator.geolocation) {
            console.error('Geolocation is not supported by this browser');
            this.showError('Your browser does not support location services');
            return false;
        }

        console.log('✓ Geolocation is supported');
        
        // Request permission immediately
        this.requestPermission();
        return true;
    },

    /**
     * Request location permission with user-friendly prompts
     */
    requestPermission() {
        console.log('Requesting location permission...');
        
        // Show loading indicator
        this.showStatus('Requesting location access...', 'info');

        navigator.geolocation.getCurrentPosition(
            (position) => {
                console.log('✓ Location permission granted');
                this.currentPosition = position;
                this.showStatus('Location access granted!', 'success');
                this.handleSuccess(position);
            },
            (error) => {
                console.error('✗ Location error:', error);
                this.handleError(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    },

    /**
     * Handle successful location access
     */
    handleSuccess(position) {
        this.currentPosition = position;
        const { latitude, longitude, accuracy } = position.coords;
        
        console.log('Current location:', {
            lat: latitude,
            lng: longitude,
            accuracy: accuracy
        });

        // Update UI if there's a location display element
        const locationDisplay = document.getElementById('currentLocation');
        if (locationDisplay) {
            locationDisplay.innerHTML = `
                <div class="location-info">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}</span>
                    <small>Accuracy: ±${Math.round(accuracy)}m</small>
                </div>
            `;
        }

        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('locationUpdated', { 
            detail: { latitude, longitude, accuracy } 
        }));
    },

    /**
     * Enhanced error handling with user-friendly messages
     */
    handleError(error) {
        let errorMessage = '';
        let helpText = '';

        switch(error.code) {
            case error.PERMISSION_DENIED:
                errorMessage = 'Location access denied';
                helpText = `
                    <p>Please enable location access:</p>
                    <ol style="text-align: left; margin: 10px 20px;">
                        <li>Click the lock icon in your browser's address bar</li>
                        <li>Find "Location" permission</li>
                        <li>Select "Allow"</li>
                        <li>Refresh the page</li>
                    </ol>
                    <p><strong>Alternative:</strong> You can still use the app by manually entering your location when needed.</p>
                `;
                break;
            
            case error.POSITION_UNAVAILABLE:
                errorMessage = 'Location information unavailable';
                helpText = 'Please check your device\'s location settings and try again.';
                break;
            
            case error.TIMEOUT:
                errorMessage = 'Location request timed out';
                helpText = 'Please try again. Make sure you have a clear view of the sky if using GPS.';
                break;
            
            default:
                errorMessage = 'Unknown location error';
                helpText = 'Please try refreshing the page or contact support.';
        }

        console.error('Location error:', errorMessage, error);
        this.showError(errorMessage, helpText);
    },

    /**
     * Show error message to user
     */
    showError(message, helpText = '') {
        // Create or update error display
        let errorDiv = document.getElementById('locationError');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'locationError';
            errorDiv.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: #fee;
                border: 2px solid #f00;
                padding: 15px 20px;
                border-radius: 8px;
                max-width: 500px;
                z-index: 10000;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            `;
            document.body.appendChild(errorDiv);
        }

        errorDiv.innerHTML = `
            <div style="display: flex; align-items: start; gap: 10px;">
                <i class="fas fa-exclamation-triangle" style="color: #f00; font-size: 20px;"></i>
                <div style="flex: 1;">
                    <strong style="color: #d00; display: block; margin-bottom: 5px;">${message}</strong>
                    ${helpText ? `<div style="font-size: 14px; color: #666;">${helpText}</div>` : ''}
                    <button onclick="LocationService.requestPermission()" 
                            style="margin-top: 10px; padding: 8px 16px; background: #e91e63; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Try Again
                    </button>
                    <button onclick="document.getElementById('locationError').remove()" 
                            style="margin-top: 10px; margin-left: 10px; padding: 8px 16px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Dismiss
                    </button>
                </div>
            </div>
        `;

        // Auto-dismiss after 30 seconds
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 30000);
    },

    /**
     * Show status message
     */
    showStatus(message, type = 'info') {
        const colors = {
            info: { bg: '#e3f2fd', border: '#2196f3', text: '#1976d2' },
            success: { bg: '#e8f5e9', border: '#4caf50', text: '#2e7d32' },
            warning: { bg: '#fff3e0', border: '#ff9800', text: '#f57c00' }
        };

        const color = colors[type] || colors.info;

        let statusDiv = document.getElementById('locationStatus');
        if (!statusDiv) {
            statusDiv = document.createElement('div');
            statusDiv.id = 'locationStatus';
            statusDiv.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${color.bg};
                border: 2px solid ${color.border};
                color: ${color.text};
                padding: 12px 20px;
                border-radius: 8px;
                max-width: 300px;
                z-index: 10000;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            `;
            document.body.appendChild(statusDiv);
        }

        statusDiv.style.background = color.bg;
        statusDiv.style.borderColor = color.border;
        statusDiv.style.color = color.text;
        statusDiv.textContent = message;

        // Auto-dismiss success/info messages
        if (type !== 'warning') {
            setTimeout(() => {
                if (statusDiv.parentElement) {
                    statusDiv.remove();
                }
            }, 5000);
        }
    },

    /**
     * Get current position
     */
    async getCurrentPosition() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.currentPosition = position;
                    resolve(position);
                },
                (error) => {
                    this.handleError(error);
                    reject(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 5000
                }
            );
        });
    },

    /**
     * Start watching position (continuous tracking)
     */
    startTracking() {
        if (this.isTracking) {
            console.log('Already tracking location');
            return;
        }

        if (!navigator.geolocation) {
            this.showError('Geolocation not supported');
            return;
        }

        console.log('Starting location tracking...');
        this.showStatus('Starting location tracking...', 'info');

        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                this.currentPosition = position;
                console.log('Location updated:', position.coords);
                
                // Dispatch update event
                window.dispatchEvent(new CustomEvent('locationUpdated', {
                    detail: position
                }));
            },
            (error) => {
                console.error('Tracking error:', error);
                this.handleError(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );

        this.isTracking = true;
        this.showStatus('Location tracking active', 'success');
    },

    /**
     * Stop watching position
     */
    stopTracking() {
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
            this.isTracking = false;
            console.log('Location tracking stopped');
            this.showStatus('Location tracking stopped', 'info');
        }
    },

    /**
     * Calculate distance between two coordinates (Haversine formula)
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        return distance; // in km
    },

    /**
     * Convert degrees to radians
     */
    toRad(degrees) {
        return degrees * Math.PI / 180;
    },

    /**
     * Get formatted location string
     */
    getLocationString() {
        if (!this.currentPosition) {
            return 'Location not available';
        }

        const { latitude, longitude } = this.currentPosition.coords;
        return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    },

    /**
     * Get Google Maps link
     */
    getGoogleMapsLink() {
        if (!this.currentPosition) {
            return null;
        }

        const { latitude, longitude } = this.currentPosition.coords;
        return `https://www.google.com/maps?q=${latitude},${longitude}`;
    }
};

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        LocationService.init();
    });
} else {
    LocationService.init();
}

// Make available globally
window.LocationService = LocationService;