import { Router } from "express";
import multer from "multer";
import path from "path";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";
import fs from "fs";
import { randomUUID } from "crypto";

const router = Router();

type LocalGarage = {
  id: string;
  ownerId: string;
  name: string;
  logoUrl: string | null;
  openTime: string | null;
  contactPhone: string | null;
  addressCountry: string | null;
  addressState: string | null;
  addressStreet: string | null;
  services: string[];
  mechanicsCount: number | null;
  serviceImageUrl: string | null;
  mapUrl: string | null;
  carRepairTypes: string[];
  sinceYear: number | null;
  sellsSecondHand: boolean;
  problemsSolvedCount: number | null;
  paymentMethods: string[];
  description: string | null;
  createdAt: string;
};

const localGaragesStore = new Map<string, LocalGarage>();

const parseArrayField = (value: unknown) => {
  if (Array.isArray(value)) return value.map((item) => String(item));
  if (typeof value !== "string" || value.trim() === "") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
  } catch {
    return [];
  }
};

// Setup file upload
const uploadDir = path.join(process.cwd(), "public", "uploads", "garages");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mime = allowedTypes.test(file.mimetype);
    if (ext && mime) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Get all garages
router.get("/", async (req, res) => {
  try {
    if (!prisma) {
      const localRows = Array.from(localGaragesStore.values()).sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      return res.json(localRows);
    }

    const garages = await prisma.garage.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.json(garages);
  } catch (error: any) {
    console.error("Get garages error:", error);
    res.status(500).json({ error: error.message || "Failed to fetch garages" });
  }
});

// Get single garage
router.get("/:id", async (req, res) => {
  try {
    const garageId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!garageId) {
      return res.status(400).json({ error: "Garage id is required" });
    }

    if (!prisma) {
      const localGarage = localGaragesStore.get(garageId);
      if (!localGarage) {
        return res.status(404).json({ error: "Garage not found" });
      }

      return res.json(localGarage);
    }

    const garage = await prisma.garage.findUnique({
      where: { id: garageId },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!garage) {
      return res.status(404).json({ error: "Garage not found" });
    }

    res.json(garage);
  } catch (error: any) {
    console.error("Get garage error:", error);
    res.status(500).json({ error: error.message || "Failed to fetch garage" });
  }
});

// Create garage
router.post("/", authenticate, upload.single("logo"), async (req: AuthRequest, res) => {
  try {
    const {
      name,
      openTime,
      contactPhone,
      addressCountry,
      addressState,
      addressStreet,
      services,
      mechanicsCount,
      serviceImageUrl,
      mapUrl,
      carRepairTypes,
      sinceYear,
      sellsSecondHand,
      problemsSolvedCount,
      paymentMethods,
      description,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Garage name is required" });
    }

    let logoUrl = null;
    if (req.file) {
      logoUrl = `/uploads/garages/${req.file.filename}`;
    }

    if (!prisma) {
      const localGarage: LocalGarage = {
        id: randomUUID(),
        ownerId: String(req.userId || ""),
        name: String(name),
        logoUrl,
        openTime: openTime || null,
        contactPhone: contactPhone || null,
        addressCountry: addressCountry || null,
        addressState: addressState || null,
        addressStreet: addressStreet || null,
        services: parseArrayField(services),
        mechanicsCount: mechanicsCount ? parseInt(mechanicsCount, 10) : null,
        serviceImageUrl: serviceImageUrl || null,
        mapUrl: mapUrl || null,
        carRepairTypes: parseArrayField(carRepairTypes),
        sinceYear: sinceYear ? parseInt(sinceYear, 10) : null,
        sellsSecondHand: sellsSecondHand === "true",
        problemsSolvedCount: problemsSolvedCount ? parseInt(problemsSolvedCount, 10) : null,
        paymentMethods: parseArrayField(paymentMethods),
        description: description || null,
        createdAt: new Date().toISOString(),
      };

      localGaragesStore.set(localGarage.id, localGarage);
      return res.status(201).json(localGarage);
    }

    const garage = await prisma.garage.create({
      data: {
        ownerId: req.userId!,
        name,
        logoUrl,
        openTime: openTime || null,
        contactPhone: contactPhone || null,
        addressCountry: addressCountry || null,
        addressState: addressState || null,
        addressStreet: addressStreet || null,
        services: services ? JSON.parse(services) : [],
        mechanicsCount: mechanicsCount ? parseInt(mechanicsCount) : null,
        serviceImageUrl: serviceImageUrl || null,
        mapUrl: mapUrl || null,
        carRepairTypes: carRepairTypes ? JSON.parse(carRepairTypes) : [],
        sinceYear: sinceYear ? parseInt(sinceYear) : null,
        sellsSecondHand: sellsSecondHand === "true",
        problemsSolvedCount: problemsSolvedCount ? parseInt(problemsSolvedCount) : null,
        paymentMethods: paymentMethods ? JSON.parse(paymentMethods) : [],
        description: description || null,
      },
    });

    res.status(201).json(garage);
  } catch (error: any) {
    console.error("Create garage error:", error);
    res.status(500).json({ error: error.message || "Failed to create garage" });
  }
});

// Update garage
router.put("/:id", authenticate, upload.single("logo"), async (req: AuthRequest, res) => {
  try {
    const garageId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!garageId) {
      return res.status(400).json({ error: "Garage id is required" });
    }

    if (!prisma) {
      const existingGarage = localGaragesStore.get(garageId);
      if (!existingGarage) {
        return res.status(404).json({ error: "Garage not found" });
      }

      if (existingGarage.ownerId !== req.userId) {
        return res.status(403).json({ error: "You can only edit your own garages" });
      }

      const {
        name,
        openTime,
        contactPhone,
        addressCountry,
        addressState,
        addressStreet,
        services,
        mechanicsCount,
        serviceImageUrl,
        mapUrl,
        carRepairTypes,
        sinceYear,
        sellsSecondHand,
        problemsSolvedCount,
        paymentMethods,
        description,
      } = req.body;

      let logoUrl = existingGarage.logoUrl;
      if (req.file) {
        logoUrl = `/uploads/garages/${req.file.filename}`;
      }

      const updatedGarage: LocalGarage = {
        ...existingGarage,
        name: name || existingGarage.name,
        logoUrl,
        openTime: openTime ?? existingGarage.openTime,
        contactPhone: contactPhone ?? existingGarage.contactPhone,
        addressCountry: addressCountry ?? existingGarage.addressCountry,
        addressState: addressState ?? existingGarage.addressState,
        addressStreet: addressStreet ?? existingGarage.addressStreet,
        services: services ? parseArrayField(services) : existingGarage.services,
        mechanicsCount: mechanicsCount ? parseInt(mechanicsCount, 10) : existingGarage.mechanicsCount,
        serviceImageUrl: serviceImageUrl ?? existingGarage.serviceImageUrl,
        mapUrl: mapUrl ?? existingGarage.mapUrl,
        carRepairTypes: carRepairTypes ? parseArrayField(carRepairTypes) : existingGarage.carRepairTypes,
        sinceYear: sinceYear ? parseInt(sinceYear, 10) : existingGarage.sinceYear,
        sellsSecondHand:
          sellsSecondHand !== undefined ? sellsSecondHand === "true" : existingGarage.sellsSecondHand,
        problemsSolvedCount: problemsSolvedCount
          ? parseInt(problemsSolvedCount, 10)
          : existingGarage.problemsSolvedCount,
        paymentMethods: paymentMethods ? parseArrayField(paymentMethods) : existingGarage.paymentMethods,
        description: description ?? existingGarage.description,
      };

      localGaragesStore.set(garageId, updatedGarage);
      return res.json(updatedGarage);
    }

    const existingGarage = await prisma.garage.findUnique({
      where: { id: garageId },
    });

    if (!existingGarage) {
      return res.status(404).json({ error: "Garage not found" });
    }

    if (existingGarage.ownerId !== req.userId) {
      return res.status(403).json({ error: "You can only edit your own garages" });
    }

    const {
      name,
      openTime,
      contactPhone,
      addressCountry,
      addressState,
      addressStreet,
      services,
      mechanicsCount,
      serviceImageUrl,
      mapUrl,
      carRepairTypes,
      sinceYear,
      sellsSecondHand,
      problemsSolvedCount,
      paymentMethods,
      description,
    } = req.body;

    let logoUrl = existingGarage.logoUrl;
    if (req.file) {
      logoUrl = `/uploads/garages/${req.file.filename}`;
    }

    const garage = await prisma.garage.update({
      where: { id: garageId },
      data: {
        name: name || existingGarage.name,
        logoUrl,
        openTime: openTime ?? existingGarage.openTime,
        contactPhone: contactPhone ?? existingGarage.contactPhone,
        addressCountry: addressCountry ?? existingGarage.addressCountry,
        addressState: addressState ?? existingGarage.addressState,
        addressStreet: addressStreet ?? existingGarage.addressStreet,
        services: services ? JSON.parse(services) : existingGarage.services,
        mechanicsCount: mechanicsCount ? parseInt(mechanicsCount) : existingGarage.mechanicsCount,
        serviceImageUrl: serviceImageUrl ?? existingGarage.serviceImageUrl,
        mapUrl: mapUrl ?? existingGarage.mapUrl,
        carRepairTypes: carRepairTypes ? JSON.parse(carRepairTypes) : existingGarage.carRepairTypes,
        sinceYear: sinceYear ? parseInt(sinceYear) : existingGarage.sinceYear,
        sellsSecondHand: sellsSecondHand !== undefined ? sellsSecondHand === "true" : existingGarage.sellsSecondHand,
        problemsSolvedCount: problemsSolvedCount
          ? parseInt(problemsSolvedCount)
          : existingGarage.problemsSolvedCount,
        paymentMethods: paymentMethods ? JSON.parse(paymentMethods) : existingGarage.paymentMethods,
        description: description ?? existingGarage.description,
      },
    });

    res.json(garage);
  } catch (error: any) {
    console.error("Update garage error:", error);
    res.status(500).json({ error: error.message || "Failed to update garage" });
  }
});

// Delete garage
router.delete("/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    const garageId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!garageId) {
      return res.status(400).json({ error: "Garage id is required" });
    }

    if (!prisma) {
      const garage = localGaragesStore.get(garageId);
      if (!garage) {
        return res.status(404).json({ error: "Garage not found" });
      }

      if (garage.ownerId !== req.userId) {
        return res.status(403).json({ error: "You can only delete your own garages" });
      }

      localGaragesStore.delete(garageId);
      return res.json({ message: "Garage deleted successfully" });
    }

    const garage = await prisma.garage.findUnique({
      where: { id: garageId },
    });

    if (!garage) {
      return res.status(404).json({ error: "Garage not found" });
    }

    if (garage.ownerId !== req.userId) {
      return res.status(403).json({ error: "You can only delete your own garages" });
    }

    await prisma.garage.delete({
      where: { id: garageId },
    });

    res.json({ message: "Garage deleted successfully" });
  } catch (error: any) {
    console.error("Delete garage error:", error);
    res.status(500).json({ error: error.message || "Failed to delete garage" });
  }
});

export default router;
