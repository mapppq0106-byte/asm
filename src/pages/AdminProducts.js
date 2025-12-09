// src/pages/AdminProducts.js

// Đảm bảo import cả db và storage
import { db, storage } from '../firebase/firebase.js'; 

const productsCollection = db.collection('products');
const categoriesCollection = db.collection('categories');

let editingProductId = null; 

// Hàm trợ giúp: Định dạng giá tiền
const formatPrice = (price) => {
    const numericPrice = Number(price); 
    return numericPrice ? new Intl.NumberFormat('vi-VN').format(numericPrice) : '0';
};

// --- 1. RENDER GIAO DIỆN QUẢN LÝ SẢN PHẨM (ĐÃ SỬA BỐ CỤC) ---

export const renderProductsPage = async () => {
    const content = document.getElementById('admin-content');
    
    // Tải danh mục trước để điền vào Select
    const categories = await getCategoriesData();
    const categoryOptions = categories.map(cate => 
        `<option value="${cate.id}">${cate.name}</option>`
    ).join('');

    content.innerHTML = `
        <h2>Quản lý Sản phẩm</h2>
        
        <div class="content-grid">
            
            <div>
                <form id="product-form" class="admin-form">
                    <input type="hidden" id="product-id">
                    
                    <div class="form-group">
                        <label for="product-name">Tên Sản phẩm:</label>
                        <input type="text" id="product-name" required>
                    </div>

                    <div class="form-group">
                        <label for="product-cate-id">Danh mục:</label>
                        <select id="product-cate-id" required>
                            <option value="">-- Chọn Danh mục --</option>
                            ${categoryOptions}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="product-price">Giá:</label>
                        <input type="number" id="product-price" required min="0">
                    </div>

                    <div class="form-group">
                        <label for="product-detail">Mô tả chi tiết:</label>
                        <textarea id="product-detail" rows="3" required></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="product-image-file">Hình ảnh:</label>
                        <input type="file" id="product-image-file" accept="image/*" data-current-url="">
                        <div id="current-image-preview"></div>
                    </div>

                    <button type="submit" class="action-btn" id="product-submit-btn">Thêm Sản phẩm</button>
                    <button type="button" class="action-btn edit-btn" id="product-cancel-btn" style="display:none;">Hủy sửa</button>
                </form>
            </div>
            <div class="product-list-wrapper">
                <h3>Danh sách Sản phẩm</h3>
                <div id="products-list">Đang tải sản phẩm...</div> 
            </div>
            </div>
        `;

    document.getElementById('product-form').addEventListener('submit', handleProductSubmit);
    document.getElementById('product-cancel-btn').addEventListener('click', resetProductForm);

    // Gắn hàm vào window để có thể gọi từ HTML
    window.editProduct = editProduct;
    window.deleteProduct = deleteProduct;

    loadProducts();
};


// --- 2. LOGIC TẢI DỮ LIỆU ---

const getCategoriesData = async () => {
    try {
        const snapshot = await categoriesCollection.get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Lỗi tải danh mục:', error);
        return [];
    }
};

const loadProducts = async () => {
    const listContainer = document.getElementById('products-list');
    try {
        const snapshot = await productsCollection.get();
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const categories = await getCategoriesData();
        const categoryMap = categories.reduce((map, cate) => {
            map[cate.id] = cate.name;
            return map;
        }, {});

        if (products.length === 0) {
            listContainer.innerHTML = '<p>Chưa có sản phẩm nào.</p>';
            return;
        }

        let tableHTML = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Ảnh</th>
                        <th>Tên SP</th>
                        <th>Danh mục</th>
                        <th>Giá</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
        `;

        products.forEach(p => {
            tableHTML += `
                <tr>
                    <td><img src="${p.image}" alt="${p.name}" style="width: 50px; height: 50px; object-fit: cover;"></td>
                    <td>${p.name}</td>
                    <td>${categoryMap[p.cate_id] || 'N/A'}</td>
                    <td>${formatPrice(p.price)} VNĐ</td>
                    <td>
                        <button class="action-btn edit-btn" onclick="window.editProduct('${p.id}')">Sửa</button>
                        <button class="action-btn delete-btn" onclick="window.deleteProduct('${p.id}', '${p.image}')">Xóa</button>
                    </td>
                </tr>
            `;
        });

        tableHTML += `</tbody></table>`;
        listContainer.innerHTML = tableHTML;

    } catch (error) {
        // KHỐI LỖI ĐÃ YÊU CẦU: Hiển thị lỗi rõ ràng khi tải danh sách thất bại
        console.error('Lỗi khi tải sản phẩm:', error); 
        listContainer.innerHTML = '<p>Lỗi tải dữ liệu sản phẩm. Vui lòng kiểm tra Firebase Rules cho collection "products".</p>';
    }
};

// --- 3. LOGIC THÊM/SỬA SẢN PHẨM (CRUD) VÀ XỬ LÝ ẢNH ---

const uploadImage = (file) => {
    return new Promise((resolve, reject) => {
        const fileName = `${Date.now()}_${file.name}`;
        const storageRef = storage.ref(`products/${fileName}`);
        const uploadTask = storageRef.put(file);

        uploadTask.on('state_changed', 
            (snapshot) => {
                // Có thể thêm logic hiển thị tiến trình
            }, 
            (error) => {
                reject(error);
            }, 
            () => {
                uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                    resolve(downloadURL);
                }).catch(reject);
            }
        );
    });
};

// HÀM XỬ LÝ SUBMIT CHÍNH
const handleProductSubmit = async (event) => {
    event.preventDefault(); 
    
    const submitBtn = document.getElementById('product-submit-btn');
    const isEditing = editingProductId !== null;

    submitBtn.disabled = true;
    submitBtn.textContent = isEditing ? 'Đang lưu...' : 'Đang thêm...';

    const name = document.getElementById('product-name').value;
    const cate_id = document.getElementById('product-cate-id').value;
    const price = document.getElementById('product-price').value;
    const detail = document.getElementById('product-detail').value;
    const imageFile = document.getElementById('product-image-file').files[0];
    const imageInput = document.getElementById('product-image-file');
    const currentImageUrl = imageInput.getAttribute('data-current-url');

    let imageUrl = currentImageUrl || '';
    
    try {
        // 1. Xử lý Upload/Update ảnh
        if (imageFile) {
            imageUrl = await uploadImage(imageFile);
            if (isEditing && currentImageUrl && currentImageUrl.startsWith('http')) {
                const oldRef = storage.refFromURL(currentImageUrl);
                await oldRef.delete().catch(err => console.warn("Could not delete old image:", err));
            }
        } else if (!isEditing && !imageUrl) { 
            alert('Vui lòng chọn hình ảnh cho sản phẩm.');
            return; 
        }

        // 2. Chuẩn bị Dữ liệu
        const productData = {
            name,
            cate_id,
            price: Number(price), 
            detail,
            image: imageUrl,
        };

        // 3. Thực hiện CRUD
        if (isEditing) {
            await productsCollection.doc(editingProductId).update(productData);
            alert('Cập nhật sản phẩm thành công!');
        } else {
            await productsCollection.add(productData); // THÊM MỚI VÀO FIRESTORE
            alert('Thêm sản phẩm thành công!');
        }

    } catch (error) {
        console.error('Lỗi thao tác sản phẩm:', error);
        alert(`Thao tác thất bại. Lỗi: ${error.message}`);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = isEditing ? 'Lưu thay đổi' : 'Thêm Sản phẩm';
        
        resetProductForm();
        loadProducts(); // GỌI LẠI LOAD ĐỂ CẬP NHẬT DANH SÁCH
    }
};

const editProduct = async (id) => {
    try {
        const doc = await productsCollection.doc(id).get();
        if (!doc.exists) {
            alert('Không tìm thấy sản phẩm.');
            return;
        }
        const data = doc.data();
        
        editingProductId = id;
        document.getElementById('product-name').value = data.name;
        document.getElementById('product-cate-id').value = data.cate_id;
        document.getElementById('product-price').value = data.price;
        document.getElementById('product-detail').value = data.detail;
        
        // Xử lý ảnh
        const imageInput = document.getElementById('product-image-file');
        imageInput.removeAttribute('required');
        imageInput.setAttribute('data-current-url', data.image);

        document.getElementById('current-image-preview').innerHTML = `<p>Ảnh hiện tại:</p><img src="${data.image}" style="width: 80px; height: 80px; object-fit: cover;">`;

        // Cập nhật nút
        document.getElementById('product-submit-btn').textContent = 'Lưu thay đổi';
        document.getElementById('product-submit-btn').classList.add('edit-btn');
        document.getElementById('product-cancel-btn').style.display = 'inline-block';

        document.getElementById('product-form').scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error('Lỗi khi tải chi tiết sản phẩm:', error);
        alert('Lỗi khi tải chi tiết sản phẩm.');
    }
};

const deleteProduct = async (id, imageUrl) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này? Thao tác này sẽ xóa cả hình ảnh liên quan.')) {
        return;
    }
    try {
        // 1. Xóa ảnh khỏi Storage
        if (imageUrl && imageUrl.startsWith('http')) {
            const imageRef = storage.refFromURL(imageUrl);
            await imageRef.delete().catch(err => console.warn("Could not delete image from storage:", err));
        }

        // 2. Xóa document khỏi Firestore
        await productsCollection.doc(id).delete();
        alert('Xóa sản phẩm thành công!');
        loadProducts(); 
    } catch (error) {
        console.error('Lỗi khi xóa sản phẩm:', error);
        alert(`Xóa thất bại. Lỗi: ${error.message}`);
    }
};

// Hàm Reset Form
const resetProductForm = () => {
    // 1. Đảm bảo đặt lại trạng thái chỉnh sửa
    editingProductId = null; 
    
    const imageInput = document.getElementById('product-image-file');
    
    // 2. Reset form
    document.getElementById('product-form').reset();
    
    // 3. Đặt lại các thuộc tính ảnh
    imageInput.removeAttribute('required'); // Xóa required
    imageInput.removeAttribute('data-current-url');
    document.getElementById('current-image-preview').innerHTML = '';
    
    // 4. Đặt lại nút Submit
    document.getElementById('product-submit-btn').textContent = 'Thêm Sản phẩm';
    document.getElementById('product-submit-btn').classList.remove('edit-btn');
    document.getElementById('product-cancel-btn').style.display = 'none';
};