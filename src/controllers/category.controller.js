// src/controllers/category.controller.js
const Category = require('../models/category.model');

exports.getCategoryManagement = async (req, res) => {
    try {
        const categories = await Category.getAll();
        res.render('admin/category-list', { 
            categories,
            // Đảm bảo hiển thị đúng layout nếu bạn có chia layout admin riêng
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Lỗi tải danh mục');
    }
};

exports.postAddCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) return res.status(400).send('Tên không được để trống');
        
        await Category.create(name, description);
        res.redirect('/admin/categories');
    } catch (error) {
        console.error(error);
        res.status(500).send('Lỗi khi thêm danh mục');
    }
};

// Thêm chức năng xóa danh mục nếu chưa có
exports.getDeleteCategory = async (req, res) => {
    try {
        const id = req.params.id;
        await Category.delete(id);
        res.redirect('/admin/categories');
    } catch (error) {
        console.error(error);
        res.status(500).send('Lỗi khi xóa danh mục');
    }
};