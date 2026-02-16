import { supabase } from "@/lib/supabaseClient";

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

type BookingRow = {
  tracking_id: string;
  name: string;
  email: string;
  phone: string | null;
  vehicle: string;
  services: BookingService[] | null;
  service_date: string;
  time: string;
  delivery_option: string | null;
  delivery_fee: number | null;
  home_address: string | null;
  subtotal: number | null;
  total: number;
  status: string;
  created_at: string;
  user_id: string | null;
};

const mapBookingRow = (row: BookingRow): BookingRecord => ({
  trackingId: row.tracking_id,
  name: row.name,
  email: row.email,
  phone: row.phone,
  vehicle: row.vehicle,
  services: row.services ?? [],
  date: row.service_date,
  time: row.time,
  deliveryOption: row.delivery_option,
  deliveryFee: row.delivery_fee,
  homeAddress: row.home_address,
  subtotal: row.subtotal,
  total: row.total,
  status: row.status,
  createdAt: row.created_at,
  userId: row.user_id,
});

export async function createBooking(input: CreateBookingInput) {
  const { data, error } = await supabase
    .from("bookings")
    .insert({
      tracking_id: input.trackingId,
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      vehicle: input.vehicle,
      services: input.services,
      service_date: input.date,
      time: input.time,
      delivery_option: input.deliveryOption ?? "none",
      delivery_fee: input.deliveryFee ?? 0,
      home_address: input.homeAddress ?? null,
      subtotal: input.subtotal ?? null,
      total: input.total,
      status: input.status,
      user_id: input.userId ?? null,
    })
    .select()
    .single();

  if (error || !data) {
    throw error || new Error("Unable to create booking.");
  }

  return mapBookingRow(data as BookingRow);
}

export async function getBookingByTrackingId(trackingId: string) {
  const { data, error } = await supabase
    .from("bookings")
    .select()
    .eq("tracking_id", trackingId)
    .single();

  if (error || !data) {
    throw error || new Error("Booking not found.");
  }

  return mapBookingRow(data as BookingRow);
}

export async function getBookingsForUser(params: { userId?: string; email?: string }) {
  let query = supabase.from("bookings").select().order("created_at", { ascending: false });

  if (params.userId) {
    query = query.eq("user_id", params.userId);
  } else if (params.email) {
    query = query.eq("email", params.email);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data || []).map((row) => mapBookingRow(row as BookingRow));
}
