const Book = require('../models/book.model');

// Hiển thị trang chủ và tìm kiếm (Cập nhật logic lọc danh mục)
exports.getAllBooks = async (req, res) => {
    try {
        const keyword = req.query.search;
        const categoryId = req.query.category; // Lấy ID danh mục từ dropdown header

        let books;
        
        // Logic lọc kết hợp: Nếu có category hoặc có từ khóa tìm kiếm
        if (categoryId || keyword) {
            books = await Book.searchBooks(keyword ? keyword.trim() : '', categoryId || null);
        } else {
            books = await Book.getAll();
        }

        res.render('home', { 
            books, 
            keyword, 
            currentCategory: categoryId // Gửi lại để header giữ trạng thái đã chọn
        });
    } catch (error) {
        console.error("Lỗi getAllBooks:", error);
        res.status(500).send('Lỗi khi lấy dữ liệu sách');
    }
};

// Hiển thị chi tiết sách
exports.getBookDetail = async (req, res) => {
    try {
        const bookId = req.params.id;
        const book = await Book.getById(bookId);
        
        if (!book) {
            return res.status(404).send('Không tìm thấy sách');
        }

        const reviews = await Book.getReviews(bookId);
        
        // Kiểm tra xem người dùng đã đánh giá chưa
        let hasReviewed = false;
        if (req.session.user) {
            hasReviewed = await Book.checkUserReview(req.session.user.id, bookId);
        }

        res.render('book-detail', { 
            book, 
            reviews, 
            hasReviewed,
            user: req.session.user 
        });
    } catch (error) {
        console.error("Lỗi chi tiết:", error); 
        res.status(500).send('Lỗi tải trang chi tiết');
    }
};

// Xử lý gửi đánh giá mới
exports.postReview = async (req, res) => {
    try {
        const bookId = req.params.id;
        const { rating, comment } = req.body;
        const userId = req.session.user ? req.session.user.id : null; 

        if (!userId) return res.redirect('/login');

        const alreadyReviewed = await Book.checkUserReview(userId, bookId);
        if (alreadyReviewed) return res.status(400).send('Bạn đã đánh giá sách này rồi');

        await Book.addReview(userId, bookId, rating, comment);
        res.redirect(`/book/${bookId}`);
    } catch (error) {
        res.status(500).send('Lỗi khi gửi đánh giá');
    }
};

// --- CÁC HÀM API JSON ---
exports.getBookApi = async (req, res) => {
    try {
        const isbn = req.params.isbn;
        const book = await Book.getByIsbn(isbn);

        if (!book) {
            return res.status(404).json({ message: "Không tìm thấy sách với mã ISBN này" });
        }

        res.json({
            title: book.title,
            author: book.author,
            published_date: "2026-01-26",
            isbn: book.isbn,
            view_count: 100,
            average_score: parseFloat(book.average_score || 0).toFixed(1)
        });
    } catch (error) {
        res.status(500).json({ error: "Lỗi hệ thống API" });
    }
};

exports.getBooksApi = async (req, res) => {
    try {
        const books = await Book.getAll();
        res.status(200).json({ success: true, data: books });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi lấy danh sách API" });
    }
};

exports.postReviewApi = async (req, res) => {
    try {
        const bookId = req.params.id;
        const { rating, comment } = req.body;
        const userId = req.session.user ? req.session.user.id : null;

        if (!userId) return res.status(401).json({ success: false, message: "Chưa đăng nhập" });

        const alreadyReviewed = await Book.checkUserReview(userId, bookId);
        if (alreadyReviewed) {
            return res.status(400).json({ success: false, message: "Bạn đã đánh giá sách này rồi" });
        }

        await Book.addReview(userId, bookId, rating, comment);
        res.status(201).json({ success: true, message: "Đánh giá thành công!" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi server khi gửi đánh giá API" });
    }
};

exports.readBook = async (req, res) => {
    try {
        const bookId = req.params.id;
        const chapterNum = req.query.chapter || 1;
        const book = await Book.getById(bookId);
        const chapters = await Book.getChapters(bookId);
        const currentChapter = await Book.getChapterDetail(bookId, chapterNum);

        res.render('read-book', { book, chapters, currentChapter });
    } catch (error) {
        res.status(500).send('Lỗi khi tải nội dung sách');
    }
};