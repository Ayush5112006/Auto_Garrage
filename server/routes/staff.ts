import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

const isManagerOrAdmin = (role?: string) => {
    const normalized = String(role || "").toLowerCase();
    return normalized === "manager" || normalized === "admin";
};

const isAdmin = (role?: string) => String(role || "").toLowerCase() === "admin";

const getStaffRecordByUserId = async (userId?: string) => {
    if (!userId) return null;
    const { data } = await supabaseAdmin
        .from("staff")
        .select("id, garage_id")
        .eq("user_id", userId)
        .maybeSingle();
    return data || null;
};

// Add staff to garage
router.post("/garage-staff", authenticate, async (req: AuthRequest, res) => {
    try {
        const { userId, garageId } = req.body;

        // Check if auth user is garage owner or admin
        const { data: garage } = await supabaseAdmin
            .from("garages")
            .select("owner_id")
            .eq("id", garageId)
            .maybeSingle();

        if (!garage) return res.status(404).json({ error: "Garage not found" });
        if (garage.owner_id !== req.userId && req.userRole !== "admin") {
            return res.status(403).json({ error: "Unauthorized" });
        }

        const { data, error } = await supabaseAdmin
            .from("staff")
            .insert({ user_id: userId, garage_id: garageId })
            .select()
            .single();

        if (error) throw error;

        // Also update the user's role to 'staff' if it was 'customer'
        const { data: userProfile } = await supabaseAdmin
            .from("profiles")
            .select("role")
            .eq("id", userId)
            .maybeSingle();

        if (userProfile?.role === "customer") {
            await supabaseAdmin
                .from("profiles")
                .update({ role: "staff" })
                .eq("id", userId);
        }

        res.status(201).json(data);
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

        const { data: garage } = await supabaseAdmin
            .from("garages")
            .select("owner_id")
            .eq("id", garageId)
            .maybeSingle();

        if (!garage) return res.status(404).json({ error: "Garage not found" });
        if (garage.owner_id !== req.userId && !isAdmin(req.userRole)) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        const { error } = await supabaseAdmin
            .from("staff")
            .delete()
            .eq("user_id", userId)
            .eq("garage_id", garageId);

        if (error) throw error;

        const { count: remainingStaffCount } = await supabaseAdmin
            .from("staff")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId);

        if ((remainingStaffCount || 0) === 0) {
            const { data: profile } = await supabaseAdmin
                .from("profiles")
                .select("role")
                .eq("id", userId)
                .maybeSingle();

            if (profile?.role === "staff") {
                await supabaseAdmin.from("profiles").update({ role: "customer" }).eq("id", userId);
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

        const { data, error } = await supabaseAdmin
            .from("staff")
            .select(`
        *,
        user:profiles!user_id (id, name, email, role)
      `)
            .eq("garage_id", garageId);

        if (error) throw error;
        res.json(data);
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

        const { data, error } = await supabaseAdmin
            .from("profiles")
            .select("id, name, full_name, phone, role")
            .eq("id", userId)
            .maybeSingle();

        if (error) throw error;
        res.json(data || { id: userId });
    } catch (error: any) {
        res.status(500).json({ error: "Failed to fetch profile" });
    }
});

// Get time logs for current staff user
router.get("/time-logs", authenticate, async (req: AuthRequest, res) => {
    try {
        const staffRecord = await getStaffRecordByUserId(req.userId);

        let query = supabaseAdmin
            .from("time_logs")
            .select("*")
            .order("work_date", { ascending: false });

        if (staffRecord && String(req.userRole || "").toLowerCase() === "staff") {
            query = query.eq("staff_id", staffRecord.id);
        }

        const { data, error } = await query;
        if (error) throw error;
        res.json(data || []);
    } catch (error: any) {
        res.status(500).json({ error: "Failed to fetch time logs" });
    }
});

// Get inventory for current staff/manager scope
router.get("/inventory", authenticate, async (req: AuthRequest, res) => {
    try {
        const role = String(req.userRole || "").toLowerCase();
        let query = supabaseAdmin
            .from("inventory")
            .select("*")
            .order("created_at", { ascending: false });

        if (role === "staff") {
            const staffRecord = await getStaffRecordByUserId(req.userId);
            if (!staffRecord) return res.json([]);
            query = query.eq("garage_id", staffRecord.garage_id);
        }

        const { data, error } = await query;
        if (error) throw error;
        res.json(data || []);
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

        const { data, error } = await supabaseAdmin
            .from("tasks")
            .insert({
                booking_id,
                staff_id,
                description,
                task_status: "pending"
            })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error: any) {
        res.status(500).json({ error: "Failed to create work order" });
    }
});

// Get all tasks (for staff dashboard)
router.get("/work-orders", authenticate, async (req: AuthRequest, res) => {
    try {
        const includeAll = String(req.query.all || "") === "1";

        // If user is staff, get their tasks
        // If admin, get all
        const query = supabaseAdmin
            .from("tasks")
            .select(`
        *,
        booking:bookings (
          *,
          customer:profiles!customer_id (id, name, email),
          service:services (id, service_name)
        )
      `)
            .order("created_at", { ascending: false });

        if (String(req.userRole || "").toLowerCase() === "staff" || !includeAll) {
            // Find staff_id for this user
            const { data: staffData } = await supabaseAdmin
                .from("staff")
                .select("id")
                .eq("user_id", req.userId)
                .maybeSingle();

            if (staffData) {
                query.eq("staff_id", staffData.id);
            } else {
                return res.json([]);
            }
        }

        const { data, error } = await query;
        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: "Failed to fetch work orders" });
    }
});

// Update task status
router.patch("/work-orders/:id", authenticate, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const { task_status } = req.body;

        const { data: existingTask } = await supabaseAdmin
            .from("tasks")
            .select("id, staff_id")
            .eq("id", id)
            .maybeSingle();

        if (!existingTask) {
            return res.status(404).json({ error: "Work order not found" });
        }

        const role = String(req.userRole || "").toLowerCase();
        let canUpdate = role === "admin" || role === "manager";

        if (!canUpdate && role === "staff") {
            const staffRecord = await getStaffRecordByUserId(req.userId);
            canUpdate = Boolean(staffRecord && staffRecord.id === existingTask.staff_id);
        }

        if (!canUpdate) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        const { data, error } = await supabaseAdmin
            .from("tasks")
            .update({ task_status })
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: "Failed to update task" });
    }
});

export default router;
