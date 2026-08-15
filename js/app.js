// Main Application JavaScript
const API_URL = 'http://localhost:5000/api';

// Auth State Management
class AuthManager {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
        this.initAuthUI();
    }

    initAuthUI() {
        const authNav = document.getElementById('authNav');
        const userNav = document.getElementById('userNav');
        const adminNav = document.getElementById('adminNav');

        if (this.token && this.user) {
            if (authNav) authNav.style.display = 'none';
            if (userNav) {
                userNav.style.display = 'block';
                document.getElementById('userEmail').textContent = this.user.email;
            }
            if (this.user.role === 'admin' && adminNav) {
                adminNav.style.display = 'block';
            }
        } else {
            if (authNav) authNav.style.display = 'block';
            if (userNav) userNav.style.display = 'none';
            if (adminNav) adminNav.style.display = 'none';
        }
    }

    async login(email, password) {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) throw new Error('Login failed');

            const data = await response.json();
            this.token = data.token;
            this.user = data.user;
            localStorage.setItem('token', this.token);
            localStorage.setItem('user', JSON.stringify(this.user));
            this.initAuthUI();
            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    async register(userData) {
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            if (!response.ok) throw new Error('Registration failed');

            return await response.json();
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.initAuthUI();
        window.location.href = 'index.html';
    }

    getAuthHeader() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    }

    isAuthenticated() {
        return !!this.token;
    }
}

// Hotel Service
class HotelService {
    constructor(auth) {
        this.auth = auth;
    }

    async getHotels(query) {
        try {
            const params = new URLSearchParams(query);
            const response = await fetch(`${API_URL}/hotels?${params}`);
            if (!response.ok) throw new Error('Failed to fetch hotels');
            return await response.json();
        } catch (error) {
            console.error('Error fetching hotels:', error);
            throw error;
        }
    }

    async getHotel(id) {
        try {
            const response = await fetch(`${API_URL}/hotels/${id}`);
            if (!response.ok) throw new Error('Failed to fetch hotel');
            return await response.json();
        } catch (error) {
            console.error('Error fetching hotel:', error);
            throw error;
        }
    }

    async getRooms(hotelId) {
        try {
            const response = await fetch(`${API_URL}/hotels/${hotelId}/rooms`);
            if (!response.ok) throw new Error('Failed to fetch rooms');
            return await response.json();
        } catch (error) {
            console.error('Error fetching rooms:', error);
            throw error;
        }
    }

    async checkAvailability(hotelId, checkIn, checkOut) {
        try {
            const response = await fetch(`${API_URL}/hotels/${hotelId}/availability?checkIn=${checkIn}&checkOut=${checkOut}`);
            if (!response.ok) throw new Error('Failed to check availability');
            return await response.json();
        } catch (error) {
            console.error('Error checking availability:', error);
            throw error;
        }
    }
}

// Booking Service
class BookingService {
    constructor(auth) {
        this.auth = auth;
    }

    async createBooking(bookingData) {
        try {
            const response = await fetch(`${API_URL}/bookings`, {
                method: 'POST',
                headers: this.auth.getAuthHeader(),
                body: JSON.stringify(bookingData)
            });

            if (!response.ok) throw new Error('Failed to create booking');
            return await response.json();
        } catch (error) {
            console.error('Error creating booking:', error);
            throw error;
        }
    }

    async getBookings() {
        try {
            const response = await fetch(`${API_URL}/bookings`, {
                headers: this.auth.getAuthHeader()
            });

            if (!response.ok) throw new Error('Failed to fetch bookings');
            return await response.json();
        } catch (error) {
            console.error('Error fetching bookings:', error);
            throw error;
        }
    }

    async getBooking(id) {
        try {
            const response = await fetch(`${API_URL}/bookings/${id}`, {
                headers: this.auth.getAuthHeader()
            });

            if (!response.ok) throw new Error('Failed to fetch booking');
            return await response.json();
        } catch (error) {
            console.error('Error fetching booking:', error);
            throw error;
        }
    }

    async cancelBooking(id) {
        try {
            const response = await fetch(`${API_URL}/bookings/${id}`, {
                method: 'DELETE',
                headers: this.auth.getAuthHeader()
            });

            if (!response.ok) throw new Error('Failed to cancel booking');
            return await response.json();
        } catch (error) {
            console.error('Error canceling booking:', error);
            throw error;
        }
    }
}

// Property Service
class PropertyService {
    constructor(auth) {
        this.auth = auth;
    }

    async createProperty(propertyData) {
        try {
            const response = await fetch(`${API_URL}/properties`, {
                method: 'POST',
                headers: this.auth.getAuthHeader(),
                body: JSON.stringify(propertyData)
            });

            if (!response.ok) throw new Error('Failed to create property');
            return await response.json();
        } catch (error) {
            console.error('Error creating property:', error);
            throw error;
        }
    }

    async getProperties() {
        try {
            const response = await fetch(`${API_URL}/properties`, {
                headers: this.auth.getAuthHeader()
            });

            if (!response.ok) throw new Error('Failed to fetch properties');
            return await response.json();
        } catch (error) {
            console.error('Error fetching properties:', error);
            throw error;
        }
    }

    async uploadImage(file) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${API_URL}/properties/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.auth.token}`
                },
                body: formData
            });

            if (!response.ok) throw new Error('Failed to upload image');
            return await response.json();
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    }
}

// Payment Service
class PaymentService {
    constructor(auth) {
        this.auth = auth;
    }

    async processPayment(paymentData) {
        try {
            const response = await fetch(`${API_URL}/payments`, {
                method: 'POST',
                headers: this.auth.getAuthHeader(),
                body: JSON.stringify(paymentData)
            });

            if (!response.ok) throw new Error('Payment failed');
            return await response.json();
        } catch (error) {
            console.error('Error processing payment:', error);
            throw error;
        }
    }

    async verifyPayment(transactionId) {
        try {
            const response = await fetch(`${API_URL}/payments/${transactionId}/verify`, {
                headers: this.auth.getAuthHeader()
            });

            if (!response.ok) throw new Error('Payment verification failed');
            return await response.json();
        } catch (error) {
            console.error('Error verifying payment:', error);
            throw error;
        }
    }
}

// Utility Functions
function showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.textContent = message;
    document.body.insertBefore(messageDiv, document.body.firstChild);
    setTimeout(() => messageDiv.remove(), 5000);
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function calculateNights(checkIn, checkOut) {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
}

// Initialize services
const auth = new AuthManager();
const hotelService = new HotelService(auth);
const bookingService = new BookingService(auth);
const propertyService = new PropertyService(auth);
const paymentService = new PaymentService(auth);

// Logout functionality
document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => auth.logout());
    }

    // Search form on homepage
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const destination = document.getElementById('destination').value;
            const checkIn = document.getElementById('checkIn').value;
            const checkOut = document.getElementById('checkOut').value;
            const guests = document.getElementById('guests').value;

            const query = new URLSearchParams({
                destination,
                checkIn,
                checkOut,
                guests
            });

            window.location.href = `hotels.html?${query}`;
        });
    }

    // Load featured hotels
    loadFeaturedHotels();
});

async function loadFeaturedHotels() {
    const featuredHotels = document.getElementById('featuredHotels');
    if (!featuredHotels) return;

    try {
        const hotels = await hotelService.getHotels({ limit: 6 });
        featuredHotels.innerHTML = hotels.map(hotel => `
            <div class="hotel-card">
                <img src="${hotel.image || 'https://via.placeholder.com/250x180?text=Hotel'}" alt="${hotel.name}">
                <div class="hotel-card-content">
                    <h3>${hotel.name}</h3>
                    <p>${hotel.city}</p>
                    <div class="hotel-rating">★★★★★ (${hotel.reviews || 0} reviews)</div>
                    <div class="hotel-price">$${hotel.pricePerNight}/night</div>
                    <button class="btn-primary" onclick="window.location.href='hotel.html?id=${hotel.id}'">View Details</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        showMessage('Failed to load hotels', 'error');
        console.error(error);
    }
}
