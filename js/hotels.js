// Hotels Search JavaScript
let currentFilters = {};

document.addEventListener('DOMContentLoaded', function() {
    const filterForm = document.getElementById('filterForm');
    
    if (filterForm) {
        filterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            applyFilters();
        });
    }

    // Load search parameters from URL
    loadSearchParams();
    searchHotels();
});

function loadSearchParams() {
    const params = new URLSearchParams(window.location.search);
    
    if (params.has('destination')) {
        document.getElementById('destination').value = params.get('destination');
        currentFilters.destination = params.get('destination');
    }
    
    if (params.has('checkIn')) {
        document.getElementById('checkIn').value = params.get('checkIn');
        currentFilters.checkIn = params.get('checkIn');
    }
    
    if (params.has('checkOut')) {
        document.getElementById('checkOut').value = params.get('checkOut');
        currentFilters.checkOut = params.get('checkOut');
    }
    
    if (params.has('guests')) {
        currentFilters.guests = params.get('guests');
    }
}

function applyFilters() {
    currentFilters.destination = document.getElementById('destination').value;
    currentFilters.checkIn = document.getElementById('checkIn').value;
    currentFilters.checkOut = document.getElementById('checkOut').value;
    currentFilters.priceRange = document.getElementById('priceRange').value;
    
    searchHotels();
}

async function searchHotels() {
    const loadingSpinner = document.getElementById('loadingSpinner');
    const hotelsResults = document.getElementById('hotelsResults');
    const noResults = document.getElementById('noResults');
    
    loadingSpinner.style.display = 'block';
    hotelsResults.innerHTML = '';
    noResults.style.display = 'none';

    try {
        const hotels = await hotelService.getHotels(currentFilters);
        
        if (hotels.length === 0) {
            noResults.style.display = 'block';
            loadingSpinner.style.display = 'none';
            return;
        }

        hotelsResults.innerHTML = hotels.map(hotel => `
            <div class="hotel-card">
                <img src="${hotel.image || 'https://via.placeholder.com/250x180?text=Hotel'}" alt="${hotel.name}">
                <div class="hotel-card-content">
                    <h3>${hotel.name}</h3>
                    <p>${hotel.city}, ${hotel.country}</p>
                    <p style="color: #999; font-size: 14px;">${hotel.address}</p>
                    <div class="hotel-rating">★★★★★ (${hotel.reviews || 0} reviews)</div>
                    <div class="hotel-price">$${hotel.pricePerNight}/night</div>
                    <button class="btn-primary" onclick="window.location.href='hotel.html?id=${hotel.id}'">View Details</button>
                </div>
            </div>
        `).join('');

        loadingSpinner.style.display = 'none';
    } catch (error) {
        showMessage('Failed to load hotels', 'error');
        loadingSpinner.style.display = 'none';
    }
}
