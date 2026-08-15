// Booking Success JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    const bookingId = params.get('bookingId');

    if (!bookingId) {
        showMessage('Booking not found', 'error');
        window.location.href = 'hotels.html';
        return;
    }

    loadBookingDetails(bookingId);
});

async function loadBookingDetails(bookingId) {
    try {
        const booking = await bookingService.getBooking(bookingId);

        document.getElementById('bookingRef').textContent = booking.id;
        document.getElementById('hotelName').textContent = booking.hotelName || 'Hotel';
        document.getElementById('roomType').textContent = booking.roomType || 'Standard Room';
        document.getElementById('checkInDate').textContent = formatDate(booking.checkInDate);
        document.getElementById('checkOutDate').textContent = formatDate(booking.checkOutDate);
        document.getElementById('numberOfNights').textContent = booking.numberOfNights;
        document.getElementById('guestName').textContent = booking.guestName;
        document.getElementById('totalAmount').textContent = `$${booking.totalPrice.toFixed(2)}`;
    } catch (error) {
        console.error('Error loading booking details:', error);
        showMessage('Failed to load booking details', 'error');
    }
}
