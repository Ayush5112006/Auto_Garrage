import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

// Get all garages
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("garages")
      .select(`
        *,
        owner:profiles!owner_id (id, name, email)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch garages" });
  }
});

// Get my garage (for managers)
router.get("/my-garage", authenticate, async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("garages")
      .select(`
        *,
        staff:staff (
          id,
          user:profiles!user_id (id, name, email, role)
        ),
        bookings:bookings (
          *,
          customer:profiles!customer_id (id, name, email)
        )
      `)
      .eq("owner_id", req.userId)
      .maybeSingle();

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch your garage" });
  }
});

// Get single garage
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from("garages")
      .select(`
        *,
        owner:profiles!owner_id (id, name, email)
      `)
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Garage not found" });
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch garage" });
  }
});

// Create garage
router.post("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const { garage_name, location, contact_phone, open_time, description } = req.body;

    const { data, error } = await supabaseAdmin
      .from("garages")
      .insert({
        garage_name,
        location,
        contact_phone,
        open_time,
        description,
        owner_id: req.userId
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to create garage" });
  }
});

// Update garage
router.put("/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { garage_name, location, contact_phone, open_time, description } = req.body;

    // Check ownership or admin
    const { data: garage } = await supabaseAdmin
      .from("garages")
      .select("owner_id")
      .eq("id", id)
      .maybeSingle();

    if (!garage) return res.status(404).json({ error: "Garage not found" });
    if (garage.owner_id !== req.userId && req.userRole !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const { data: updated, error } = await supabaseAdmin
      .from("garages")
      .update({
        garage_name,
        location,
        contact_phone,
        open_time,
        description
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update garage" });
  }
});

// Delete garage
router.delete("/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Check ownership or admin
    const { data: garage } = await supabaseAdmin
      .from("garages")
      .select("owner_id")
      .eq("id", id)
      .maybeSingle();

    if (!garage) return res.status(404).json({ error: "Garage not found" });
    if (garage.owner_id !== req.userId && req.userRole !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const { error } = await supabaseAdmin
      .from("garages")
      .delete()
      .eq("id", id);

    if (error) throw error;
    res.json({ message: "Garage deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete garage" });
  }
});

export default router;
