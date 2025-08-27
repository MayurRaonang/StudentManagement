import express from "express";
import {
  getAllTests,
  createTest,
  getTestsByUser,
  getSpecificTest
} from "../controllers/testController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware,getAllTests);
router.post("/",authMiddleware, createTest);
router.get("/user/:userId", getTestsByUser);
router.get("/check", getSpecificTest); // Assuming this is for checking tests by subject, chapter, and date

export default router;
