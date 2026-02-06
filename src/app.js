require('dotenv').config();
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const { engine } = require('express-handlebars');

// Import Models
const Category = require('./models/category.model'); // Thêm dòng này

// Import các Routes
const bookRoutes = require('./routes/book.route');
const authRoutes = require('./routes/auth.route');
const adminRoutes = require('./routes/admin.route');

const app = express();
const port = 3000;

app.use(session({
    secret: 'secret-key-book-store',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.engine('hbs', engine({
    extname: '.hbs',
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'resources/views/layouts'),
    partialsDir: path.join(__dirname, 'resources/views/partials'),
    helpers: {
        eq: (a, b) => String(a) === String(b) // Cải tiến để so sánh cả số và chuỗi
    }
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'resources/views'));

app.use(express.static(path.join(__dirname, 'public')));

// 4. Middleware toàn cục: Cập nhật để lấy danh mục cho Header
app.use(async (req, res, next) => {
    try {
        res.locals.user = req.session.user || null;
        // Lấy tất cả danh mục để hiển thị trên thanh search của Header
        res.locals.allCategories = await Category.getAll();
        next();
    } catch (error) {
        console.error("Lỗi Middleware app.js:", error);
        next();
    }
});

app.use('/', bookRoutes);
app.use('/', authRoutes);
app.use('/', adminRoutes);

app.listen(port, () => {
    console.log(`Ứng dụng đang chạy thành công tại http://localhost:${port}`);
});