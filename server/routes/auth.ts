import { Router, type Response } from "express";
import jwt from "jsonwebtoken";
import { adminAuth, adminDb } from "../lib/firebase-admin";
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

const profilesCol = () => adminDb.collection("profiles");

// Login – accepts either { idToken } (verified on server) or { email } (lookup by email)
router.post("/login", async (req, res) => {
  try {
    const { email, password, rememberMe, idToken } = req.body;

    if (!email && !idToken) {
      return res.status(400).json({ error: "Email/password or idToken required" });
    }

    let uid: string;
    let userEmail: string;

    if (idToken) {
      const decoded = await adminAuth.verifyIdToken(idToken);
      uid = decoded.uid;
      userEmail = decoded.email || email || "";
    } else {
      try {
        const userRecord = await adminAuth.getUserByEmail(email);
        uid = userRecord.uid;
        userEmail = userRecord.email || email;
      } catch {
        return res.status(401).json({ error: "Invalid credentials" });
      }
    }

    const profileSnap = await profilesCol().doc(uid).get();
    const profileData = profileSnap.exists ? profileSnap.data() : null;

    const role = normalizeRole(profileData?.role, isAdminEmail(userEmail) ? "admin" : "customer");
    const name = profileData?.name || profileData?.full_name || "User";

    const token = jwt.sign(
      { userId: uid, email: userEmail, name, role },
      JWT_SECRET,
      { expiresIn: rememberMe ? "30d" : "1d" }
    );

    res.cookie("token", token, buildAuthCookieOptions(Boolean(rememberMe)));

    res.json({ user: { id: uid, email: userEmail, name, role } });
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
    const normalizedName = String(name || "").trim() || "User";
    const role = isAdminEmail(normalizedEmail) ? "admin" : "customer";

    let userRecord;
    try {
      userRecord = await adminAuth.createUser({
        email: normalizedEmail,
        password,
        displayName: normalizedName,
      });
    } catch (err: any) {
      const code = err?.code || "";
      if (code === "auth/email-already-exists") {
        return res.status(400).json({ error: "User already registered" });
      }
      return res.status(400).json({ error: err?.message || "Registration failed" });
    }

    await profilesCol().doc(userRecord.uid).set({
      email: normalizedEmail,
      name: normalizedName,
      full_name: normalizedName,
      role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const token = jwt.sign(
      { userId: userRecord.uid, email: normalizedEmail, name: normalizedName, role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, buildAuthCookieOptions(true));

    res.json({
      user: { id: userRecord.uid, email: normalizedEmail, name: normalizedName, role },
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

    const profileSnap = await profilesCol().doc(req.userId).get();
    if (!profileSnap.exists) return res.json({ user: null });

    const profile = profileSnap.data()!;
    res.json({
      user: {
        id: profileSnap.id,
        email: profile.email,
        name: profile.name || profile.full_name,
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
    await profilesCol().doc(req.userId!).update({ name, updatedAt: new Date().toISOString() });
    const snap = await profilesCol().doc(req.userId!).get();
    res.json({ id: snap.id, ...snap.data() });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Admin: Get all users
router.get("/users", authenticate, async (req: AuthRequest, res) => {
  if (req.userRole !== "admin") return res.status(403).json({ error: "Unauthorized" });

  try {
    const snap = await profilesCol().orderBy("createdAt", "desc").get();
    const users = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json(users);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Admin: Update user role
router.patch("/users/:id/role", authenticate, async (req: AuthRequest, res) => {
  if (req.userRole !== "admin") return res.status(403).json({ error: "Unauthorized" });

  const { id } = req.params;
  const { role } = req.body;

  try {
    await profilesCol().doc(id).update({ role, updatedAt: new Date().toISOString() });
    const snap = await profilesCol().doc(id).get();
    res.json({ id: snap.id, ...snap.data() });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
