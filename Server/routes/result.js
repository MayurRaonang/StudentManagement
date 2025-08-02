import express from "express";
import {
  getAllResults,
  getResultByStudent,
} from "../controllers/resultController.js";

const router = express.Router();

router.get("/", getAllResults);
router.get("/:studentId", getResultByStudent);

export default router;
