// src/pages/ThankYouPage.js

const displayOrderId = () => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('orderId');
    
    const displayElement = document.getElementById('order-id-display');
    if (displayElement) {
        displayElement.textContent = orderId || 'Không tìm thấy mã đơn hàng.';
    }
};

document.addEventListener('DOMContentLoaded', displayOrderId);