const User = require('../models/user.model');

// Hiển thị giao diện đăng nhập và đăng ký
exports.getLogin = (req, res) => res.render('login');
exports.getSignup = (req, res) => res.render('signup');

// Xử lý đăng ký thành viên mới
exports.postSignup = async (req, res) => {
    const { username, password, email } = req.body;
    try {
        await User.create(username, password, email);
        res.redirect('/login');
    } catch (error) {
        res.status(500).send("Lỗi hệ thống khi đăng ký");
    }
};

// Xử lý đăng nhập và lưu thông tin vào Session
exports.postLogin = async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findByUsername(username);
        if (user && user.password === password) {
            // Lưu id, username và role vào session để phân quyền
            req.session.user = {
                id: user.id,
                username: user.username,
                role: user.role
            };
            res.redirect('/');
        } else {
            res.status(401).send("Sai tài khoản hoặc mật khẩu");
        }
    } catch (error) {
        res.status(500).send("Lỗi hệ thống");
    }
};

// Xử lý đăng xuất hoàn toàn
exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Lỗi khi hủy session:", err);
            return res.redirect('/');
        }
        res.clearCookie('connect.sid'); // Xóa cookie của phiên làm việc
        res.redirect('/'); // Quay về trang chủ mặc định
    });
};