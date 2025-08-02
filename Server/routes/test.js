import express from "express";
import {
  getAllTests,
  createTest,
  getTestsByUser,
  getSpecificTest
} from "../controllers/testController.js";

const router = express.Router();

router.get("/", getAllTests);
router.post("/", createTest);
router.get("/user/:userId", getTestsByUser);
router.get("/check", getSpecificTest); // Assuming this is for checking tests by subject, chapter, and date

export default router;
