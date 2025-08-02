import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from "./routes/user.js";
import studentRoutes from "./routes/student.js";
import testRoutes from "./routes/test.js";
import marksRoutes from "./routes/marks.js";
import resultsRoutes from "./routes/result.js";
import reportRoutes from "./routes/report.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes

app.use("/api/users", userRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/marks", marksRoutes);
app.use("/api/result", resultsRoutes);
app.use("/api/report", reportRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.send("API is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
