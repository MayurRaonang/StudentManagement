import express from "express";
import {
    getCustomReport,
    getWeeklyReport,
    getMonthlyReport,
    getAllResults,
} from "../controllers/reportController.js";

const router = express.Router();

router.get("/", getAllResults);
router.post("/custom", getCustomReport);
router.post("/weekly", getWeeklyReport);
router.post("/monthly", getMonthlyReport);

export default router;
