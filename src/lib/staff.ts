import { api } from "@/lib/api-client";
import { supabase } from "@/lib/supabaseClient";

export type StaffProfile = {
  id: string;
  role?: string | null;
  name?: string | null;
  full_name?: string | null;
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

export type InventoryItem = {
  id: string;
  part_name: string;
  quantity: number;
  min_stock: number;
};

export type TimeLog = {
  id?: string;
  work_date: string;
  clock_in?: string | null;
  clock_out?: string | null;
  hours?: number | null;
};

const demoWorkOrders: WorkOrder[] = [
  {
    id: "WO-1001",
    status: "in-progress",
    priority: "high",
    service_type: "Brake Service",
    vehicle_brand: "Honda",
    vehicle_model: "City",
    vehicle_no: "DL8CAF1234",
    customer_name: "Rahul Sharma",
    estimated_time: "2h",
    assigned_bay: 2,
    scheduled_date: new Date().toISOString(),
  },
  {
    id: "WO-1002",
    status: "pending",
    priority: "medium",
    service_type: "Oil Change",
    vehicle_brand: "Hyundai",
    vehicle_model: "i20",
    vehicle_no: "UP14AB5678",
    customer_name: "Neha Verma",
    estimated_time: "1h",
    assigned_bay: 1,
    scheduled_date: new Date().toISOString(),
  },
];

const demoInventory: InventoryItem[] = [
  { id: "INV-1", part_name: "Engine Oil 5W-30", quantity: 24, min_stock: 10 },
  { id: "INV-2", part_name: "Brake Pads", quantity: 6, min_stock: 8 },
  { id: "INV-3", part_name: "Air Filter", quantity: 12, min_stock: 6 },
];

const demoTimeLogs: TimeLog[] = [
  {
    id: "TL-1",
    work_date: new Date().toISOString().slice(0, 10),
    clock_in: "09:05",
    clock_out: "18:10",
    hours: 9,
  },
];

const normalizeWorkOrders = (data: any[]): WorkOrder[] =>
  data.map((order: any) => ({
    ...order,
    id: String(order.id),
    booking_id: order.booking_id || order.bookingId,
    assigned_to: order.staff_id || order.assignedTo || order.assigned_to,
    status: order.task_status || order.status || "pending",
    service_type:
      order.booking?.service?.service_name ||
      order.serviceType ||
      order.service_type ||
      "Service",
    customer_name:
      order.booking?.customer?.name ||
      order.customerName ||
      order.customer_name ||
      "Customer",
    phone: order.booking?.customer?.phone || order.phone,
    created_at: order.created_at || order.createdAt,
    updated_at: order.updated_at || order.updatedAt,
  })) as WorkOrder[];

const isDemoUserId = (userId?: string | null) =>
  String(userId || "").trim().toLowerCase().startsWith("demo-");

export async function getStaffProfile(userId: string) {
  if (isDemoUserId(userId)) {
    return { id: userId, role: "staff", name: "Demo Staff", full_name: "Demo Staff" } as StaffProfile;
  }

  const { data, error } = await api.request<StaffProfile>(`/staff/profile/${userId}`);
  if (!error && data) {
    return data;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, name, full_name, phone")
    .eq("id", userId)
    .maybeSingle();

  if (profile) {
    return profile as StaffProfile;
  }

  return { id: userId, role: "staff", name: "Staff User", full_name: "Staff User" } as StaffProfile;
}

export async function getWorkOrdersForStaff(userId: string) {
  if (isDemoUserId(userId)) {
    return demoWorkOrders;
  }

  const { data, error } = await api.request<WorkOrder[]>("/staff/work-orders");
  if (!error && Array.isArray(data) && data.length > 0) {
    return normalizeWorkOrders(data as any[]);
  }

  const { data: serviceTasks, error: taskError } = await supabase
    .from("service_tasks")
    .select("*")
    .eq("assigned_to", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (!taskError && Array.isArray(serviceTasks) && serviceTasks.length > 0) {
    return normalizeWorkOrders(serviceTasks as any[]);
  }

  return demoWorkOrders;
}

export async function getInventoryItems(userId?: string) {
  if (isDemoUserId(userId)) {
    return demoInventory;
  }

  const { data, error } = await api.request<any[]>("/staff/inventory");
  if (!error && Array.isArray(data) && data.length > 0) {
    return data.map((item: any) => ({
      id: item.id,
      part_name: item.partName || item.part_name,
      quantity: Number(item.quantity || 0),
      min_stock: Number(item.minStock || item.min_stock || 0),
    })) as InventoryItem[];
  }

  const { data: stock, error: stockError } = await supabase
    .from("inventory")
    .select("id, part_name, quantity, min_stock")
    .order("part_name", { ascending: true })
    .limit(100);

  if (!stockError && Array.isArray(stock) && stock.length > 0) {
    return stock as InventoryItem[];
  }

  return demoInventory;
}

export async function getTimeLogsForStaff(userId: string) {
  if (isDemoUserId(userId)) {
    return demoTimeLogs;
  }

  const { data, error } = await api.request<any[]>('/staff/time-logs');
  if (!error && Array.isArray(data) && data.length > 0) {
    return data.map((log: any) => ({
      id: log.id,
      work_date: log.workDate || log.work_date || "-",
      clock_in: log.clockIn || log.clock_in || null,
      clock_out: log.clockOut || log.clock_out || null,
      hours: typeof log.hours === "number" ? log.hours : Number(log.hours || 0),
    })) as TimeLog[];
  }

  const { data: logs, error: logsError } = await supabase
    .from("staff_time_logs")
    .select("id, work_date, clock_in, clock_out, hours")
    .order("work_date", { ascending: false })
    .limit(30);

  if (!logsError && Array.isArray(logs) && logs.length > 0) {
    return logs as TimeLog[];
  }

  return demoTimeLogs;
}

export async function updateWorkOrderStatus(id: string, status: string) {
  const { data, error } = await api.request<any>(`/staff/work-orders/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ task_status: status }),
  });
  if (!error) {
    return data;
  }

  const { data: updated, error: supabaseError } = await supabase
    .from("service_tasks")
    .update({ task_status: status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .maybeSingle();

  if (supabaseError) {
    return { id, task_status: status };
  }

  return updated || { id, task_status: status };
}
