import { Router } from "express";
import { adminDb } from "../lib/firebase-admin";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

const profilesCol = () => adminDb.collection("profiles");
const garagesCol = () => adminDb.collection("garages");
const staffCol = () => adminDb.collection("staff");
const tasksCol = () => adminDb.collection("tasks");
const timeLogsCol = () => adminDb.collection("time_logs");
const inventoryCol = () => adminDb.collection("inventory");

const isManagerOrAdmin = (role?: string) => {
    const normalized = String(role || "").toLowerCase();
    return normalized === "manager" || normalized === "admin";
};

const isAdmin = (role?: string) => String(role || "").toLowerCase() === "admin";

const getStaffRecordByUserId = async (userId?: string) => {
    if (!userId) return null;
    const snap = await staffCol().where("userId", "==", userId).limit(1).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, garageId: doc.data().garageId, ...doc.data() };
};

// Add staff to garage
router.post("/garage-staff", authenticate, async (req: AuthRequest, res) => {
    try {
        const { userId, garageId } = req.body;

        const garageSnap = await garagesCol().doc(garageId).get();
        if (!garageSnap.exists) return res.status(404).json({ error: "Garage not found" });
        const garageData = garageSnap.data()!;
        if (garageData.ownerId !== req.userId && req.userRole !== "admin") {
            return res.status(403).json({ error: "Unauthorized" });
        }

        const docRef = await staffCol().add({
            userId,
            garageId,
            createdAt: new Date().toISOString(),
        });

        // Update user role to staff if customer
        const profileSnap = await profilesCol().doc(userId).get();
        if (profileSnap.exists && profileSnap.data()?.role === "customer") {
            await profilesCol().doc(userId).update({ role: "staff" });
        }

        res.status(201).json({ id: docRef.id, userId, garageId });
    } catch (error: any) {
        res.status(500).json({ error: "Failed to add staff" });
    }
});

// Remove staff from garage
router.delete("/garage-staff/:userId", authenticate, async (req: AuthRequest, res) => {
    try {
        const { userId } = req.params;
        const garageId = String(req.query.garageId || "");

        if (!userId || !garageId) {
            return res.status(400).json({ error: "userId and garageId are required" });
        }

        const garageSnap = await garagesCol().doc(garageId).get();
        if (!garageSnap.exists) return res.status(404).json({ error: "Garage not found" });
        const garageData = garageSnap.data()!;
        if (garageData.ownerId !== req.userId && !isAdmin(req.userRole)) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        // Delete staff doc
        const staffSnap = await staffCol()
            .where("userId", "==", userId)
            .where("garageId", "==", garageId)
            .get();

        const batch = adminDb.batch();
        staffSnap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();

        // Check remaining staff records
        const remaining = await staffCol().where("userId", "==", userId).get();

        if (remaining.empty) {
            const profileSnap = await profilesCol().doc(userId).get();
            if (profileSnap.exists && profileSnap.data()?.role === "staff") {
                await profilesCol().doc(userId).update({ role: "customer" });
            }
        }

        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: "Failed to remove staff" });
    }
});

// Get staff for a specific garage
router.get("/garage-staff/:garageId", authenticate, async (req: AuthRequest, res) => {
    try {
        const { garageId } = req.params;

        const snap = await staffCol().where("garageId", "==", garageId).get();
        const staffList = await Promise.all(
            snap.docs.map(async (d) => {
                const data = d.data();
                const profileSnap = await profilesCol().doc(data.userId).get();
                const user = profileSnap.exists
                    ? { id: profileSnap.id, ...profileSnap.data() }
                    : null;
                return { id: d.id, ...data, user };
            })
        );

        res.json(staffList);
    } catch (error: any) {
        res.status(500).json({ error: "Failed to fetch staff" });
    }
});

// Get staff profile
router.get("/profile/:userId", authenticate, async (req: AuthRequest, res) => {
    try {
        const { userId } = req.params;

        if (req.userId !== userId && !isManagerOrAdmin(req.userRole)) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        const profileSnap = await profilesCol().doc(userId).get();
        if (!profileSnap.exists) return res.json({ id: userId });

        const data = profileSnap.data()!;
        res.json({
            id: profileSnap.id,
            name: data.name,
            full_name: data.full_name,
            phone: data.phone,
            role: data.role,
        });
    } catch (error: any) {
        res.status(500).json({ error: "Failed to fetch profile" });
    }
});

// Get time logs
router.get("/time-logs", authenticate, async (req: AuthRequest, res) => {
    try {
        const staffRecord = await getStaffRecordByUserId(req.userId);

        let q: FirebaseFirestore.Query = timeLogsCol().orderBy("workDate", "desc");

        if (staffRecord && String(req.userRole || "").toLowerCase() === "staff") {
            q = q.where("staffId", "==", staffRecord.id);
        }

        const snap = await q.get();
        const logs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        res.json(logs);
    } catch (error: any) {
        res.status(500).json({ error: "Failed to fetch time logs" });
    }
});

// Get inventory
router.get("/inventory", authenticate, async (req: AuthRequest, res) => {
    try {
        const role = String(req.userRole || "").toLowerCase();
        let q: FirebaseFirestore.Query = inventoryCol().orderBy("createdAt", "desc");

        if (role === "staff") {
            const staffRecord = await getStaffRecordByUserId(req.userId);
            if (!staffRecord) return res.json([]);
            q = q.where("garageId", "==", staffRecord.garageId);
        }

        const snap = await q.get();
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        res.json(items);
    } catch (error: any) {
        res.status(500).json({ error: "Failed to fetch inventory" });
    }
});

// Create work order / task
router.post("/work-orders", authenticate, async (req: AuthRequest, res) => {
    try {
        if (!isManagerOrAdmin(req.userRole)) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        const { booking_id, staff_id, description } = req.body;

        const payload = {
            bookingId: booking_id,
            staffId: staff_id,
            description,
            taskStatus: "pending",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const docRef = await tasksCol().add(payload);
        res.status(201).json({ id: docRef.id, ...payload });
    } catch (error: any) {
        res.status(500).json({ error: "Failed to create work order" });
    }
});

// Get all tasks
router.get("/work-orders", authenticate, async (req: AuthRequest, res) => {
    try {
        const includeAll = String(req.query.all || "") === "1";

        let q: FirebaseFirestore.Query = tasksCol().orderBy("createdAt", "desc");

        if (String(req.userRole || "").toLowerCase() === "staff" || !includeAll) {
            const staffRecord = await getStaffRecordByUserId(req.userId);
            if (staffRecord) {
                q = q.where("staffId", "==", staffRecord.id);
            } else {
                return res.json([]);
            }
        }

        const snap = await q.get();
        const tasks = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        res.json(tasks);
    } catch (error: any) {
        res.status(500).json({ error: "Failed to fetch work orders" });
    }
});

// Update task status
router.patch("/work-orders/:id", authenticate, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const { task_status } = req.body;

        const taskSnap = await tasksCol().doc(id).get();
        if (!taskSnap.exists) return res.status(404).json({ error: "Work order not found" });

        const taskData = taskSnap.data()!;
        const role = String(req.userRole || "").toLowerCase();
        let canUpdate = role === "admin" || role === "manager";

        if (!canUpdate && role === "staff") {
            const staffRecord = await getStaffRecordByUserId(req.userId);
            canUpdate = Boolean(staffRecord && staffRecord.id === taskData.staffId);
        }

        if (!canUpdate) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        await tasksCol().doc(id).update({
            taskStatus: task_status,
            updatedAt: new Date().toISOString(),
        });

        const updatedSnap = await tasksCol().doc(id).get();
        res.json({ id: updatedSnap.id, ...updatedSnap.data() });
    } catch (error: any) {
        res.status(500).json({ error: "Failed to update task" });
    }
});

export default router;
