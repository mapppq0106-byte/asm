const express = require('express');
const router = express.Router();
const bookController = require('../controllers/book.controller');
const { isAuthApi } = require('../middleware/auth.middleware');

// --- ROUTES WEB (GIỮ NGUYÊN) ---
router.get('/', bookController.getAllBooks);
router.get('/book/:id', bookController.getBookDetail);
router.post('/book/:id/review', bookController.postReview);

// --- ROUTES REST API (HOÀN THIỆN Y2) ---

// Lấy danh sách sách: GET http://localhost:3000/api/books
router.get('/api/books', bookController.getBooksApi);

// Chi tiết sách theo ISBN: GET http://localhost:3000/api/isbn/:isbn
router.get('/api/isbn/:isbn', bookController.getBookApi);

// Gửi đánh giá API: POST http://localhost:3000/api/book/:id/review
router.post('/api/book/:id/review', isAuthApi, bookController.postReviewApi);

module.exports = router;