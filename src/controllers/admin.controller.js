const Book = require('../models/book.model');
const User = require('../models/user.model');
const Category = require('../models/category.model');

// Hàm tiện ích để gửi thông báo alert và quay lại
const showAlertAndBack = (res, message) => {
    return res.send(`<script>alert("${message}"); window.history.back();</script>`);
};

// 1. Hiển thị danh sách quản lý sách cho admin
exports.getDashboard = async (req, res) => {
    try {
        const books = await Book.getAll();
        res.render('admin/dashboard', { books });
    } catch (error) {
        console.error(error);
        showAlertAndBack(res, 'Lỗi hệ thống: Không thể tải danh sách sách.');
    }
};

// 2. Hiển thị form thêm sách mới
exports.getAddBook = async (req, res) => {
    try {
        const categories = await Category.getAll();
        res.render('admin/add-book', { categories });
    } catch (error) {
        showAlertAndBack(res, 'Không thể lấy danh mục cho form thêm sách.');
    }
};

// 3. Xử lý thêm sách mới
exports.postAddBook = async (req, res) => {
    try {
        const { title, author, description, price, isbn, category_id } = req.body;
        const image_url = req.file ? req.file.filename : 'default-book.jpg';
        
        await Book.create({ 
            title, author, description, image_url, price, 
            isbn: isbn || null, 
            category_id: category_id || null 
        });
        res.redirect('/admin');
    } catch (error) {
        console.error("Lỗi thêm sách:", error);
        showAlertAndBack(res, 'Lỗi khi thêm sách mới. Vui lòng kiểm tra lại dữ liệu.');
    }
};

// 4. Hiển thị form chỉnh sửa sách
exports.getEditBook = async (req, res) => {
    try {
        const bookId = req.params.id;
        const book = await Book.getById(bookId);
        const categories = await Category.getAll();

        if (!book) return showAlertAndBack(res, 'Không tìm thấy sách yêu cầu.');
        
        res.render('admin/edit-book', { book, categories });
    } catch (error) {
        console.error(error);
        showAlertAndBack(res, 'Lỗi hệ thống khi tải thông tin chỉnh sửa.');
    }
};

// 5. Xử lý cập nhật thông tin sách
exports.postEditBook = async (req, res) => {
    try {
        const { title, author, description, price, isbn, category_id } = req.body;
        const bookId = req.params.id;
        
        const oldBook = await Book.getById(bookId);
        const image_url = req.file ? req.file.filename : oldBook.image_url;

        await Book.update(bookId, { 
            title, author, description, image_url, price, 
            isbn: isbn || null, 
            category_id: category_id || null 
        });
        res.redirect('/admin');
    } catch (error) {
        console.error("Lỗi cập nhật:", error);
        showAlertAndBack(res, 'Lỗi khi cập nhật thông tin sách.');
    }
};

// 6. Xử lý xóa sách
exports.postDeleteBook = async (req, res) => {
    try {
        const bookId = req.params.id;
        await Book.delete(bookId);
        res.redirect('/admin');
    } catch (error) {
        console.error("Lỗi xóa sách:", error);
        showAlertAndBack(res, 'Lỗi: Không thể xóa sách này. Có thể sách đang liên kết với dữ liệu khác.');
    }
};

// 7. lấy thống kê 
exports.getStatistics = async (req, res) => {
    try {
        const stats = await Book.getStatistics();
        res.render('admin/statistics', { stats });
    } catch (error) {
        res.status(500).send('Lỗi tải dữ liệu thống kê');
    }
};

// --- QUẢN LÝ NGƯỜI DÙNG ---

exports.getUserManagement = async (req, res) => {
    try {
        const users = await User.getAll();
        res.render('admin/user-list', { users });
    } catch (error) {
        console.error(error);
        showAlertAndBack(res, 'Lỗi: Không thể tải danh sách người dùng.');
    }
};

exports.postDeleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.getById(userId);

        if (!user) return showAlertAndBack(res, 'Người dùng này không tồn tại.');

        if (user.role === 'admin') {
            return showAlertAndBack(res, 'Hành động bị từ chối: Không thể xóa tài khoản Admin!');
        }

        await User.delete(userId);
        res.redirect('/admin/users');
        
    } catch (error) {
        console.error("Lỗi khi xóa người dùng:", error);
        showAlertAndBack(res, 'Lỗi hệ thống khi xóa người dùng.');
    }
};

// --- QUẢN LÝ ĐÁNH GIÁ ---

exports.getReviewManagement = async (req, res) => {
    try {
        const reviews = await Book.getAllReviews();
        res.render('admin/review-list', { reviews });
    } catch (error) {
        showAlertAndBack(res, 'Lỗi: Không thể tải danh sách đánh giá.');    
    }
};

exports.postDeleteReview = async (req, res) => {
    try {
        await Book.deleteReview(req.params.id);
        res.redirect('/admin/reviews');
    } catch (error) {
        showAlertAndBack(res, 'Lỗi: Không thể xóa đánh giá này.');
    }
};