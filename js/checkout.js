// Checkout JavaScript - Payment Processing
let stripe;
let elements;
let cardElement;
let bookingId;
let totalAmount;

document.addEventListener('DOMContentLoaded', async function() {
    // Get booking ID and amount from URL
    const params = new URLSearchParams(window.location.search);
    bookingId = params.get('bookingId');
    totalAmount = params.get('amount');

    if (!bookingId || !totalAmount) {
        showMessage('Invalid booking information', 'error');
        window.location.href = 'hotels.html';
        return;
    }

    // Initialize Stripe
    initializeStripe();

    // Pre-fill user information if logged in
    if (auth.user) {
        document.getElementById('fullName').value = (auth.user.firstName || '') + ' ' + (auth.user.lastName || '');
        document.getElementById('email').value = auth.user.email;
    }

    // Load booking summary
    loadBookingSummary();

    // Handle payment method selection
    document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
        radio.addEventListener('change', handlePaymentMethodChange);
    });

    // Handle form submission
    const paymentForm = document.getElementById('paymentForm');
    if (paymentForm) {
        paymentForm.addEventListener('submit', handlePaymentSubmit);
    }
});

async function initializeStripe() {
    // Initialize Stripe (using a test key - replace with your own)
    stripe = Stripe('pk_test_51234567890abcdefghijklmnopqrstuvwxyz');
    elements = stripe.elements();
    cardElement = elements.create('card');
    cardElement.mount('#card-element');

    // Handle card errors
    cardElement.addEventListener('change', function(event) {
        const displayError = document.getElementById('card-errors');
        if (event.error) {
            displayError.textContent = event.error.message;
        } else {
            displayError.textContent = '';
        }
    });
}

async function loadBookingSummary() {
    try {
        const booking = await bookingService.getBooking(bookingId);
        
        const nights = booking.numberOfNights;
        const pricePerNight = booking.totalPrice / nights;
        const subtotal = booking.totalPrice;
        const tax = Math.round(subtotal * 0.1 * 100) / 100;
        const total = Math.round((subtotal + tax) * 100) / 100;

        document.getElementById('summaryHotel').textContent = booking.hotelName || 'Hotel';
        document.getElementById('summaryRoom').textContent = booking.roomType || 'Standard Room';
        document.getElementById('summaryCheckIn').textContent = formatDate(booking.checkInDate);
        document.getElementById('summaryCheckOut').textContent = formatDate(booking.checkOutDate);
        document.getElementById('summaryNights').textContent = nights;
        document.getElementById('summaryPrice').textContent = `$${pricePerNight.toFixed(2)}`;
        document.getElementById('summarySubtotal').textContent = `$${subtotal.toFixed(2)}`;
        document.getElementById('summaryTax').textContent = `$${tax.toFixed(2)}`;
        document.getElementById('summaryTotal').textContent = `$${total.toFixed(2)}`;
    } catch (error) {
        console.error('Error loading booking summary:', error);
    }
}

function handlePaymentMethodChange(e) {
    const cardElement = document.getElementById('card-element');
    if (e.target.value === 'paypal') {
        cardElement.parentElement.style.display = 'none';
        showMessage('PayPal integration coming soon', 'info');
    } else {
        cardElement.parentElement.style.display = 'block';
    }
}

async function handlePaymentSubmit(e) {
    e.preventDefault();

    if (!document.getElementById('agreeTerms').checked) {
        showMessage('Please agree to the terms and conditions', 'error');
        return;
    }

    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;

    if (paymentMethod === 'stripe') {
        await processStripePayment();
    } else if (paymentMethod === 'paypal') {
        showMessage('PayPal payment method coming soon', 'info');
    }
}

async function processStripePayment() {
    const submitBtn = document.getElementById('submitBtn');
    const loadingSpinner = document.getElementById('loadingSpinner');

    submitBtn.disabled = true;
    loadingSpinner.style.display = 'block';

    try {
        // Create payment intent on backend
        const paymentIntentResponse = await fetch(`${API_URL}/payments/create-intent`, {
            method: 'POST',
            headers: auth.getAuthHeader(),
            body: JSON.stringify({
                bookingId: bookingId,
                amount: Math.round(totalAmount * 100), // Convert to cents
                currency: 'usd'
            })
        });

        if (!paymentIntentResponse.ok) throw new Error('Failed to create payment intent');

        const { clientSecret } = await paymentIntentResponse.json();

        // Confirm payment with Stripe
        const { paymentIntent, error } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: cardElement,
                billing_details: {
                    name: document.getElementById('fullName').value,
                    email: document.getElementById('email').value,
                    address: {
                        line1: document.getElementById('address').value,
                        city: document.getElementById('city').value,
                        postal_code: document.getElementById('postalCode').value,
                        country: document.getElementById('country').value
                    }
                }
            }
        });

        if (error) {
            showMessage(`Payment failed: ${error.message}`, 'error');
            submitBtn.disabled = false;
            loadingSpinner.style.display = 'none';
        } else if (paymentIntent.status === 'succeeded') {
            // Payment successful
            await completeBooking(paymentIntent.id);
            window.location.href = `booking-success.html?bookingId=${bookingId}`;
        }
    } catch (error) {
        showMessage(`Payment error: ${error.message}`, 'error');
        submitBtn.disabled = false;
        loadingSpinner.style.display = 'none';
        console.error('Payment error:', error);
    }
}

async function completeBooking(transactionId) {
    try {
        await fetch(`${API_URL}/bookings/${bookingId}/confirm`, {
            method: 'POST',
            headers: auth.getAuthHeader(),
            body: JSON.stringify({
                transactionId: transactionId,
                paymentStatus: 'completed'
            })
        });
    } catch (error) {
        console.error('Error completing booking:', error);
    }
}
