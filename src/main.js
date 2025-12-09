// src/main.js
import { db } from '/src/firebase/firebase.js';

// Hàm trợ giúp: Định dạng giá tiền
const formatPrice = (price) => {
    const numericPrice = Number(price); 
    return numericPrice ? new Intl.NumberFormat('vi-VN').format(numericPrice) : '0';
};

// Hàm xây dựng HTML cho một sản phẩm
const ProductItem = (product) => {
    return `
        <div class="product-item">
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <h3 class="product-name">${product.name}</h3>
            <p class="product-price">${formatPrice(product.price)} VNĐ</p>
            <button class="add-to-cart-btn" data-id="${product.id}" data-name="${product.name}">Thêm vào giỏ hàng</button>
            <a href="product.html?id=${product.id}" class="view-detail-link">Xem chi tiết</a>
        </div>
    `;
};

// --- LOGIC LẤY DỮ LIỆU & RENDER SẢN PHẨM ---

function renderProducts(products) {
    const productListContainer = document.getElementById('product-list');
    if (!productListContainer) return;

    if (products.length === 0) {
         productListContainer.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; margin-top: 30px;">Không tìm thấy sản phẩm nào phù hợp.</p>';
         return;
    }

    productListContainer.innerHTML = products.map(ProductItem).join('');
    attachCartEventListeners(); 
}

const getAndRenderProducts = async (query = db.collection('products')) => {
    const productListContainer = document.getElementById('product-list');
    if (productListContainer) {
        productListContainer.innerHTML = '<p style="grid-column: 1 / -1; text-align: center;">Đang tải sản phẩm...</p>';
    }
    
    try {
        const snapshot = await query.get();
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderProducts(products);
    } catch (error) {
        console.error('Lỗi khi tải sản phẩm:', error);
        if (productListContainer) {
            productListContainer.innerHTML = '<p style="grid-column: 1 / -1; text-align: center;">Lỗi tải dữ liệu. Vui lòng kiểm tra console.</p>';
        }
    }
};

// --- LOGIC LỌC SẢN PHẨM ---

const getCategories = async () => {
    try {
        const snapshot = await db.collection('categories').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Lỗi khi tải danh mục:', error);
        return [];
    }
};

const renderFilters = async () => {
    const categories = await getCategories();
    const filterContainer = document.getElementById('filter-container');
    if (!filterContainer) return;

    const categoryOptions = categories.map(cate => 
        `<option value="${cate.id}">${cate.name}</option>`
    ).join('');

    const priceRanges = [
        { value: '0-50000', label: 'Dưới 50.000 VNĐ' },
        { value: '50000-100000', label: '50.000 - 100.000 VNĐ' },
        { value: '100000-max', label: 'Trên 100.000 VNĐ' },
    ];
    const priceOptions = priceRanges.map(range =>
        `<option value="${range.value}">${range.label}</option>`
    ).join('');

    filterContainer.innerHTML = `
        <div class="filter-group">
            <label for="category-filter">Danh mục:</label>
            <select id="category-filter">
                <option value="">Tất cả danh mục</option>
                ${categoryOptions}
            </select>
        </div>
        <div class="filter-group">
            <label for="price-filter">Khoảng giá:</label>
            <select id="price-filter">
                <option value="">Tất cả</option>
                ${priceOptions}
            </select>
        </div>
        <button id="apply-filter-btn">Áp dụng Lọc</button>
    `;

    document.getElementById('apply-filter-btn').addEventListener('click', applyFilters);
};

const applyFilters = async () => {
    const categoryId = document.getElementById('category-filter').value;
    const priceRange = document.getElementById('price-filter').value;
    
    let query = db.collection('products');
    
    if (categoryId) {
        query = query.where('cate_id', '==', categoryId);
    }

    if (priceRange) {
        const [minPriceStr, maxPriceStr] = priceRange.split('-');
        
        const min = parseInt(minPriceStr);
        if (!isNaN(min) && minPriceStr !== '0') {
            query = query.where('price', '>=', min);
        }
        
        if (maxPriceStr !== 'max') {
            const max = parseInt(maxPriceStr);
            if (!isNaN(max)) {
                query = query.where('price', '<=', max);
            }
        }
    }
    
    getAndRenderProducts(query);
};

// --- LOGIC GIỎ HÀNG (SƠ BỘ) ---

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

const attachCartEventListeners = () => {
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = event.target.getAttribute('data-id');
            const productName = event.target.getAttribute('data-name');
            addToCart(productId, productName);
        });
    });
};


// --- CHẠY ỨNG DỤNG ---
document.addEventListener('DOMContentLoaded', () => {
    getAndRenderProducts(); 
    renderFilters(); 
});