import { api } from "@/lib/api-client";

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
  services: Array.isArray(data.services) ? data.services : (typeof data.services === 'string' ? JSON.parse(data.services) : []),
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
  const { data, error } = await api.getMyBookingsApi();

  if (error) {
    throw new Error(error);
  }

  return (data || []).map((row: any) => mapBookingResponse(row));
}
