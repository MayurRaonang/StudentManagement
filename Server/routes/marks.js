import express from "express";
import {
  getAllMarks,
  addMark,
  getMarksByStudent,
  getMarksByTest,
  updateMark
} from "../controllers/marksController.js";

const router = express.Router();

router.get("/", getAllMarks);
router.post("/", addMark);
router.put("/", updateMark); 
router.get("/student/:studentId", getMarksByStudent);
router.get("/test/:testId", getMarksByTest);

export default router;