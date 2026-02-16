import { supabase } from "@/lib/supabaseClient";

export type StaffProfile = {
  id: string;
  role?: string | null;
  full_name?: string | null;
  name?: string | null;
  phone?: string | null;
};

export type WorkOrder = {
  id: string;
  booking_id?: string | null;
  assigned_to?: string | null;
  status: string | null;
  priority?: string | null;
  service_type?: string | null;
  vehicle_brand?: string | null;
  vehicle_model?: string | null;
  vehicle_no?: string | null;
  customer_name?: string | null;
  phone?: string | null;
  pickup_required?: boolean | null;
  estimated_time?: string | null;
  assigned_bay?: number | null;
  scheduled_date?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  completed_at?: string | null;
};

export type TimeLog = {
  id: string;
  staff_id: string;
  work_date: string;
  clock_in?: string | null;
  clock_out?: string | null;
  hours?: number | null;
};

export type InventoryItem = {
  id: string;
  part_name: string;
  quantity: number;
  min_stock: number;
};

export async function getStaffProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, full_name, name, phone")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data || { id: userId }) as StaffProfile;
}

export async function getWorkOrdersForStaff(userId: string) {
  const { data, error } = await supabase
    .from("work_orders")
    .select(
      "id, booking_id, assigned_to, status, priority, service_type, vehicle_brand, vehicle_model, vehicle_no, customer_name, phone, pickup_required, estimated_time, assigned_bay, scheduled_date, created_at, updated_at, completed_at"
    )
    .eq("assigned_to", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []) as WorkOrder[];
}

export async function getTimeLogsForStaff(userId: string) {
  const { data, error } = await supabase
    .from("time_logs")
    .select("id, staff_id, work_date, clock_in, clock_out, hours")
    .eq("staff_id", userId)
    .order("work_date", { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []) as TimeLog[];
}

export async function getInventoryItems() {
  const { data, error } = await supabase
    .from("inventory")
    .select("id, part_name, quantity, min_stock")
    .order("part_name", { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []) as InventoryItem[];
}
