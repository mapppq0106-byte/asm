// src/pages/CheckoutPage.js

import { db } from '../firebase/firebase.js';

// Hàm trợ giúp: Định dạng giá tiền
const formatPrice = (price) => {
    const numericPrice = Number(price); 
    return numericPrice ? new Intl.NumberFormat('vi-VN').format(numericPrice) : '0';
};

// Hàm lấy giỏ hàng từ LocalStorage
const getCart = () => {
    return JSON.parse(localStorage.getItem('cart')) || [];
};

// Hàm lấy chi tiết sản phẩm từ Firestore
const getCartItemDetails = async (cart) => {
    const productIds = cart.map(item => item.id);
    if (productIds.length === 0) return [];
    
    const productPromises = productIds.map(id => db.collection('products').doc(id).get());
    const productSnapshots = await Promise.all(productPromises);
    const productDetails = {};

    productSnapshots.forEach(doc => {
        if (doc.exists) {
            productDetails[doc.id] = { id: doc.id, ...doc.data() }; 
        }
    });

    const cartItems = cart.map(item => ({
        quantity: item.quantity,
        product: productDetails[item.id]
    })).filter(item => item.product);

    return cartItems;
};


// --- LOGIC RENDER VÀ XỬ LÝ ĐẶT HÀNG ---
let currentCartItems = [];

const renderOrderSummary = (items) => {
    const summaryContainer = document.getElementById('summary-items');
    if (!summaryContainer) return;

    currentCartItems = items;
    
    let totalAmount = 0;

    const itemsHTML = items.map(item => {
        const subtotal = item.product.price * item.quantity;
        totalAmount += subtotal;
        return `
            <div class="summary-item">
                <span>${item.product.name} (x${item.quantity})</span>
                <span>${formatPrice(subtotal)} VNĐ</span>
            </div>
        `;
    }).join('');

    const totalHTML = `
        ${itemsHTML}
        <div class="summary-total">
            <span>Tổng cộng:</span>
            <span id="final-total">${formatPrice(totalAmount)} VNĐ</span>
        </div>
    `;

    summaryContainer.innerHTML = totalHTML;
};

const loadSummary = async () => {
    const cart = getCart();
    const summaryContainer = document.getElementById('summary-items');
    const orderBtn = document.getElementById('place-order-btn');
    
    if (cart.length === 0) {
        if(summaryContainer) summaryContainer.innerHTML = '<p>Giỏ hàng trống. Vui lòng quay lại trang chủ.</p>';
        if(orderBtn) orderBtn.disabled = true;
        return;
    }

    try {
        const cartItems = await getCartItemDetails(cart);
        if (cartItems.length === 0) {
            if(summaryContainer) summaryContainer.innerHTML = '<p>Giỏ hàng trống.</p>';
            if(orderBtn) orderBtn.disabled = true;
            return;
        }
        renderOrderSummary(cartItems);
    } catch (error) {
        console.error('Lỗi khi tải tóm tắt giỏ hàng:', error);
        if(summaryContainer) summaryContainer.innerHTML = '<p>Lỗi tải dữ liệu.</p>';
        if(orderBtn) orderBtn.disabled = true;
    }
};

const handleCheckout = async (event) => {
    event.preventDefault();
    
    if (currentCartItems.length === 0) {
        alert("Giỏ hàng của bạn đang trống!");
        return;
    }

    const form = event.target;
    const orderBtn = document.getElementById('place-order-btn');
    orderBtn.disabled = true;
    orderBtn.textContent = 'Đang xử lý...';

    const customerInfo = {
        customer_name: form.customer_name.value,
        customer_address: form.customer_address.value,
        customer_email: form.customer_email.value,
        customer_phone_number: form.customer_phone_number.value,
    };
    
    const newOrder = {
        ...customerInfo,
        created_date: new Date(),
        status: 'Pending',
    };

    try {
        const orderRef = await db.collection('orders').add(newOrder);

        const batch = db.batch();
        
        currentCartItems.forEach(item => {
            const orderDetailRef = db.collection('order_details').doc();
            
            const orderDetailData = {
                order_id: orderRef.id, 
                product_id: item.product.id,
                quantity: item.quantity,
                unit_price: item.product.price,
            };
            batch.set(orderDetailRef, orderDetailData);
        });

        await batch.commit();

        localStorage.removeItem('cart');

        window.location.href = `thankyou.html?orderId=${orderRef.id}`;
        
    } catch (error) {
        console.error('Lỗi khi đặt hàng:', error);
        alert(`Đặt hàng thất bại. Vui lòng thử lại. Lỗi: ${error.message}`);
        orderBtn.disabled = false;
        orderBtn.textContent = 'HOÀN TẤT ĐẶT HÀNG';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    loadSummary();
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleCheckout);
    }
});