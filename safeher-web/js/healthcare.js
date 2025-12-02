/**
 * Healthcare Service
 * Handles healthcare provider directory and search
 */

let HealthcareService = {
    API_URL: 'https://safeher-web-app.onrender.com/api/v1',
    providers: [],
    filteredProviders: [],

    /**
     * Initialize healthcare service
     */
    init() {
        console.log('Initializing Healthcare Service...');
        this.setupSearch();
        this.loadProviders();
    },

    /**
     * Set up search and filter functionality
     */
    setupSearch() {
        const searchInput = document.getElementById('healthcareSearch');
        const typeFilter = document.getElementById('typeFilter');
        const sortBy = document.getElementById('sortBy');

        if (searchInput) {
            searchInput.addEventListener('input', () => {
                this.filterProviders();
            });
        }

        if (typeFilter) {
            typeFilter.addEventListener('change', () => {
                this.filterProviders();
            });
        }

        if (sortBy) {
            sortBy.addEventListener('change', () => {
                this.sortProviders();
            });
        }
    },

    /**
     * Load healthcare providers
     */
    async loadProviders() {
        console.log('Loading healthcare providers...');
        
        // Show loading state
        this.showLoading();

        try {
            const token = localStorage.getItem('token');
            const headers = {};
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${this.API_URL}/healthcare/providers`, {
                headers: headers
            });

            if (response.ok) {
                const data = await response.json();
                this.providers = data.data || [];
                this.filteredProviders = [...this.providers];
                console.log(`✓ Loaded ${this.providers.length} healthcare providers`);
                this.displayProviders();
            } else {
                // If API fails, use sample data
                this.loadSampleData();
            }

        } catch (error) {
            console.error('Error loading providers:', error);
            // Use sample data as fallback
            this.loadSampleData();
        }
    },

    /**
     * Load sample healthcare data for Nigeria
     */
    loadSampleData() {
        console.log('Using sample healthcare data...');
        
        this.providers = [
            {
                id: '1',
                name: 'Lagos University Teaching Hospital (LUTH)',
                type: 'hospital',
                address: 'Idi-Araba, Surulere, Lagos',
                phone: '+234-1-805-6346',
                emergency_line: '112',
                services: ['Emergency Care', 'Maternity', 'Surgery', 'Pediatrics'],
                hours: '24/7',
                latitude: 6.5027,
                longitude: 3.3564,
                rating: 4.2
            },
            {
                id: '2',
                name: 'Gbagada General Hospital',
                type: 'hospital',
                address: 'Gbagada-Oshodi Expressway, Lagos',
                phone: '+234-1-773-6538',
                emergency_line: '112',
                services: ['Emergency Care', 'Maternity', 'General Medicine'],
                hours: '24/7',
                latitude: 6.5486,
                longitude: 3.3903,
                rating: 3.8
            },
            {
                id: '3',
                name: 'Reddington Hospital',
                type: 'hospital',
                address: '12 Idowu Martins Street, Victoria Island, Lagos',
                phone: '+234-1-631-1551',
                emergency_line: '+234-1-631-1551',
                services: ['Emergency Care', 'Maternity', 'Surgery', 'Diagnostics'],
                hours: '24/7',
                latitude: 6.4281,
                longitude: 3.4219,
                rating: 4.5
            },
            {
                id: '4',
                name: 'First Care Women\'s Clinic',
                type: 'clinic',
                address: 'Plot 5, Block A2, Saka Tinubu, Victoria Island, Lagos',
                phone: '+234-1-270-9191',
                emergency_line: '+234-802-345-6789',
                services: ['Women\'s Health', 'Maternity', 'Family Planning'],
                hours: 'Mon-Fri: 8AM-6PM, Sat: 9AM-2PM',
                latitude: 6.4308,
                longitude: 3.4275,
                rating: 4.7
            },
            {
                id: '5',
                name: 'Cedarcrest Hospitals',
                type: 'hospital',
                address: 'Plot 1B, Udi Street, Osborne Phase II, Ikoyi, Lagos',
                phone: '+234-1-291-9191',
                emergency_line: '+234-1-291-9191',
                services: ['Emergency Care', 'Maternity', 'Pediatrics', 'Gynecology'],
                hours: '24/7',
                latitude: 6.4604,
                longitude: 3.4299,
                rating: 4.3
            },
            {
                id: '6',
                name: 'Lagoon Hospitals',
                type: 'hospital',
                address: 'Murtala Muhammed Drive, Ikoyi, Lagos',
                phone: '+234-1-271-0847',
                emergency_line: '+234-1-271-0847',
                services: ['Emergency Care', 'Surgery', 'Maternity', 'Diagnostics'],
                hours: '24/7',
                latitude: 6.4484,
                longitude: 3.4348,
                rating: 4.4
            },
            {
                id: '7',
                name: 'St. Nicholas Hospital',
                type: 'hospital',
                address: '57 Campbell Street, Lagos Island, Lagos',
                phone: '+234-1-270-1174',
                emergency_line: '112',
                services: ['Emergency Care', 'Maternity', 'Pediatrics', 'Surgery'],
                hours: '24/7',
                latitude: 6.4517,
                longitude: 3.3895,
                rating: 4.1
            },
            {
                id: '8',
                name: 'Royal Women\'s Clinic',
                type: 'clinic',
                address: '23 Oduduwa Crescent, GRA, Ikeja, Lagos',
                phone: '+234-1-493-2617',
                emergency_line: '+234-803-456-7890',
                services: ['Women\'s Health', 'Maternity', 'Gynecology', 'Family Planning'],
                hours: 'Mon-Fri: 8AM-6PM, Sat: 9AM-4PM',
                latitude: 6.5927,
                longitude: 3.3479,
                rating: 4.6
            }
        ];

        this.filteredProviders = [...this.providers];
        this.displayProviders();
    },

    /**
     * Show loading state
     */
    showLoading() {
        const providersList = document.getElementById('providersList');
        if (providersList) {
            providersList.innerHTML = `
                <div class="loading-state">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Loading healthcare providers...</p>
                </div>
            `;
        }
    },

    /**
     * Filter providers based on search and type
     */
    filterProviders() {
        const searchTerm = document.getElementById('healthcareSearch')?.value.toLowerCase() || '';
        const typeFilter = document.getElementById('typeFilter')?.value || 'all';

        this.filteredProviders = this.providers.filter(provider => {
            const matchesSearch = 
                provider.name.toLowerCase().includes(searchTerm) ||
                provider.address.toLowerCase().includes(searchTerm) ||
                provider.services.some(s => s.toLowerCase().includes(searchTerm));

            const matchesType = typeFilter === 'all' || provider.type === typeFilter;

            return matchesSearch && matchesType;
        });

        console.log(`Filtered to ${this.filteredProviders.length} providers`);
        this.sortProviders();
    },

    /**
     * Sort providers
     */
    sortProviders() {
        const sortBy = document.getElementById('sortBy')?.value || 'name';

        this.filteredProviders.sort((a, b) => {
            switch(sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'rating':
                    return (b.rating || 0) - (a.rating || 0);
                case 'distance':
                    return this.calculateDistance(a) - this.calculateDistance(b);
                default:
                    return 0;
            }
        });

        this.displayProviders();
    },

    /**
     * Calculate distance from current location
     */
    calculateDistance(provider) {
        if (!LocationService.currentPosition || !provider.latitude || !provider.longitude) {
            return Infinity;
        }

        const pos = LocationService.currentPosition.coords;
        return LocationService.calculateDistance(
            pos.latitude,
            pos.longitude,
            provider.latitude,
            provider.longitude
        );
    },

    /**
     * Display healthcare providers
     */
    displayProviders() {
        const providersList = document.getElementById('providersList');
        if (!providersList) return;

        if (this.filteredProviders.length === 0) {
            providersList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-hospital"></i>
                    <p>No healthcare providers found</p>
                    <p>Try adjusting your search filters</p>
                </div>
            `;
            return;
        }

        providersList.innerHTML = this.filteredProviders.map(provider => {
            const distance = this.calculateDistance(provider);
            const distanceStr = distance !== Infinity ? `${distance.toFixed(1)} km away` : 'Distance unknown';

            return `
                <div class="provider-card">
                    <div class="provider-header">
                        <div>
                            <h3>${provider.name}</h3>
                            <span class="provider-type ${provider.type}">${provider.type}</span>
                        </div>
                        ${provider.rating ? `
                            <div class="provider-rating">
                                <i class="fas fa-star"></i>
                                <span>${provider.rating.toFixed(1)}</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="provider-info">
                        <p><i class="fas fa-map-marker-alt"></i> ${provider.address}</p>
                        <p><i class="fas fa-phone"></i> ${provider.phone}</p>
                        ${provider.emergency_line ? `
                            <p><i class="fas fa-ambulance"></i> Emergency: ${provider.emergency_line}</p>
                        ` : ''}
                        <p><i class="fas fa-clock"></i> ${provider.hours}</p>
                        ${distance !== Infinity ? `
                            <p><i class="fas fa-route"></i> ${distanceStr}</p>
                        ` : ''}
                    </div>

                    <div class="provider-services">
                        ${provider.services.map(service => `
                            <span class="service-tag">${service}</span>
                        `).join('')}
                    </div>

                    <div class="provider-actions">
                        <button onclick="HealthcareService.callProvider('${provider.phone}')" class="btn btn-primary">
                            <i class="fas fa-phone"></i> Call
                        </button>
                        ${provider.emergency_line ? `
                            <button onclick="HealthcareService.callProvider('${provider.emergency_line}')" class="btn btn-danger">
                                <i class="fas fa-ambulance"></i> Emergency
                            </button>
                        ` : ''}
                        ${provider.latitude && provider.longitude ? `
                            <button onclick="HealthcareService.showDirections(${provider.latitude}, ${provider.longitude})" class="btn btn-secondary">
                                <i class="fas fa-directions"></i> Directions
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    },

    /**
     * Call healthcare provider
     */
    callProvider(phone) {
        window.location.href = `tel:${phone}`;
    },

    /**
     * Show directions to provider
     */
    showDirections(latitude, longitude) {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
        window.open(url, '_blank');
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        HealthcareService.init();
    });
} else {
    HealthcareService.init();
}

// Make available globally
window.HealthcareService = HealthcareService;