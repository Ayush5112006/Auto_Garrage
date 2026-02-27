import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

const normalizeStatus = (value?: string) => {
    const normalized = String(value || "pending").trim().toLowerCase();
    if (normalized === "in-progress") return "in progress";
    return normalized;
};

const getBookingsSelectWithFallback = async (customerId?: string) => {
    let query = supabaseAdmin
        .from("bookings")
        .select(`
        *,
        garage:garages (id, garage_name, location),
        service:services (id, service_name, price)
      `)
        .order("created_at", { ascending: false });

    if (customerId) {
        query = query.eq("customer_id", customerId);
    }

    const joined = await query;
    if (!joined.error) {
        return joined;
    }

    let plainQuery = supabaseAdmin
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false });

    if (customerId) {
        plainQuery = plainQuery.eq("customer_id", customerId);
    }

    return plainQuery;
};

// Create booking
router.post("/", authenticate, async (req: AuthRequest, res) => {
    try {
        const {
            trackingId,
            name,
            email,
            phone,
            vehicle,
            services,
            date,
            time,
            deliveryOption,
            deliveryFee,
            homeAddress,
            subtotal,
            total,
            status,
            garage_id,
            service_id,
            service_date,
            total_price,
        } = req.body;

        const normalizedStatus = normalizeStatus(status || "pending");

        const bookingPayload = {
            tracking_id: trackingId || null,
            customer_id: req.userId,
            garage_id: garage_id || null,
            service_id: service_id || null,
            name: name || null,
            email: email || null,
            phone: phone || null,
            vehicle: vehicle || null,
            services: Array.isArray(services) ? services : null,
            time: time || null,
            delivery_option: deliveryOption || null,
            delivery_fee: deliveryFee ?? 0,
            home_address: homeAddress || null,
            subtotal: subtotal ?? total ?? total_price ?? 0,
            total_price: total_price ?? total ?? subtotal ?? 0,
            status: normalizedStatus,
            service_date: service_date || date || null,
            date: date || service_date || null,
        };

        const { data, error } = await supabaseAdmin
            .from("bookings")
            .insert(bookingPayload)
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error: any) {
        res.status(500).json({ error: "Failed to create booking" });
    }
});

// Track booking by tracking id
router.get("/track/:trackingId", authenticate, async (req: AuthRequest, res) => {
    try {
        const { trackingId } = req.params;

        let { data, error } = await supabaseAdmin
            .from("bookings")
            .select(`
        *,
        garage:garages (id, garage_name, location),
        service:services (id, service_name, price)
      `)
            .eq("tracking_id", trackingId)
            .maybeSingle();

        if (error) {
            const fallback = await supabaseAdmin
                .from("bookings")
                .select("*")
                .eq("tracking_id", trackingId)
                .maybeSingle();

            data = fallback.data;
            error = fallback.error;
        }

        if (error) throw error;
        if (!data) return res.status(404).json({ error: "Booking not found" });

        const normalized = {
            ...data,
            trackingId: data.tracking_id,
            deliveryOption: data.delivery_option,
            deliveryFee: data.delivery_fee,
            homeAddress: data.home_address,
            serviceDate: data.service_date,
            createdAt: data.created_at,
            userId: data.customer_id,
            total: data.total_price,
        };

        res.json(normalized);
    } catch (error: any) {
        console.error("Track booking error:", error?.message || error);
        res.status(500).json({ error: "Failed to track booking" });
    }
});

// Get user bookings
router.get("/my-bookings", authenticate, async (req: AuthRequest, res) => {
    try {
        const { data, error } = await getBookingsSelectWithFallback(req.userId);

        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        console.error("My bookings error:", error?.message || error);
        res.status(500).json({ error: "Failed to fetch bookings" });
    }
});

// Get all bookings (Admin only)
router.get("/admin", authenticate, async (req: AuthRequest, res) => {
    if (req.userRole !== "admin") return res.status(403).json({ error: "Unauthorized" });

    try {
        let { data, error } = await supabaseAdmin
            .from("bookings")
            .select(`
        *,
        customer:profiles!customer_id (id, name, email),
        garage:garages (id, garage_name, location),
        service:services (id, service_name, price)
      `)
            .order("created_at", { ascending: false });

        if (error) {
            const fallback = await getBookingsSelectWithFallback();
            data = fallback.data;
            error = fallback.error;
        }

        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        console.error("Admin bookings error:", error?.message || error);
        res.status(500).json({ error: "Failed to fetch all bookings" });
    }
});

// Update booking status
router.patch("/status/:id", authenticate, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const normalizedStatus = normalizeStatus(status);
        const normalizedRole = String(req.userRole || "").toLowerCase();

        // Check if user is owner of garage or admin
        const { data: booking } = await supabaseAdmin
            .from("bookings")
            .select("id, garage_id, tracking_id")
            .or(`id.eq.${id},tracking_id.eq.${id}`)
            .maybeSingle();

        if (!booking) return res.status(404).json({ error: "Booking not found" });

        let canUpdate = normalizedRole === "admin";

        if (!canUpdate && booking.garage_id) {
            const { data: garage } = await supabaseAdmin
                .from("garages")
                .select("owner_id")
                .eq("id", booking.garage_id)
                .maybeSingle();

            canUpdate = garage?.owner_id === req.userId;
        }

        if (!canUpdate) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        const { data: updated, error } = await supabaseAdmin
            .from("bookings")
            .update({ status: normalizedStatus })
            .eq("id", booking.id)
            .select()
            .single();

        if (error) throw error;
        res.json(updated);
    } catch (error: any) {
        res.status(500).json({ error: "Failed to update booking status" });
    }
});

export default router;
