import { Router, type Response } from "express";
import jwt from "jsonwebtoken";
import { supabaseAdmin } from "../lib/supabase";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const DEFAULT_ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL || "admin@garage.com";

const isAdminEmail = (email?: string | null) =>
  String(email || "").trim().toLowerCase() === DEFAULT_ADMIN_EMAIL.trim().toLowerCase();

const normalizeRole = (value?: string | null, fallback: string = "customer") => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "admin") return "admin";
  if (normalized === "manager") return "manager";
  if (normalized === "staff" || normalized === "mechanic") return "staff";
  if (normalized === "customer" || normalized === "user") return "customer";
  return fallback;
};

const buildAuthCookieOptions = (rememberMe: boolean) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return res.status(401).json({ error: authError?.message || "Invalid credentials" });
    }

    // Get profile
    const { data: profileData } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .maybeSingle();

    const role = normalizeRole(profileData?.role, isAdminEmail(email) ? "admin" : "customer");
    const name = profileData?.name || authData.user.user_metadata?.name || "User";

    const token = jwt.sign(
      {
        userId: authData.user.id,
        email: authData.user.email,
        name,
        role,
      },
      JWT_SECRET,
      { expiresIn: rememberMe ? "30d" : "1d" }
    );

    res.cookie("token", token, buildAuthCookieOptions(Boolean(rememberMe)));

    res.json({
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name,
        role,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedName = String(name || "").trim();
    const role = isAdminEmail(normalizedEmail) ? "admin" : "customer";

    const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          name: normalizedName,
          role: role,
        },
      },
    });

    if (signUpError || !signUpData.user) {
      return res.status(400).json({ error: signUpError?.message || "Registration failed" });
    }

    // Profile is created via trigger 'on_auth_user_created' in SQL
    // But we'll do an upsert just in case the trigger isn't set up yet
    const profileName = normalizedName || "User";
    await supabaseAdmin.from("profiles").upsert({
      id: signUpData.user.id,
      email: normalizedEmail,
      name: profileName,
      role: role,
    });

    const token = jwt.sign(
      {
        userId: signUpData.user.id,
        email: normalizedEmail,
        name: profileName,
        role,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, buildAuthCookieOptions(true));

    res.json({
      user: {
        id: signUpData.user.id,
        email: normalizedEmail,
        name: profileName,
        role,
      },
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get current user
router.get("/me", authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) return res.json({ user: null });

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", req.userId)
      .maybeSingle();

    if (!profile) {
      return res.json({ user: null });
    }

    res.json({
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
      },
    });
  } catch (error) {
    res.json({ user: null });
  }
});

// Logout
router.post("/logout", (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Failed to logout" });
  }
});

// Update profile
router.patch("/update-profile", authenticate, async (req: AuthRequest, res) => {
  try {
    const { name } = req.body;

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update({ name })
      .eq("id", req.userId)
      .select()
      .maybeSingle();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Admin: Get all users
router.get("/users", authenticate, async (req: AuthRequest, res) => {
  if (req.userRole !== "admin") return res.status(403).json({ error: "Unauthorized" });

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Admin: Update user role
router.patch("/users/:id/role", authenticate, async (req: AuthRequest, res) => {
  if (req.userRole !== "admin") return res.status(403).json({ error: "Unauthorized" });

  const { id } = req.params;
  const { role } = req.body;

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .update({ role })
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

export default router;
