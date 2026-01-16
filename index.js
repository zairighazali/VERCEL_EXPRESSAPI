import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import admin from "firebase-admin";
import userRoutes from "./routes/users.js";
import jobRoutes from "./routes/jobs.js";
import conversationsRouter from "./routes/conversations.js";
import publicRoutes from "./routes/public.js";
import testRoutes from "./routes/test.js";
import stripeRoutes from "./routes/stripe.js";
import hiresRouter from "./routes/hires.js";

dotenv.config();

// ===== FIREBASE ADMIN =====
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

// ===== EXPRESS APP =====
const app = express();

// CORS configuration
app.use(cors({ 
  origin: process.env.FRONTEND_URL || "*",
  credentials: true 
}));

app.use(express.json());

// ===== ROUTES =====
app.use("/api/users", userRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/conversations", conversationsRouter);
app.use("/api/public", publicRoutes);
app.use("/api/test", testRoutes);
app.use("/api/stripe", stripeRoutes);
app.use("/api/hires", hiresRouter);

// Health check endpoints
app.get("/", (req, res) => {
  res.json({ message: "API is running", status: "ok" });
});

app.get("/api", (req, res) => {
  res.json({ message: "Yes connected" });
});

// ===== VERCEL SERVERLESS EXPORT =====
export default app;

// ===== LOCAL DEVELOPMENT SERVER =====
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  });
}