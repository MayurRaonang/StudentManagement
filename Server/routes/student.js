import express from "express";
import {
  getAllStudents,
  createStudent,
  getStudentsByUser,
} from "../controllers/studentController.js";

const router = express.Router();

router.get("/", getAllStudents);
router.post("/", createStudent);
router.get("/user/:userId", getStudentsByUser);

export default router;