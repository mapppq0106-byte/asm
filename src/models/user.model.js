const db = require('../config/db');

const User = {
    // --- CHỨC NĂNG CŨ: GIỮ NGUYÊN ---
    create: async (username, password, email) => {
        return await db.execute(
            'INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)',
            [username, password, email, 'user']
        );
    },

    findByUsername: async (username) => {
        const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
        return rows[0];
    },

    // --- CHỨC NĂNG MỚI: QUẢN LÝ NGƯỜI DÙNG ---
    getAll: async () => {
        const [rows] = await db.execute('SELECT id, username, email, role FROM users');
        return rows;
    },

    updateRole: async (id, newRole) => {
        return await db.execute('UPDATE users SET role = ? WHERE id = ?', [newRole, id]);
    },

    delete: async (id) => {
        return await db.execute('DELETE FROM users WHERE id = ?', [id]);
    },

    getById: async (id) => {
    const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0];
    }
};

module.exports = User;