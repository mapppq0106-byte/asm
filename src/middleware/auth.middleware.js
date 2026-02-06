// Kiểm tra quyền Admin (Giữ nguyên)
exports.isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        res.status(403).send('Truy cập bị từ chối: Bạn không có quyền Admin!');
    }
};

// MỚI: Kiểm tra đăng nhập cho API (Trả về JSON)
exports.isAuthApi = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.status(401).json({ 
            success: false, 
            message: "Unauthorized: Vui lòng đăng nhập để thực hiện thao tác này" 
        });
    }
};