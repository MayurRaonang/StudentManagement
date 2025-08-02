import db from '../db.js';

export const getAllUsers = async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM users");
        res.json(result.rows);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const createUser = async (req, res) => {
    const { name, email } = req.body;
    try {
        const result = await db.query(
            "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *",
            [name, email]
        );
        res.status(201).json(result.rows[0]);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getUserById = async (req, res) => {
    const id = req.params.id;
    try {
        const result = await db.query("SELECT * FROM users WHERE id = $1", [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json(result.rows[0]);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
export const updateUser = async (req, res) => {
    const id = req.params.id;
    const { name, email } = req.body;
    try {
        const result = await db.query(
            "UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING *",
            [name, email, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
export const deleteUser = async (req, res) => {
    const id = req.params.id;
    try {
        const result = await db.query("DELETE FROM users WHERE id = $1 RETURNING *", [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(204).end();
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
