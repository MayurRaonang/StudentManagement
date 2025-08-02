import db from '../db.js';

export const getAllResults = async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM results");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getCustomReport = async (req, res) => {
    const studentId = req.params.studentId;
    console.log("Fetching results for student ID:", studentId);
    if (!studentId) {
        return res.status(400).json({ error: "Student ID is required" });
    }
    try {
        const result = await db.query(
            `
            SELECT 
                tests.id AS test_id, 
                tests.subject, 
                tests.chapter, 
                tests.total_marks, 
                tests.test_date, 
                marks.marks_obtained
            FROM marks
            JOIN tests ON marks.test_id = tests.id
            WHERE marks.student_id = $1
            ORDER BY tests.test_date ASC;
            `,
            [studentId]
        );
        console.log("Query result:", result.rows);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "No results found for this student" });
        }
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getWeeklyReport = async (req, res) => {
    try {
        const result = await db.query(
            `
            SELECT 
                tests.id AS test_id, 
                tests.subject,
                tests.chapter,
                tests.total_marks,
                tests.test_date,
                marks.marks_obtained
            FROM marks
            JOIN tests ON marks.test_id = tests.id
            WHERE tests.test_date >= NOW() - INTERVAL '7 days'
            ORDER BY tests.test_date ASC;
            `
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "No results found for the past week" });
        }
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getMonthlyReport = async (req, res) => {
    try {
        const result = await db.query(
            `
            SELECT
                tests.id AS test_id,
                tests.subject,
                tests.chapter,
                tests.total_marks,
                tests.test_date,
                marks.marks_obtained
            FROM marks
            JOIN tests ON marks.test_id = tests.id
            WHERE tests.test_date >= NOW() - INTERVAL '1 month'
            ORDER BY tests.test_date ASC;
            `
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "No results found for the past month" });
        }
        res.json(result.rows);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
