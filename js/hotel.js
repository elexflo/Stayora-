// Hotel Details JavaScript
let currentHotel = null;
let selectedRoom = null;

document.addEventListener('DOMContentLoaded', function() {
    const hotelId = new URLSearchParams(window.location.search).get('id');
    
    if (!hotelId) {
        showMessage('Hotel not found', 'error');
        window.location.href = 'hotels.html';
        return;
    }

    loadHotelDetails(hotelId);

    // Set minimum dates
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('checkIn').setAttribute('min', today);
    document.getElementById('checkOut').setAttribute('min', today);

    // Update checkout date when checkin changes
    document.getElementById('checkIn').addEventListener('change', function() {
        const checkInDate = new Date(this.value);
        checkInDate.setDate(checkInDate.getDate() + 1);
        document.getElementById('checkOut').setAttribute('min', checkInDate.toISOString().split('T')[0]);
        updateSummary();
    });

    document.getElementById('checkOut').addEventListener('change', updateSummary);
    document.getElementById('guests').addEventListener('change', updateSummary);

    // Handle booking form submission
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', handleBooking);
    }
});

async function loadHotelDetails(hotelId) {
    const loadingSpinner = document.getElementById('loadingSpinner');
    const hotelContent = document.getElementById('hotelContent');

    loadingSpinner.style.display = 'block';

    try {
        currentHotel = await hotelService.getHotel(hotelId);
        
        // Populate hotel details
        document.getElementById('hotelName').textContent = currentHotel.name;
        document.getElementById('hotelAddress').textContent = currentHotel.address + ', ' + currentHotel.city;
        document.getElementById('hotelImage').src = currentHotel.image || 'https://via.placeholder.com/400x300?text=Hotel';
        document.getElementById('hotelDescription').textContent = currentHotel.description;
        document.getElementById('hotelRating').innerHTML = `★★★★★ (${currentHotel.reviews || 0} reviews) • ${currentHotel.rating || 4.5}/5`;
        
        document.getElementById('summaryHotel').textContent = currentHotel.name;

        // Pre-fill email if user is logged in
        if (auth.user) {
            document.getElementById('guestEmail').value = auth.user.email;
            document.getElementById('firstName').value = auth.user.firstName || '';
            document.getElementById('lastName').value = auth.user.lastName || '';
        }

        // Load rooms
        await loadRooms(hotelId);

        loadingSpinner.style.display = 'none';
        hotelContent.style.display = 'block';
    } catch (error) {
        showMessage('Failed to load hotel details', 'error');
        loadingSpinner.style.display = 'none';
    }
}

async function loadRooms(hotelId) {
    try {
        const rooms = await hotelService.getRooms(hotelId);
        const roomOptions = document.getElementById('roomOptions');
        
        roomOptions.innerHTML = rooms.map(room => `
            <label class="room-option">
                <input type="radio" name="room" value="${room.id}" data-price="${room.pricePerNight}" data-type="${room.type}" required>
                <span>${room.type}</span>
                <div class="room-details">
                    <p>${room.description}</p>
                    <p>Capacity: ${room.capacity} guests</p>
                </div>
                <div class="room-price">$${room.pricePerNight}/night</div>
            </label>
        `).join('');

        // Add change event to room selection
        document.querySelectorAll('input[name="room"]').forEach(radio => {
            radio.addEventListener('change', function() {
                selectedRoom = {
                    id: this.value,
                    type: this.dataset.type,
                    price: parseFloat(this.dataset.price)
                };
                updateSummary();
            });
        });
    } catch (error) {
        showMessage('Failed to load rooms', 'error');
    }
}

function updateSummary() {
    const checkIn = document.getElementById('checkIn').value;
    const checkOut = document.getElementById('checkOut').value;

    if (checkIn && checkOut) {
        const nights = calculateNights(checkIn, checkOut);
        document.getElementById('summaryCheckIn').textContent = formatDate(checkIn);
        document.getElementById('summaryCheckOut').textContent = formatDate(checkOut);
        document.getElementById('summaryNights').textContent = nights;

        if (selectedRoom) {
            document.getElementById('summaryRoom').textContent = selectedRoom.type;
            document.getElementById('summaryPrice').textContent = `$${selectedRoom.price}`;
            document.getElementById('summaryTotal').textContent = `$${selectedRoom.price * nights}`;
        }
    }
}

async function handleBooking(e) {
    e.preventDefault();

    if (!auth.isAuthenticated()) {
        showMessage('Please log in to continue booking', 'error');
        window.location.href = 'login.html';
        return;
    }

    if (!selectedRoom) {
        showMessage('Please select a room', 'error');
        return;
    }

    const checkIn = document.getElementById('checkIn').value;
    const checkOut = document.getElementById('checkOut').value;
    const nights = calculateNights(checkIn, checkOut);
    const totalPrice = selectedRoom.price * nights;

    const bookingData = {
        hotelId: currentHotel.id,
        roomId: selectedRoom.id,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        guestName: document.getElementById('firstName').value + ' ' + document.getElementById('lastName').value,
        guestEmail: document.getElementById('guestEmail').value,
        guestPhone: document.getElementById('guestPhone').value,
        numberOfGuests: document.getElementById('guests').value,
        specialRequests: document.getElementById('specialRequests').value,
        totalPrice: totalPrice,
        numberOfNights: nights
    };

    try {
        const booking = await bookingService.createBooking(bookingData);
        
        // Redirect to payment page
        window.location.href = `checkout.html?bookingId=${booking.id}&amount=${totalPrice}`;
    } catch (error) {
        showMessage('Failed to create booking', 'error');
    }
}
