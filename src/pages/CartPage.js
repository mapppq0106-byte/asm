// src/pages/CartPage.js

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

// Hàm lưu giỏ hàng vào LocalStorage
const saveCart = (cart) => {
    localStorage.setItem('cart', JSON.stringify(cart));
};


// --- HÀM RENDER VÀ XỬ LÝ DỮ LIỆU ---

const renderCart = (items) => {
    const cartListContainer = document.getElementById('cart-list-container');
    const cartSummary = document.getElementById('cart-summary');
    if (!cartListContainer || !cartSummary) return;

    if (items.length === 0) {
        cartListContainer.innerHTML = '<p>Giỏ hàng của bạn đang trống.</p><a href="index.html">Quay lại mua hàng</a>';
        cartSummary.innerHTML = '';
        return;
    }

    let totalAmount = 0;
    
    const cartTableHTML = `
        <table>
            <thead>
                <tr>
                    <th>Sản phẩm</th>
                    <th>Giá</th>
                    <th>Số lượng</th>
                    <th>Thành tiền</th>
                    <th>Xóa</th>
                </tr>
            </thead>
            <tbody>
                ${items.map(item => {
                    const subtotal = item.product.price * item.quantity;
                    totalAmount += subtotal;
                    return `
                        <tr data-id="${item.product.id}">
                            <td>
                                <img src="${item.product.image}" alt="${item.product.name}" class="cart-item-img">
                                <span>${item.product.name}</span>
                            </td>
                            <td class="item-price">${formatPrice(item.product.price)} VNĐ</td>
                            <td>
                                <input type="number" 
                                       value="${item.quantity}" 
                                       min="1" 
                                       data-id="${item.product.id}" 
                                       class="item-quantity-input">
                            </td>
                            <td class="item-subtotal">${formatPrice(subtotal)} VNĐ</td>
                            <td>
                                <button class="remove-item-btn" data-id="${item.product.id}">Xóa</button>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;

    const summaryHTML = `
        <p class="total-text">Tổng tiền: <span class="total-amount">${formatPrice(totalAmount)} VNĐ</span></p>
        <button id="checkout-btn">TIẾN HÀNH THANH TOÁN</button>
    `;

    cartListContainer.innerHTML = cartTableHTML;
    cartSummary.innerHTML = summaryHTML;
    
    attachEventListeners();
};

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

const loadCartAndRender = async () => {
    const cart = getCart();
    
    if (cart.length === 0) {
        renderCart([]);
        return;
    }
    
    document.getElementById('cart-list-container').innerHTML = '<p>Đang tải chi tiết sản phẩm...</p>';
    
    try {
        const cartItems = await getCartItemDetails(cart);
        renderCart(cartItems);
    } catch (error) {
        console.error('Lỗi khi tải chi tiết giỏ hàng:', error);
        document.getElementById('cart-list-container').innerHTML = '<p>Lỗi: Không thể tải chi tiết giỏ hàng.</p>';
    }
};

// --- HÀM THAO TÁC (UPDATE/DELETE) ---

const handleQuantityChange = (event) => {
    const input = event.target;
    const productId = input.getAttribute('data-id');
    let newQuantity = parseInt(input.value);

    if (newQuantity < 1 || isNaN(newQuantity)) {
        newQuantity = 1;
        input.value = 1;
    }

    let cart = getCart();
    const itemIndex = cart.findIndex(item => item.id === productId);

    if (itemIndex !== -1) {
        cart[itemIndex].quantity = newQuantity;
        saveCart(cart);
        loadCartAndRender();
    }
};

const handleRemoveItem = (event) => {
    const button = event.target;
    const productId = button.getAttribute('data-id');

    let cart = getCart();
    const newCart = cart.filter(item => item.id !== productId);

    saveCart(newCart);
    alert('Đã xóa sản phẩm khỏi giỏ hàng.');
    
    loadCartAndRender();
};

const attachEventListeners = () => {
    document.querySelectorAll('.item-quantity-input').forEach(input => {
        input.addEventListener('change', handleQuantityChange);
    });

    document.querySelectorAll('.remove-item-btn').forEach(button => {
        button.addEventListener('click', handleRemoveItem);
    });
    
    const checkoutBtn = document.getElementById('checkout-btn');
    if(checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            window.location.href = 'checkout.html'; 
        });
    }
};

document.addEventListener('DOMContentLoaded', loadCartAndRender);