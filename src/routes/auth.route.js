const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Trang Đăng nhập
router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);

// Trang Đăng ký
router.get('/signup', authController.getSignup);
router.post('/signup', authController.postSignup);

// Đường dẫn Đăng xuất
router.get('/logout', authController.logout);

module.exports = router;