-- 1. Tạo cơ sở dữ liệu và sử dụng
CREATE DATABASE IF NOT EXISTS book_store;
USE book_store;

-- 2. Tạo bảng Danh mục (Phải tạo trước vì bảng Books tham chiếu tới nó)
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT
);

-- 3. Tạo bảng Người dùng
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' -- 'user' hoặc 'admin'
);

-- 4. Tạo bảng Sách (Đã có category_id và liên kết FK)
CREATE TABLE IF NOT EXISTS books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255),
    description TEXT,
    image_url VARCHAR(255),
    price DECIMAL(10, 2),
    isbn VARCHAR(50) UNIQUE,
    published_date DATE DEFAULT (CURRENT_DATE),
    view_count INT DEFAULT 0,
    category_id INT,
    CONSTRAINT fk_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- 5. Tạo bảng Đánh giá (Liên kết với Users và Books)
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    book_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_review (user_id, book_id) 
);

-- 6. Tạo bảng chapter 
CREATE TABLE IF NOT EXISTS chapters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT NOT NULL,
    chapter_number INT NOT NULL,
    title VARCHAR(255),
    content TEXT,
    CONSTRAINT fk_book_chapter FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- ==========================================
-- DỮ LIỆU MẪU (Dữ liệu khởi tạo hệ thống)
-- ==========================================

-- Thêm Danh mục
INSERT IGNORE INTO categories (id, name, description) VALUES 
(1, 'Lập trình', 'Các sách về phát triển phần mềm, ngôn ngữ lập trình và công nghệ.'),
(2, 'Cơ sở dữ liệu', 'Kiến thức về thiết kế, quản trị và tối ưu hóa hệ quản trị CSDL.'),
(3, 'Kỹ năng mềm', 'Phát triển bản thân, giao tiếp và quản lý thời gian.'),
(4, 'Kinh tế', 'Kiến thức về tài chính, quản trị kinh doanh và khởi nghiệp.');

-- Thêm Người dùng (Admin và User mẫu)
INSERT IGNORE INTO users (id, username, password, email, role) VALUES 
(1, 'admin', '123', 'admin@gmail.com', 'admin'),
(2, 'quyphan', '123', 'quyphan@gmail.com'), 
(3, 'otaku', '123', 'otaku@gmail.com'); 

-- Thêm Sách mẫu (Gán vào các category_id tương ứng)
INSERT IGNORE INTO books (title, author, description, image_url, price, isbn, published_date, view_count, category_id) VALUES 
('Lập trình Node.js', 'TG Alpha', 'Sách hướng dẫn Node.js cơ bản từ Zero đến Hero.', 'book1.jpg', 150000, '978-1234567890', '2024-01-15', 120, 1),
('Mastering Express', 'TG Beta', 'Xây dựng ứng dụng web mạnh mẽ với Express.js.', 'book2.jpg', 200000, '978-0987654321', '2024-02-20', 85, 1),
('TypeScript Nâng Cao', 'Trần Văn A', 'Làm chủ các tính năng phức tạp của TypeScript.', 'book3.jpg', 250000, '978-1112223334', '2024-03-10', 210, 1),
('Database Design', 'TG Gamma', 'Thiết kế cơ sở dữ liệu chuẩn hóa và hiệu quả.', 'book2.jpg', 180000, '978-8889990001', '2024-06-05', 45, 2),
('Kỹ năng giao tiếp', 'TG Delta', 'Bí quyết để trở thành người giao tiếp lôi cuốn.', 'book4.jpg', 120000, '978-4443332221', '2024-08-25', 150, 3),
('Khởi nghiệp tinh gọn', 'Eric Ries', 'Phương pháp xây dựng doanh nghiệp thành công.', 'book5.jpg', 220000, '978-5556667778', '2024-09-12', 300, 4);

-- Thêm Đánh giá mẫu
INSERT IGNORE INTO reviews (user_id, book_id, rating, comment) VALUES 
(2, 1, 5, 'Sách viết rất dễ hiểu cho người mới bắt đầu học Nodejs.'),
(3, 1, 4, 'Nội dung tốt, ví dụ thực tế nhưng phần nâng cao hơi ít.'),
(2, 4, 5, 'Kiến thức về Database rất chuẩn, giúp mình tối ưu được nhiều câu query.'),
(3, 5, 5, 'Cuốn sách thay đổi cách mình giao tiếp với mọi người xung quanh.');

-- Thêm chapter
-- Dữ liệu chương cho sách ID 1 (Lập trình Node.js) - Đã có 2 chương, thêm chương 3
INSERT INTO chapters (book_id, chapter_number, title, content) VALUES 
(1, 3, 'Chương 3: Xây dựng Web Server đầu tiên', 'Trong chương này, chúng ta sẽ sử dụng module http có sẵn của Node.js để tạo một máy chủ cơ bản. Bạn sẽ hiểu về Request, Response và cách lắng nghe một cổng (port) trên localhost.');

-- Dữ liệu chương cho sách ID 3 (TypeScript Nâng Cao)
INSERT INTO chapters (book_id, chapter_number, title, content) VALUES 
(3, 1, 'Chương 1: Interface và Types', 'TypeScript cho phép chúng ta định nghĩa cấu trúc dữ liệu chặt chẽ. Interface giúp tạo ra các bản thiết kế cho đối tượng, đảm bảo tính nhất quán trong toàn bộ mã nguồn.'),
(3, 2, 'Chương 2: Generics nâng cao', 'Generics giúp chúng ta viết các hàm và lớp có thể tái sử dụng với nhiều kiểu dữ liệu khác nhau mà vẫn đảm bảo tính an toàn về kiểu (type-safety).'),
(3, 3, 'Chương 3: Decorators trong TypeScript', 'Decorators là một tính năng mạnh mẽ cho phép chúng ta can thiệp vào quá trình khởi tạo lớp, phương thức hoặc thuộc tính. Đây là nền tảng của các framework như NestJS.');

-- Dữ liệu chương cho sách ID 6 (Khởi nghiệp tinh gọn)
INSERT INTO chapters (book_id, chapter_number, title, content) VALUES 
(6, 1, 'Chương 1: Tầm nhìn', 'Mọi khởi nghiệp đều bắt đầu bằng một tầm nhìn, nhưng tầm nhìn đó cần được kiểm chứng thông qua các thử nghiệm thực tế thay vì chỉ nằm trên kế hoạch kinh doanh giấy.'),
(6, 2, 'Chương 2: Vòng lặp Xây dựng - Đo lường - Học hỏi', 'Đây là cốt lõi của phương pháp Tinh gọn. Bạn cần xây dựng sản phẩm tối thiểu (MVP), đo lường phản ứng khách hàng và học hỏi để cải tiến liên tục.');

-- Cập nhật lượt xem (view_count) để tạo sự khác biệt
UPDATE books SET view_count = 1250 WHERE id = 6; -- Khởi nghiệp tinh gọn dẫn đầu lượt xem
UPDATE books SET view_count = 890 WHERE id = 3;  -- TypeScript đứng thứ hai
UPDATE books SET view_count = 450 WHERE id = 1;  -- Node.js đứng thứ ba

-- Thêm thêm đánh giá để kiểm tra thống kê "Sách được đánh giá nhiều nhất"
-- Sách ID 1 (Node.js) sẽ có nhiều đánh giá nhất
INSERT IGNORE INTO reviews (user_id, book_id, rating, comment) VALUES 
(1, 1, 5, 'Admin cũng rất thích cuốn này, cực kỳ hữu ích!'),
(1, 3, 5, 'Kiến thức chuyên sâu tuyệt vời.'),
(2, 6, 4, 'Cuốn sách gối đầu giường cho các startup.'),
(3, 6, 5, 'Rất thực tế và dễ áp dụng.');