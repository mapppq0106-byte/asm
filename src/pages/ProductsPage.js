// src/pages/ProductsPage.js

import { db } from '../firebase/firebase.js';

// Hàm trợ giúp: Định dạng giá tiền
const formatPrice = (price) => {
    const numericPrice = Number(price);
    return numericPrice ? new Intl.NumberFormat('vi-VN').format(numericPrice) : '0';
};

// Hàm lấy ID sản phẩm từ URL
const getProductIdFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
};

// Hàm Render chi tiết sản phẩm ra HTML
const renderProductDetail = (product) => {
    const productDetailContainer = document.getElementById('product-detail');
    if (!productDetailContainer) return;

    if (!product) {
        productDetailContainer.innerHTML = '<p>Không tìm thấy sản phẩm này.</p>';
        return;
    }

    productDetailContainer.innerHTML = `
        <div class="detail-container">
            <h2 class="detail-name">${product.name}</h2>
            <div class="detail-content">
                <img src="${product.image}" alt="${product.name}" class="detail-image">
                <div class="detail-info">
                    <p class="detail-price">Giá: <strong>${formatPrice(product.price)} VNĐ</strong></p>
                    <p class="detail-desc">Mô tả chi tiết:</p>
                    <p>${product.detail || 'Không có mô tả.'}</p>
                    <p>ID danh mục: ${product.cate_id}</p>
                    <button id="add-to-cart-detail" data-id="${product.id}" data-name="${product.name}">Thêm vào Giỏ Hàng</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('add-to-cart-detail').addEventListener('click', (event) => {
        const productId = event.target.getAttribute('data-id');
        const productName = event.target.getAttribute('data-name');
        addToCart(productId, productName);
    });
};

const getProductDetail = async (productId) => {
    if (!productId) {
        document.getElementById('product-detail').innerHTML = '<p>Lỗi: Không tìm thấy ID sản phẩm trong URL.</p>';
        return;
    }

    try {
        const docRef = db.collection('products').doc(productId);
        const doc = await docRef.get();

        if (doc.exists) {
            renderProductDetail({ id: doc.id, ...doc.data() });
        } else {
            renderProductDetail(null);
        }

    } catch (error) {
        console.error('Lỗi khi tải chi tiết sản phẩm:', error);
        document.getElementById('product-detail').innerHTML = '<p>Lỗi kết nối hoặc tải dữ liệu.</p>';
    }
};

// Hàm thêm sản phẩm vào giỏ hàng (Logic giống main.js)
function addToCart(productId, productName) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id: productId, quantity: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    alert(`Đã thêm ${productName} vào giỏ hàng!`);
}


document.addEventListener('DOMContentLoaded', () => {
    const productId = getProductIdFromUrl();
    getProductDetail(productId);
});