import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { adminDb } from "../lib/firebase-admin";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

// Configure multer for garage logo uploads
const uploadsDir = path.join(process.cwd(), "public", "uploads", "garages");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype);
    cb(null, extOk && mimeOk);
  },
});

const garagesCol = () => adminDb.collection("garages");
const profilesCol = () => adminDb.collection("profiles");

// Get all garages
router.get("/", async (req, res) => {
  try {
    const snap = await garagesCol().orderBy("createdAt", "desc").get();
    const garages = await Promise.all(
      snap.docs.map(async (d) => {
        const data = d.data();
        let owner = null;
        if (data.ownerId) {
          const ownerSnap = await profilesCol().doc(data.ownerId).get();
          if (ownerSnap.exists) {
            const o = ownerSnap.data()!;
            owner = { id: ownerSnap.id, name: o.name, email: o.email };
          }
        }
        return { id: d.id, ...data, owner };
      })
    );
    res.json(garages);
  } catch (error: any) {
    console.error("GET /garages error:", error?.message || error);
    res.status(500).json({ error: error?.message || "Failed to fetch garages" });
  }
});

// Get my garage (for managers)
router.get("/my-garage", authenticate, async (req: AuthRequest, res) => {
  try {
    const snap = await garagesCol().where("ownerId", "==", req.userId).limit(1).get();
    if (snap.empty) return res.json(null);
    const doc = snap.docs[0];
    res.json({ id: doc.id, ...doc.data() });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch your garage" });
  }
});

// Get single garage
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await garagesCol().doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: "Garage not found" });

    const data = doc.data()!;
    let owner = null;
    if (data.ownerId) {
      const ownerSnap = await profilesCol().doc(data.ownerId).get();
      if (ownerSnap.exists) {
        const o = ownerSnap.data()!;
        owner = { id: ownerSnap.id, name: o.name, email: o.email };
      }
    }
    res.json({ id: doc.id, ...data, owner });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch garage" });
  }
});

// Create garage
router.post("/", authenticate, upload.single("logo"), async (req: AuthRequest, res) => {
  try {
    const { garage_name, location, contact_phone, open_time, description } = req.body;

    const payload: Record<string, unknown> = {
      name: garage_name,
      location,
      contactPhone: contact_phone,
      openTime: open_time,
      description,
      ownerId: req.userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // If a logo file was uploaded, store its URL
    if (req.file) {
      payload.logoUrl = `/uploads/garages/${req.file.filename}`;
    }

    const docRef = await garagesCol().add(payload);
    res.status(201).json({ id: docRef.id, ...payload });
  } catch (error: any) {
    console.error("POST /garages error:", error);
    res.status(500).json({ error: error?.message || error?.toString() || "Failed to create garage" });
  }
});

// Update garage
router.put("/:id", authenticate, upload.single("logo"), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { garage_name, location, contact_phone, open_time, description } = req.body;

    const garageSnap = await garagesCol().doc(id).get();
    if (!garageSnap.exists) return res.status(404).json({ error: "Garage not found" });

    const garageData = garageSnap.data()!;
    if (garageData.ownerId !== req.userId && req.userRole !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const updates: Record<string, unknown> = {
      name: garage_name,
      location,
      contactPhone: contact_phone,
      openTime: open_time,
      description,
      updatedAt: new Date().toISOString(),
    };

    // If a new logo was uploaded, update it
    if (req.file) {
      updates.logoUrl = `/uploads/garages/${req.file.filename}`;
    }

    await garagesCol().doc(id).update(updates);
    const updatedSnap = await garagesCol().doc(id).get();
    res.json({ id: updatedSnap.id, ...updatedSnap.data() });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update garage" });
  }
});

// Delete garage
router.delete("/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const garageSnap = await garagesCol().doc(id).get();
    if (!garageSnap.exists) return res.status(404).json({ error: "Garage not found" });

    const garageData = garageSnap.data()!;
    if (garageData.ownerId !== req.userId && req.userRole !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await garagesCol().doc(id).delete();
    res.json({ message: "Garage deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete garage" });
  }
});

export default router;
