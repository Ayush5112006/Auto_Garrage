import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/useAuth";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api-client";
import { Building2, Mail, MapPin, Phone, Plus, Search, UserCog, Users, TrendingUp, Filter, CheckCircle2, Clock } from "lucide-react";
import Footer from "@/components/Footer";

type AdminOption =
  | "manage-garage"
  | "garage-wise-staff"
  | "manage-customer"
  | "manage-all-users"
  | "garage-contact"
  | "manage-work-orders"
  | "analytics";

type Garage = {
  id: string;
  name: string;
  contactPhone: string;
  addressState: string;
  addressCountry: string;
  mechanicsCount: number;
  mapUrl: string;
  openTime: string;
  description: string;
  createdAt: string;
};

type Booking = {
  id: string;
  garageId: string;
  trackingId: string;
  name: string;
  email: string;
  phone: string;
  vehicle: string;
  date: string;
  time: string;
  total: number;
  status: string;
  createdAt: string;
  userId: string;
};

type AdminWorkOrder = {
  id: string;
  status: string;
  assignedTo: string;
  vehicle: string;
  customer: string;
  service: string;
};

type CustomerSummary = {
  email: string;
  name: string;
  phone: string;
  totalBookings: number;
  totalSpent: number;
  lastBookingAt: string;
};

const navOptions: Array<{ key: AdminOption; label: string }> = [
  { key: "analytics", label: "Analytics Overview" },
  { key: "manage-garage", label: "Manage Garage" },
  { key: "manage-work-orders", label: "Work Orders" },
  { key: "garage-wise-staff", label: "Garage Wise Staff" },
  { key: "manage-customer", label: "Customer Activity" },
  { key: "manage-all-users", label: "All Users" },
  { key: "garage-contact", label: "Garage Contacts" },
];

const bookingStatuses = ["pending", "confirmed", "in-progress", "completed", "cancelled"];

const normalizeGarage = (raw: Record<string, any>): Garage => ({
  id: String(raw.id ?? ""),
  name: String(raw.garage_name ?? raw.name ?? ""),
  contactPhone: String(raw.contact_phone ?? raw.contactPhone ?? ""),
  addressState: String(raw.location ?? raw.address_state ?? raw.addressState ?? ""),
  addressCountry: String(raw.address_country ?? raw.addressCountry ?? ""),
  mechanicsCount: Number(raw.mechanics_count ?? raw.mechanicsCount ?? 0) || 0,
  mapUrl: String(raw.map_url ?? raw.mapUrl ?? ""),
  openTime: String(raw.open_time ?? raw.openTime ?? ""),
  description: String(raw.description ?? ""),
  createdAt: String(raw.created_at ?? raw.createdAt ?? ""),
});

const normalizeBooking = (raw: Record<string, any>): Booking => ({
  id: String(raw.id ?? ""),
  garageId: String(raw.garage_id ?? raw.garageId ?? ""),
  trackingId: String(raw.tracking_id ?? raw.trackingId ?? ""),
  name: String(raw.name ?? raw.customer?.name ?? ""),
  email: String(raw.email ?? raw.customer?.email ?? ""),
  phone: String(raw.phone ?? raw.customer?.phone ?? ""),
  vehicle: String(raw.vehicle ?? ""),
  date: String(raw.service_date ?? raw.date ?? ""),
  time: String(raw.time ?? ""),
  total: Number(raw.total_price ?? raw.total ?? 0) || 0,
  status: String(raw.status ?? "pending"),
  createdAt: String(raw.created_at ?? raw.createdAt ?? ""),
  userId: String(raw.customer_id ?? raw.userId ?? ""),
});

const normalizeWorkOrder = (raw: Record<string, any>): AdminWorkOrder => ({
  id: String(raw.id ?? ""),
  status: String(raw.task_status ?? raw.status ?? "pending"),
  assignedTo: String(raw.staff_id ?? raw.assigned_to ?? raw.assignedTo ?? "-"),
  vehicle: String(raw.booking?.vehicle ?? raw.vehicle ?? "Vehicle"),
  customer: String(raw.booking?.customer?.name ?? raw.booking?.name ?? raw.customer_name ?? "Customer"),
  service: String(raw.booking?.service?.service_name ?? raw.service_type ?? "Service"),
});

const toDateLabel = (value: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [activeOption, setActiveOption] = useState<AdminOption>("analytics");
  const [garages, setGarages] = useState<Garage[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingGarageId, setSavingGarageId] = useState<string | null>(null);
  const [deletingGarageId, setDeletingGarageId] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [workOrders, setWorkOrders] = useState<AdminWorkOrder[]>([]);
  const [selectedCustomerEmail, setSelectedCustomerEmail] = useState<string>("");

  const [garageEdits, setGarageEdits] = useState<Record<string, Partial<Garage>>>({});
  const [contactEdits, setContactEdits] = useState<Record<string, Partial<Garage>>>({});
  const isAdminUser = !!user && user.role === "admin";

  const loadAdminData = async () => {
    if (!user || !isAdminUser) return;
    setLoading(true);
    try {
      const [garageResult, bookingResult, userResult, workOrderResult] = await Promise.all([
        api.getGarages(),
        api.getAdminBookings(),
        api.getUsersApi(),
        api.getWorkOrdersApi()
      ]);

      const nextGarages = Array.isArray(garageResult.data)
        ? garageResult.data.map((row) => normalizeGarage(row as Record<string, any>))
        : [];

      const nextBookings = Array.isArray(bookingResult.data)
        ? bookingResult.data.map((row) => normalizeBooking(row as Record<string, any>))
        : [];

      setGarages(nextGarages);
      setBookings(nextBookings);
      setUsers(Array.isArray(userResult.data) ? userResult.data : []);
      setWorkOrders(
        Array.isArray(workOrderResult.data)
          ? workOrderResult.data.map((row) => normalizeWorkOrder(row as Record<string, any>))
          : []
      );

      if (nextBookings.length > 0 && !selectedCustomerEmail) {
        setSelectedCustomerEmail(nextBookings[0].email);
      }
    } catch (error: any) {
      toast({ title: "Failed to load admin data", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user || !isAdminUser) {
      navigate("/admin/login", { replace: true });
      return;
    }
    loadAdminData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, isAdminUser, navigate]);

  if (authLoading || !user || !isAdminUser) {
    return null;
  }

  const updateGarageEditField = (id: string, field: string, value: any, type: "garage" | "contact") => {
    if (type === "garage") {
      setGarageEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
    } else {
      setContactEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
    }
  };

  const saveGaragePatch = async (id: string, patch: Partial<Garage>, title: string, successMsg: string) => {
    setSavingGarageId(id);
    const { error } = await api.updateGarageWithFallback(id, patch as Record<string, unknown>);
    setSavingGarageId(null);

    if (error) {
      toast({ title: "Save failed", description: error, variant: "destructive" });
    } else {
      toast({ title, description: successMsg });
      loadAdminData();
    }
  };

  const deleteGarage = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this garage?")) return;
    setDeletingGarageId(id);
    const { error } = await api.deleteGarageWithFallback(id);
    setDeletingGarageId(null);

    if (error) {
      toast({ title: "Delete failed", description: error, variant: "destructive" });
    } else {
      toast({ title: "Garage deleted", description: "The garage was removed from the database." });
      loadAdminData();
    }
  };

  const filteredGarages = useMemo(() => {
    const query = search.toLowerCase();
    return garages.filter(g => g.name.toLowerCase().includes(query) || g.addressState.toLowerCase().includes(query));
  }, [garages, search]);

  const customerSummaries = useMemo(() => {
    const map = new Map<string, CustomerSummary>();
    for (const b of bookings) {
      const email = b.email || "unknown@auto.com";
      const existing = map.get(email);
      if (existing) {
        existing.totalBookings += 1;
        existing.totalSpent += (b.total || 0);
      } else {
        map.set(email, { email, name: b.name, phone: b.phone, totalBookings: 1, totalSpent: b.total || 0, lastBookingAt: b.createdAt });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [bookings]);

  const usersList = useMemo(() => {
    return users.map(u => ({
      id: u.id,
      name: u.name || "No name",
      email: u.email,
      role: u.role || "user",
      source: "Database"
    }));
  }, [users]);

  const analytics = useMemo(() => {
    const normalizeStatus = (value: string) => value.replace(/[\s_]+/g, "-").toLowerCase();

    const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.total || 0), 0);
    const totalBookings = bookings.length;
    const completedCount = bookings.filter((booking) => normalizeStatus(booking.status) === "completed").length;
    const pendingCount = bookings.filter((booking) => normalizeStatus(booking.status) === "pending").length;
    const inProgressCount = bookings.filter((booking) => normalizeStatus(booking.status) === "in-progress").length;
    const cancellationCount = bookings.filter((booking) => normalizeStatus(booking.status) === "cancelled").length;

    const completionRate = totalBookings > 0 ? Math.round((completedCount / totalBookings) * 100) : 0;
    const cancellationRate = totalBookings > 0 ? Math.round((cancellationCount / totalBookings) * 100) : 0;
    const averageOrderValue = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0;

    const activeGarages = new Set(bookings.map((booking) => booking.garageId).filter(Boolean)).size;

    const garageLookup = new Map(garages.map((garage) => [garage.id, garage.name]));
    const garageRevenueMap = new Map<string, number>();
    bookings.forEach((booking) => {
      const current = garageRevenueMap.get(booking.garageId) || 0;
      garageRevenueMap.set(booking.garageId, current + (booking.total || 0));
    });

    const garageRevenueRows = Array.from(garageRevenueMap.entries())
      .map(([garageId, revenue]) => ({
        garageId,
        garageName: garageLookup.get(garageId) || "Unknown Garage",
        revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const maxGarageRevenue = garageRevenueRows[0]?.revenue || 0;

    const statusCounts = bookingStatuses.map((status) => {
      const count = bookings.filter((booking) => normalizeStatus(booking.status) === status).length;
      return {
        status,
        count,
        percentage: totalBookings > 0 ? Math.round((count / totalBookings) * 100) : 0,
      };
    });

    const now = new Date();
    const monthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const monthLabel = (date: Date) => date.toLocaleString(undefined, { month: "short" });

    const months = Array.from({ length: 6 }, (_, index) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      return {
        key: monthKey(d),
        label: monthLabel(d),
        bookings: 0,
        revenue: 0,
      };
    });

    const monthIndexMap = new Map(months.map((m, index) => [m.key, index]));

    bookings.forEach((booking) => {
      const parsed = new Date(booking.date || booking.createdAt);
      if (Number.isNaN(parsed.getTime())) return;
      const index = monthIndexMap.get(monthKey(parsed));
      if (index === undefined) return;

      months[index].bookings += 1;
      months[index].revenue += booking.total || 0;
    });

    const maxMonthlyRevenue = months.reduce((max, month) => Math.max(max, month.revenue), 0);

    return {
      totalRevenue,
      totalBookings,
      completedCount,
      pendingCount,
      inProgressCount,
      cancellationCount,
      completionRate,
      cancellationRate,
      averageOrderValue,
      activeGarages,
      garageRevenueRows,
      maxGarageRevenue,
      statusCounts,
      months,
      maxMonthlyRevenue,
      topCustomers: customerSummaries.slice(0, 5),
    };
  }, [bookings, garages, customerSummaries]);

  const renderSection = () => {
    if (activeOption === "analytics") {
      return (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="card-simple">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Revenue</p>
                    <p className="text-2xl font-bold">₹{analytics.totalRevenue.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="card-simple">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Completion Rate</p>
                    <p className="text-2xl font-bold">{analytics.completionRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="card-simple">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-500">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">AOV</p>
                    <p className="text-2xl font-bold">₹{analytics.averageOrderValue.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="card-simple">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500">
                    <Filter className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Cancellation Rate</p>
                    <p className="text-2xl font-bold">{analytics.cancellationRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Card className="card-simple">
              <CardContent className="p-5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Bookings</p>
                <p className="text-2xl font-bold mt-2">{analytics.totalBookings}</p>
              </CardContent>
            </Card>
            <Card className="card-simple">
              <CardContent className="p-5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">In Progress</p>
                <p className="text-2xl font-bold mt-2">{analytics.inProgressCount}</p>
              </CardContent>
            </Card>
            <Card className="card-simple">
              <CardContent className="p-5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Pending</p>
                <p className="text-2xl font-bold mt-2">{analytics.pendingCount}</p>
              </CardContent>
            </Card>
            <Card className="card-simple">
              <CardContent className="p-5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Garages</p>
                <p className="text-2xl font-bold mt-2">{analytics.activeGarages || garages.length}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="card-simple">
              <CardHeader><CardTitle>Garage Revenue Leaderboard</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {analytics.garageRevenueRows.map((row, idx) => (
                  <div key={row.garageId} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold">{idx + 1}. {row.garageName}</span>
                      <span className="font-bold text-primary">₹{row.revenue.toLocaleString()}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${analytics.maxGarageRevenue > 0 ? Math.max((row.revenue / analytics.maxGarageRevenue) * 100, 4) : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
                {analytics.garageRevenueRows.length === 0 ? <p className="text-sm text-muted-foreground">No revenue data available.</p> : null}
              </CardContent>
            </Card>
            <Card className="card-simple">
              <CardHeader><CardTitle>Status Distribution</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {analytics.statusCounts.map((item) => (
                  <div key={item.status} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="capitalize">{item.status.replace(/-/g, " ")}</span>
                      <span className="font-bold">{item.count} ({item.percentage}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${item.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="card-simple">
              <CardHeader><CardTitle>6-Month Revenue Trend</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {analytics.months.map((month) => (
                  <div key={month.key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold">{month.label}</span>
                      <span className="font-bold">₹{month.revenue.toLocaleString()} • {month.bookings} bookings</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${analytics.maxMonthlyRevenue > 0 ? Math.max((month.revenue / analytics.maxMonthlyRevenue) * 100, 4) : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="card-simple">
              <CardHeader><CardTitle>Top Customers</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {analytics.topCustomers.map((customer, idx) => (
                  <div key={customer.email} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
                    <div>
                      <p className="font-semibold">{idx + 1}. {customer.name || customer.email}</p>
                      <p className="text-xs text-muted-foreground">{customer.totalBookings} bookings</p>
                    </div>
                    <p className="font-bold text-primary">₹{customer.totalSpent.toLocaleString()}</p>
                  </div>
                ))}
                {analytics.topCustomers.length === 0 ? <p className="text-sm text-muted-foreground">No customer activity available.</p> : null}
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    if (activeOption === "manage-garage") {
      return (
        <div className="space-y-4">
          {filteredGarages.map((garage) => {
            const draft = garageEdits[garage.id] || {};
            const name = draft.name ?? garage.name;
            const addressState = draft.addressState ?? garage.addressState;
            return (
              <Card key={garage.id} className="card-simple p-5">
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Name</label>
                    <Input value={name} onChange={e => updateGarageEditField(garage.id, "name", e.target.value, "garage")} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">State</label>
                    <Input value={addressState} onChange={e => updateGarageEditField(garage.id, "addressState", e.target.value, "garage")} />
                  </div>
                  <div className="flex items-end gap-2 pb-0.5">
                    <Button size="sm" onClick={() => saveGaragePatch(garage.id, { name, addressState }, "Updated", "Done")}>Save</Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteGarage(garage.id)}>Delete</Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      );
    }

    if (activeOption === "manage-all-users") {
      return (
        <div className="space-y-3">
          {usersList.map(u => (
            <Card key={u.id} className="card-simple p-4 flex items-center justify-between">
              <div>
                <p className="font-bold">{u.name}</p>
                <p className="text-xs text-muted-foreground">{u.email}</p>
              </div>
              <select
                value={u.role}
                onChange={async (e) => {
                  const { error } = await api.updateUserRoleApi(u.id, e.target.value);
                  if (!error) { toast({ title: "Role Updated" }); loadAdminData(); }
                }}
                className="h-8 text-xs font-bold uppercase px-2 rounded border"
              >
                <option value="customer">Customer</option>
                <option value="manager">Manager</option>
                <option value="mechanic">Mechanic</option>
                <option value="admin">Admin</option>
              </select>
            </Card>
          ))}
        </div>
      );
    }

    if (activeOption === "manage-work-orders") {
      return (
        <div className="space-y-4">
          {workOrders.map(order => (
            <Card key={order.id} className="card-simple p-4 flex items-center justify-between">
              <div>
                <p className="font-bold uppercase text-primary text-[10px]">{order.id.slice(0, 8)}</p>
                <p className="font-semibold">{order.vehicle}</p>
                <p className="text-xs text-muted-foreground">{order.customer} • {order.service}</p>
                <p className="text-xs text-muted-foreground">Staff ID: {order.assignedTo}</p>
              </div>
              <Badge>{order.status}</Badge>
            </Card>
          ))}
        </div>
      )
    }

    return <div className="p-10 text-center text-muted-foreground">Section under construction or coming soon.</div>;
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="fixed top-16 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-b">
        <div className="page-shell flex items-center gap-6 h-12 overflow-x-auto scrollbar-hide">
          {navOptions.map(opt => (
            <button
              key={opt.key}
              onClick={() => setActiveOption(opt.key)}
              className={`text-[10px] font-bold uppercase tracking-widest whitespace-nowrap h-full px-2 border-b-2 transition-all ${activeOption === opt.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 pt-32 pb-12">
        <div className="page-shell max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <h1 className="text-4xl font-display text-foreground">Admin Control</h1>
              <p className="text-muted-foreground">System-wide management and performance insights.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search everything..." className="pl-9 h-10" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              {activeOption === "manage-garage" && (
                <Button asChild className="gap-2">
                  <Link to="/garage/add"><Plus className="w-4 h-4" /> Add Garage</Link>
                </Button>
              )}
            </div>
          </div>

          {renderSection()}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Admin;
