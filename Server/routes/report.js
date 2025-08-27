import express from "express";
import {
    getCustomReport,
    getWeeklyReport,
    getMonthlyReport,
    getAllResults,
    sendEmailReport
} from "../controllers/reportController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getAllResults);
router.post("/custom", authMiddleware, getCustomReport);
router.post("/weekly", getWeeklyReport);
router.post("/monthly", getMonthlyReport);
router.post("/send-emails", sendEmailReport);

export default router;
