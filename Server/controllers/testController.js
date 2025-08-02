import db from '../db.js';

export const getAllTests = async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM tests");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const createTest = async (req, res) => {
    const { subject, chapter, total_marks, test_date, user_id } = req.body;
    try {
        const result = await db.query(
            "INSERT INTO tests (subject, chapter, total_marks, test_date, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [subject, chapter, total_marks, test_date, user_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getTestsByUser = async (req, res) => {
    const userId = req.params.userId;
    try {
        const result = await db.query("SELECT * FROM tests WHERE user_id = $1", [userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "No tests found for this user" });
        }
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getSpecificTest = async (req, res) => {
    const { subject, chapter, date } = req.query;
    try {
        const result = await db.query(
            "SELECT * FROM tests WHERE subject = $1 AND chapter = $2 AND test_date = $3",
            [subject, chapter, date]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Test not found" });
        }
        res.json(result.rows[0]);
    }
    catch (err) {
        console.error("Error fetching specific test:", err);
        res.status(500).json({ error: err.message });
    }
};