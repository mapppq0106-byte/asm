# Sử dụng Node.js phiên bản nhẹ (Alpine)
FROM node:20-alpine

# Thiết lập thư mục làm việc bên trong container
WORKDIR /usr/src/app

# Copy các file quản lý thư viện vào trước
COPY package*.json ./

# Cài đặt các dependencies
RUN npm install

# Copy toàn bộ code từ thư mục book_store vào container
COPY . .

# Mở cổng ứng dụng (thường là 3000 cho Node.js)
EXPOSE 3000

# Lệnh khởi chạy ứng dụng
CMD ["npm", "start"]