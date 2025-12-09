// src/pages/AdminDashboard.js

import { db } from '../firebase/firebase.js';

// Import hàm render từ các trang quản lý khác
import { renderProductsPage } from './AdminProducts.js'; 
import { renderOrdersPage } from './AdminOrders.js'; 

// Tham chiếu đến collection 'categories'
const categoriesCollection = db.collection('categories');
let editingCategoryId = null; 

// --- HÀM TRỢ GIÚP: ĐỊNH DẠNG GIÁ (Để đảm bảo code chạy độc lập) ---
const formatPrice = (price) => {
    const numericPrice = Number(price); 
    return numericPrice ? new Intl.NumberFormat('vi-VN').format(numericPrice) : '0';
};

// --- 1. RENDER GIAO DIỆN QUẢN LÝ DANH MỤC ---

const renderCategoriesPage = async () => {
    const content = document.getElementById('admin-content');
    content.innerHTML = `
        <h2>Quản lý Danh mục</h2>
        
        <form id="category-form" class="admin-form">
            <input type="hidden" id="category-id">
            <div class="form-group">
                <label for="category-name">Tên Danh mục:</label>
                <input type="text" id="category-name" required>
            </div>
            <button type="submit" class="action-btn" id="category-submit-btn">Thêm Danh mục</button>
            <button type="button" class="action-btn edit-btn" id="category-cancel-btn" style="display:none;">Hủy sửa</button>
        </form>

        <h3>Danh sách Danh mục</h3>
        <div id="categories-list">Đang tải danh mục...</div>
    `;

    document.getElementById('category-form').addEventListener('submit', handleCategorySubmit);
    document.getElementById('category-cancel-btn').addEventListener('click', resetCategoryForm);

    loadCategories();
};

// --- 2. LOGIC LẤY VÀ HIỂN THỊ DANH MỤC ---

const loadCategories = async () => {
    const listContainer = document.getElementById('categories-list');
    try {
        const snapshot = await categoriesCollection.get();
        const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (categories.length === 0) {
            listContainer.innerHTML = '<p>Chưa có danh mục nào.</p>';
            return;
        }

        let tableHTML = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Tên Danh mục</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
        `;

        categories.forEach(cate => {
            tableHTML += `
                <tr>
                    <td>${cate.id.substring(0, 6)}...</td>
                    <td>${cate.name}</td>
                    <td>
                        <button class="action-btn edit-btn" onclick="window.editCategory('${cate.id}', '${cate.name}')">Sửa</button>
                        <button class="action-btn delete-btn" onclick="window.deleteCategory('${cate.id}')">Xóa</button>
                    </td>
                </tr>
            `;
        });

        tableHTML += `</tbody></table>`;
        listContainer.innerHTML = tableHTML;

    } catch (error) {
        console.error('Lỗi khi tải danh mục:', error);
        listContainer.innerHTML = '<p>Lỗi tải dữ liệu danh mục.</p>';
    }
};

// --- 3. LOGIC THÊM/SỬA/XÓA DANH MỤC (CRUD) ---

const handleCategorySubmit = async (event) => {
    event.preventDefault();
    const name = document.getElementById('category-name').value;
    const isEditing = editingCategoryId !== null;

    const categoryData = { name };

    try {
        if (isEditing) {
            await categoriesCollection.doc(editingCategoryId).update(categoryData);
            alert('Cập nhật danh mục thành công!');
        } else {
            await categoriesCollection.add(categoryData);
            alert('Thêm danh mục thành công!');
        }
    } catch (error) {
        console.error('Lỗi thao tác danh mục:', error);
        alert(`Thao tác thất bại. Lỗi: ${error.message}`);
    }

    resetCategoryForm();
    loadCategories();
};

// HÀM EDIT DANH MỤC (Gắn vào window để gọi từ HTML)
window.editCategory = (id, name) => {
    editingCategoryId = id;
    document.getElementById('category-name').value = name;
    document.getElementById('category-submit-btn').textContent = 'Lưu thay đổi';
    document.getElementById('category-submit-btn').classList.add('edit-btn');
    document.getElementById('category-cancel-btn').style.display = 'inline-block';
    
    document.getElementById('category-form').scrollIntoView({ behavior: 'smooth' });
};

// HÀM DELETE DANH MỤC (Gắn vào window để gọi từ HTML)
window.deleteCategory = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;
    try {
        await categoriesCollection.doc(id).delete();
        alert('Xóa danh mục thành công!');
        loadCategories();
    } catch (error) {
        console.error('Lỗi khi xóa danh mục:', error);
        alert(`Xóa thất bại. Lỗi: ${error.message}`);
    }
};

const resetCategoryForm = () => {
    editingCategoryId = null;
    document.getElementById('category-form').reset();
    document.getElementById('category-submit-btn').textContent = 'Thêm Danh mục';
    document.getElementById('category-submit-btn').classList.remove('edit-btn');
    document.getElementById('category-cancel-btn').style.display = 'none';
};

// --- 4. LOGIC ĐIỀU HƯỚNG CHUNG ---

const handleNavigation = (page) => {
    const content = document.getElementById('admin-content');
    
    // Reset active class
    document.querySelectorAll('#admin-sidebar nav a').forEach(link => {
        link.classList.remove('active');
    });

    // Thêm active class cho link được chọn
    const activeLink = document.querySelector(`#admin-sidebar nav a[data-page="${page}"]`);
    if(activeLink) {
        activeLink.classList.add('active');
    }

    if (page === 'categories') {
        renderCategoriesPage(); 
    } else if (page === 'products') {
        renderProductsPage(); 
    } else if (page === 'orders') {
        renderOrdersPage();
    } else if (page === 'dashboard') {
        // GỌI TRANG ORDERS ĐỂ HIỂN THỊ THỐNG KÊ NGAY LẬP TỨC
        renderOrdersPage(); 
    } else {
        content.innerHTML = `<h2>Trang ${page} đang được xây dựng...</h2>`;
    }
};

// Gắn sự kiện cho Sidebar
const attachSidebarListeners = () => {
    document.querySelectorAll('#admin-sidebar nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = e.target.getAttribute('data-page');
            handleNavigation(page);
        });
    });
};

// --- KHỞI TẠO ---
document.addEventListener('DOMContentLoaded', () => {
    attachSidebarListeners();
    // Tải trang mặc định
    handleNavigation('dashboard'); 
});