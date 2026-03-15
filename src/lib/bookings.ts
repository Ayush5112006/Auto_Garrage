import { api } from "@/lib/api-client";
import { db } from "@/lib/firebase";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";

export type BookingService = {
  id: string;
  name?: string;
  price?: number;
};

export type BookingRecord = {
  trackingId: string;
  name: string;
  email: string;
  phone?: string | null;
  vehicle: string;
  services: BookingService[];
  date: string;
  time: string;
  deliveryOption?: string | null;
  deliveryFee?: number | null;
  homeAddress?: string | null;
  subtotal?: number | null;
  total: number;
  status: string;
  createdAt: string;
  userId?: string | null;
};

export type CreateBookingInput = {
  trackingId: string;
  name: string;
  email: string;
  phone?: string | null;
  vehicle: string;
  services: BookingService[];
  date: string;
  time: string;
  deliveryOption?: string | null;
  deliveryFee?: number | null;
  homeAddress?: string | null;
  subtotal?: number | null;
  total: number;
  status: string;
  userId?: string | null;
};

const mapBookingResponse = (data: any): BookingRecord => ({
  trackingId: data.trackingId || data.tracking_id,
  name: data.name,
  email: data.email,
  phone: data.phone,
  vehicle: data.vehicle,
  services: Array.isArray(data.services)
    ? data.services
    : typeof data.services === "string"
      ? JSON.parse(data.services)
      : [],
  date: data.serviceDate || data.service_date || data.date,
  time: data.time,
  deliveryOption: data.deliveryOption || data.delivery_option,
  deliveryFee: data.deliveryFee ?? data.delivery_fee,
  homeAddress: data.homeAddress || data.home_address,
  subtotal: data.subtotal,
  total: data.total ?? data.total_price ?? 0,
  status: data.status,
  createdAt: data.createdAt || data.created_at,
  userId: data.userId || data.user_id,
});

const hasBackendTokenCookie = () =>
  typeof document !== "undefined" &&
  document.cookie.split(";").some((part) => part.trim().startsWith("token="));

const getBookingsFromFirestore = async (params: { userId?: string; email?: string }) => {
  if (!params.userId && !params.email) {
    return [] as BookingRecord[];
  }

  try {
    let q = query(collection(db, "bookings"), orderBy("createdAt", "desc"), limit(100));

    if (params.userId) {
      q = query(
        collection(db, "bookings"),
        where("customerId", "==", params.userId),
        orderBy("createdAt", "desc"),
        limit(100)
      );
    } else if (params.email) {
      q = query(
        collection(db, "bookings"),
        where("email", "==", params.email),
        orderBy("createdAt", "desc"),
        limit(100)
      );
    }

    const snap = await getDocs(q);
    return snap.docs.map((doc) => mapBookingResponse({ id: doc.id, ...doc.data() }));
  } catch {
    return [] as BookingRecord[];
  }
};

export async function createBooking(input: CreateBookingInput) {
  const { data, error } = await api.createBookingApi(input);

  if (error || !data) {
    throw new Error(error || "Unable to create booking.");
  }

  return mapBookingResponse(data);
}

export async function getBookingByTrackingId(trackingId: string) {
  const { data, error } = await api.getBookingByTrackingIdApi(trackingId);

  if (error || !data) {
    throw new Error(error || "Booking not found.");
  }

  return mapBookingResponse(data);
}

export async function getBookingsForUser(params: { userId?: string; email?: string }) {
  if (!hasBackendTokenCookie()) {
    return getBookingsFromFirestore(params);
  }

  const { data, error } = await api.getMyBookingsApi();

  if (error) {
    const msg = String(error).toLowerCase();
    if (msg.includes("auth") || msg.includes("401") || msg.includes("unauthorized")) {
      return getBookingsFromFirestore(params);
    }
    throw new Error(error);
  }

  return (data || []).map((row: any) => mapBookingResponse(row));
}
