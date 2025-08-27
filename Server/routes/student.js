import express from "express";
import {
  getAllStudents,
  createStudent,
  getStudentsByUser,
} from "../controllers/studentController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware,getAllStudents);
router.post("/", authMiddleware, createStudent);
router.get("/user/:userId", getStudentsByUser);

export default router;