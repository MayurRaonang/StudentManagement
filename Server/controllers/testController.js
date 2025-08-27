import db from '../db.js';

export const getAllTests = async (req, res) => {
    console.log("Fetching all test for userid = ", req.user.id);
    const userId = req.user.id;
    try {
        const result = await db.query("SELECT * FROM tests where user_id = $1", [userId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const createTest = async (req, res) => {
    const { subject, chapter, total_marks, test_date, standard } = req.body;
    const user_id = req.user.id;
    console.log("Creating test with data:", {
        subject,
        chapter,
        total_marks,
        test_date,
        user_id,
        standard
    });
    try {
        const result = await db.query(
            "INSERT INTO tests (subject, chapter, total_marks, test_date, user_id, std) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
            [subject, chapter, total_marks, test_date, user_id, standard]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Error creating test:", err);
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