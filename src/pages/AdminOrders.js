// src/pages/AdminOrders.js

import { db } from '../firebase/firebase.js';

// Hàm trợ giúp: Định dạng giá tiền (Nếu bạn có file utils/formatPrice.js, hãy dùng nó)
const formatPrice = (price) => {
    const numericPrice = Number(price); 
    return numericPrice ? new Intl.NumberFormat('vi-VN').format(numericPrice) : '0';
};

const ordersCollection = db.collection('orders');
const orderDetailsCollection = db.collection('order_details');

// --- 1. RENDER GIAO DIỆN CHÍNH ---

export const renderOrdersPage = async () => {
    const content = document.getElementById('admin-content');
    content.innerHTML = `
        <h2>Quản lý Đơn hàng & Thống kê</h2>
        
        <div id="statistics-summary" class="admin-form">
            <h3> Thống kê nhanh</h3>
            <p>Tổng Doanh thu: <strong id="total-revenue">Đang tải...</strong></p>
            <p>Tổng Sản phẩm đã bán: <strong id="total-sold-products">Đang tải...</strong></p>
        </div>

        <h3>Danh sách Đơn hàng</h3>
        <div id="orders-list">Đang tải đơn hàng...</div>
    `;

    loadStatistics();
    loadOrders();
};

// --- 2. LOGIC THỐNG KÊ (YÊU CẦU Y2) ---

const loadStatistics = async () => {
    let totalRevenue = 0;
    let totalSoldProducts = 0;

    try {
        // Lấy tất cả chi tiết đơn hàng (để tính toán tổng doanh thu và số lượng)
        const detailsSnapshot = await orderDetailsCollection.get();

        detailsSnapshot.docs.forEach(detailDoc => {
            const detail = detailDoc.data();
            const subtotal = detail.quantity * detail.unit_price;
            
            totalRevenue += subtotal;
            totalSoldProducts += detail.quantity;
        });

        // Hiển thị kết quả thống kê
        document.getElementById('total-revenue').textContent = formatPrice(totalRevenue) + ' VNĐ';
        document.getElementById('total-sold-products').textContent = totalSoldProducts;

    } catch (error) {
        console.error('Lỗi khi tải thống kê:', error);
        document.getElementById('total-revenue').textContent = 'Lỗi';
        document.getElementById('total-sold-products').textContent = 'Lỗi';
    }
};


// --- 3. LOGIC QUẢN LÝ ĐƠN HÀNG (YÊU CẦU Y2) ---

const loadOrders = async () => {
    const listContainer = document.getElementById('orders-list');
    try {
        // Lấy danh sách đơn hàng, sắp xếp theo ngày tạo mới nhất
        const snapshot = await ordersCollection.orderBy('created_date', 'desc').get();
        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (orders.length === 0) {
            listContainer.innerHTML = '<p>Chưa có đơn hàng nào.</p>';
            return;
        }

        let tableHTML = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Mã ĐH</th>
                        <th>Khách hàng</th>
                        <th>Ngày đặt</th>
                        <th>Trạng thái</th>
                        <th>Chi tiết</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
        `;

        orders.forEach(order => {
            // Chuyển đổi Firestore Timestamp sang Date
            const date = order.created_date ? new Date(order.created_date.toDate()).toLocaleDateString('vi-VN') : 'N/A';
            const statusClass = order.status === 'Completed' ? 'status-completed' : order.status === 'Pending' ? 'status-pending' : 'status-shipped';

            tableHTML += `
                <tr>
                    <td>${order.id.substring(0, 6)}...</td>
                    <td>${order.customer_name}</td>
                    <td>${date}</td>
                    <td><span class="${statusClass}">${order.status}</span></td>
                    <td><button class="action-btn" onclick="viewOrderDetails('${order.id}')">Xem</button></td>
                    <td>
                        <select id="status-${order.id}" onchange="window.updateOrderStatus('${order.id}', this.value)">
                            <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Chờ xử lý</option>
                            <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Đang giao</option>
                            <option value="Completed" ${order.status === 'Completed' ? 'selected' : ''}>Hoàn tất</option>
                            <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Đã hủy</option>
                        </select>
                    </td>
                </tr>
            `;
        });

        tableHTML += `</tbody></table>`;
        listContainer.innerHTML = tableHTML;
        
        addStatusStyles();

    } catch (error) {
        console.error('Lỗi khi tải đơn hàng:', error);
        listContainer.innerHTML = '<p>Lỗi tải dữ liệu đơn hàng.</p>';
    }
};

// Hàm Cập nhật Trạng thái Đơn hàng (Gắn vào window)
window.updateOrderStatus = async (orderId, newStatus) => {
    try {
        await ordersCollection.doc(orderId).update({ status: newStatus });
        alert(`Cập nhật trạng thái đơn hàng ${orderId.substring(0, 6)}... thành ${newStatus} thành công!`);
        loadOrders(); // Tải lại danh sách
    } catch (error) {
        console.error('Lỗi khi cập nhật trạng thái:', error);
        alert('Cập nhật trạng thái thất bại.');
    }
};

// Hàm Xem Chi tiết Đơn hàng (Gắn vào window)
window.viewOrderDetails = async (orderId) => {
    try {
        const docRef = ordersCollection.doc(orderId);
        const orderDoc = await docRef.get();
        const order = orderDoc.data();
        
        // Lấy chi tiết sản phẩm trong đơn hàng
        const detailsSnapshot = await orderDetailsCollection.where('order_id', '==', orderId).get();
        const orderDetails = detailsSnapshot.docs.map(doc => doc.data());

        let detailsText = `Chi tiết Đơn hàng Mã ${orderId}\n`;
        detailsText += `Khách hàng: ${order.customer_name}\n`;
        detailsText += `Địa chỉ: ${order.customer_address}\n`;
        detailsText += `Email: ${order.customer_email}\n`;
        detailsText += `Trạng thái: ${order.status}\n\n`;

        let total = 0;

        orderDetails.forEach(item => {
            const subtotal = item.quantity * item.unit_price;
            total += subtotal;
            detailsText += `- SP ID ${item.product_id.substring(0, 6)}... | SL: ${item.quantity} | Giá: ${formatPrice(item.unit_price)} | TT: ${formatPrice(subtotal)} VNĐ\n`;
        });

        detailsText += `\nTổng cộng: ${formatPrice(total)} VNĐ`;
        
        alert(detailsText);

    } catch (error) {
        console.error('Lỗi khi xem chi tiết đơn hàng:', error);
        alert('Không thể tải chi tiết đơn hàng.');
    }
};

// Hàm thêm CSS trạng thái (Cần thêm vào admin.css nếu muốn định dạng vĩnh viễn)
const addStatusStyles = () => {
    if (!document.querySelector('style#admin-status-styles')) {
        const style = document.createElement('style');
        style.id = 'admin-status-styles';
        style.innerHTML = `
            .status-pending { background-color: #ffc107; color: #333; padding: 3px 6px; border-radius: 3px; font-weight: bold; font-size: 0.9em; }
            .status-shipped { background-color: #17a2b8; color: white; padding: 3px 6px; border-radius: 3px; font-weight: bold; font-size: 0.9em; }
            .status-completed { background-color: #28a745; color: white; padding: 3px 6px; border-radius: 3px; font-weight: bold; font-size: 0.9em; }
            .status-cancelled { background-color: #dc3545; color: white; padding: 3px 6px; border-radius: 3px; font-weight: bold; font-size: 0.9em; }
        `;
        document.head.appendChild(style);
    }
}