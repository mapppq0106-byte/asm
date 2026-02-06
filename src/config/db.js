const mysql = require('mysql2/promise');

const poolConfig = {
  host: process.env.DB_HOST, // Hiện đang là 'db' trong file .env của bạn
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4_unicode_ci'
};

let pool;

const connectWithRetry = async () => {
  try {
    pool = mysql.createPool(poolConfig);
    // Thử thực hiện một truy vấn nhỏ để kiểm tra kết nối
    await pool.query('SELECT 1');
    console.log('Kết nối MySQL thành công!');
  } catch (err) {
    console.error('MySQL chưa sẵn sàng, đang thử lại sau 5 giây...', err.message);
    setTimeout(connectWithRetry, 5000); // Thử lại sau 5 giây
  }
};

connectWithRetry();

module.exports = {
    execute: (...args) => pool.execute(...args),
    query: (...args) => pool.query(...args)
};