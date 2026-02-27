import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import garagesRoutes from "./routes/garages";
import bookingsRoutes from "./routes/bookings";
import staffRoutes from "./routes/staff";
import path from "path";
import { getPrismaHealth } from "./lib/prisma";
import { isSupabaseConfigured } from "./lib/supabase";

// Load .env.local first, then .env
dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve uploaded files
app.use("/uploads", express.static(path.join(process.cwd(), "public", "uploads")));

// Guard backend routes if Supabase env is not configured
app.use("/api", (req, res, next) => {
  if (req.path === "/health") {
    return next();
  }

  if (!isSupabaseConfigured) {
    return res.status(503).json({
      error: "Server Supabase config missing. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY).",
    });
  }

  return next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/garages", garagesRoutes);
app.use("/api/bookings", bookingsRoutes);
app.use("/api/staff", staffRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "API server is running",
    supabase: isSupabaseConfigured ? "configured" : "missing-env",
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
