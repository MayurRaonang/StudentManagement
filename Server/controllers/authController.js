import jwt from 'jsonwebtoken';
import { compare } from 'bcryptjs';
import db from '../db.js';

// Helper to generate JWT
const generateToken = (user) => {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
};

export const loginUser = async (req, res) => {
  const { username, password } = req.body;
  console.log("Login attempt with username:", username);
  try {
    const result = await db.query(
      "SELECT id, name, email, password FROM users WHERE name = $1",
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = result.rows[0];
    console.log("User found:", user);
    // Compare password
    const isMatch = password == user.password; // Assuming password is stored in plain text, which is not recommended
    console.log("Password match:", isMatch);
    console.log("User ID:", user.id);
    console.log("User username:", user.name);
    // If password doesn't match
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);

    return res.json({ token, role: user.role });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
};