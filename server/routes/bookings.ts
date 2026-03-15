import { Router } from "express";
import { adminDb } from "../lib/firebase-admin";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

const bookingsCol = () => adminDb.collection("bookings");
const garagesCol = () => adminDb.collection("garages");

const normalizeStatus = (value?: string) => {
    const normalized = String(value || "pending").trim().toLowerCase();
    if (normalized === "in-progress") return "in progress";
    return normalized;
};

const getBookingsList = async (customerId?: string) => {
    let q: FirebaseFirestore.Query = bookingsCol().orderBy("createdAt", "desc");
    if (customerId) {
        q = q.where("customerId", "==", customerId);
    }
    const snap = await q.get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// Create booking
router.post("/", authenticate, async (req: AuthRequest, res) => {
    try {
        const {
            trackingId, name, email, phone, vehicle, services,
            date, time, deliveryOption, deliveryFee, homeAddress,
            subtotal, total, status, garage_id, service_id, service_date, total_price,
        } = req.body;

        const normalizedStatus = normalizeStatus(status || "pending");

        const bookingPayload: Record<string, unknown> = {
            trackingId: trackingId || null,
            customerId: req.userId,
            garageId: garage_id || null,
            serviceId: service_id || null,
            name: name || null,
            email: email || null,
            phone: phone || null,
            vehicle: vehicle || null,
            services: Array.isArray(services) ? services : null,
            time: time || null,
            deliveryOption: deliveryOption || null,
            deliveryFee: deliveryFee ?? 0,
            homeAddress: homeAddress || null,
            subtotal: subtotal ?? total ?? total_price ?? 0,
            totalPrice: total_price ?? total ?? subtotal ?? 0,
            status: normalizedStatus,
            serviceDate: service_date || date || null,
            date: date || service_date || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const docRef = await bookingsCol().add(bookingPayload);
        res.status(201).json({ id: docRef.id, ...bookingPayload });
    } catch (error: any) {
        res.status(500).json({ error: "Failed to create booking" });
    }
});

// Track booking by tracking id
router.get("/track/:trackingId", authenticate, async (req: AuthRequest, res) => {
    try {
        const { trackingId } = req.params;

        const snap = await bookingsCol().where("trackingId", "==", trackingId).limit(1).get();

        if (snap.empty) return res.status(404).json({ error: "Booking not found" });

        const doc = snap.docs[0];
        const data = doc.data();

        const normalized = {
            id: doc.id,
            ...data,
            trackingId: data.trackingId,
            tracking_id: data.trackingId,
            deliveryOption: data.deliveryOption,
            delivery_option: data.deliveryOption,
            deliveryFee: data.deliveryFee,
            delivery_fee: data.deliveryFee,
            homeAddress: data.homeAddress,
            home_address: data.homeAddress,
            serviceDate: data.serviceDate,
            service_date: data.serviceDate,
            createdAt: data.createdAt,
            created_at: data.createdAt,
            userId: data.customerId,
            customer_id: data.customerId,
            total: data.totalPrice,
            total_price: data.totalPrice,
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
        const bookings = await getBookingsList(req.userId);
        res.json(bookings);
    } catch (error: any) {
        console.error("My bookings error:", error?.message || error);
        res.status(500).json({ error: "Failed to fetch bookings" });
    }
});

// Get all bookings (Admin only)
router.get("/admin", authenticate, async (req: AuthRequest, res) => {
    if (req.userRole !== "admin") return res.status(403).json({ error: "Unauthorized" });

    try {
        const bookings = await getBookingsList();
        res.json(bookings);
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

        // Find booking by id or trackingId
        let bookingDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null;
        const byId = await bookingsCol().doc(id).get();
        if (byId.exists) {
            bookingDoc = byId as any;
        } else {
            const byTracking = await bookingsCol().where("trackingId", "==", id).limit(1).get();
            if (!byTracking.empty) bookingDoc = byTracking.docs[0];
        }

        if (!bookingDoc) return res.status(404).json({ error: "Booking not found" });

        const bookingData = bookingDoc.data()!;
        let canUpdate = normalizedRole === "admin";

        if (!canUpdate && bookingData.garageId) {
            const garageSnap = await garagesCol().doc(bookingData.garageId).get();
            if (garageSnap.exists) {
                canUpdate = garageSnap.data()?.ownerId === req.userId;
            }
        }

        if (!canUpdate) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        await bookingsCol().doc(bookingDoc.id).update({
            status: normalizedStatus,
            updatedAt: new Date().toISOString(),
        });

        const updatedSnap = await bookingsCol().doc(bookingDoc.id).get();
        res.json({ id: updatedSnap.id, ...updatedSnap.data() });
    } catch (error: any) {
        res.status(500).json({ error: "Failed to update booking status" });
    }
});

export default router;
