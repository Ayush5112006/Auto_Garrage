import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const DEFAULT_ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL || "admin@garage.com";
const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || "admin123";
const LOCAL_ADMIN_ID = "local-admin";
const isAdminEmail = (email?: string | null) =>
  String(email || "").trim().toLowerCase() === DEFAULT_ADMIN_EMAIL.trim().toLowerCase();

// Register
router.post("/register", async (req, res) => {
  try {
    if (!prisma) {
      return res.status(503).json({ error: "Database not configured" });
    }

    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        password: hashedPassword,
      },
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: "user",
      },
    });
  } catch (error: any) {
    console.error("Register error:", error);
    res.status(500).json({ error: error.message || "Registration failed" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    if (!prisma) {
      if (email !== DEFAULT_ADMIN_EMAIL || password !== DEFAULT_ADMIN_PASSWORD) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const token = jwt.sign({ userId: LOCAL_ADMIN_ID }, JWT_SECRET, { expiresIn: "7d" });

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.json({
        user: {
          id: LOCAL_ADMIN_ID,
          email: DEFAULT_ADMIN_EMAIL,
          name: "Admin",
          role: "admin",
        },
      });
    }

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const shouldCreateDefaultAdmin =
        email === DEFAULT_ADMIN_EMAIL && password === DEFAULT_ADMIN_PASSWORD;

      if (!shouldCreateDefaultAdmin) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
      user = await prisma.user.create({
        data: {
          email: DEFAULT_ADMIN_EMAIL,
          name: "Admin",
          password: hashedPassword,
        },
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: isAdminEmail(user.email) ? "admin" : "user",
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ error: error.message || "Login failed" });
  }
});

// Get current user
router.get("/me", async (req: AuthRequest, res) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.json({ user: null });
    }

    let userId: string | undefined;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      userId = decoded.userId;
    } catch {
      return res.json({ user: null });
    }

    if (!prisma) {
      if (userId === LOCAL_ADMIN_ID) {
        return res.json({
          user: {
            id: LOCAL_ADMIN_ID,
            email: DEFAULT_ADMIN_EMAIL,
            name: "Admin",
            role: "admin",
          },
        });
      }

      return res.json({ user: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      return res.json({ user: null });
    }

    res.json({
      user: {
        ...user,
        role: isAdminEmail(user.email) ? "admin" : "user",
      },
    });
  } catch (error: any) {
    console.error("Get user error:", error);
    res.status(500).json({ error: error.message || "Failed to get user" });
  }
});

// Logout
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
});

export default router;
