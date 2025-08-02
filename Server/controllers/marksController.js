import db from '../db.js';

export const getAllMarks = async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM marks");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const addMark = async (req, res) => {
    const { studentId, testId, score } = req.body;
    console.log("Adding mark:", { studentId, testId, score });
    try {
        const result = await db.query(
            "INSERT INTO marks (student_id, test_id, marks_obtained) VALUES ($1, $2, $3) RETURNING *",
            [studentId, testId, score]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Error adding mark:", err);
        res.status(500).json({ error: err.message });
    }
};
export const getMarksByStudent = async (req, res) => {
    const studentId = req.params.studentId;
    try {
        const result = await db.query("SELECT * FROM marks WHERE student_id = $1", [studentId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "No marks found for this student" });
        }
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
export const getMarksByTest = async (req, res) => {
    const testId = req.params.testId;
    try {
        const result = await db.query("SELECT * FROM marks WHERE test_id = $1", [testId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "No marks found for this test" });
        }
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateMark = async (req, res) => {
    const { studentId, testId, score } = req.body;
    console.log("Updating mark:", { studentId, testId, score });
    try {
        const result = await db.query(
            "UPDATE marks SET marks_obtained = $1 WHERE student_id = $2 AND test_id = $3 RETURNING *",
            [score, studentId, testId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Mark not found for this student and test" });
        }
        res.json(result.rows[0]);
    }
    catch (err) {
        console.error("Error updating mark:", err);
        res.status(500).json({ error: err.message });
    }
};
