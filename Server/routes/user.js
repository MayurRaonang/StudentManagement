import express from "express";
import {
  getAllUsers,
  createUser,
  getUserById,
} from "../controllers/userController.js";

const router = express.Router();

router.get("/", getAllUsers);
router.post("/", createUser);
router.get("/:id", getUserById);

export default router;