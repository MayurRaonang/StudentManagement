import db from "../db.js";

export const getAllStudents = async (req, res) => {
  console.log("Fetching all students");
  try {
    const result = await db.query("SELECT * FROM students where user_id = $1", [1]);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).json({ error: err.message });
  }
};

export const createStudent = async (req, res) => {
  const { name, email, user_id } = req.body;
  try {
    const result = await db.query(
      "INSERT INTO students (name, email, user_id) VALUES ($1, $2, $3) RETURNING *",
      [name, email, user_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteStudent = async (req, res) => {
  const id = req.params.id;
  try {
    await db.query("DELETE FROM students WHERE id = $1", [id]);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getStudentsByUser = async (req, res) => {
  const userId = req.params.userId;
  try {
    const result = await db.query("SELECT * FROM students WHERE user_id = $1", [userId]);
    res.json(result.rows);
  }
  catch (err) {
    res.status(500).json({ error: err.message });
  }
};
