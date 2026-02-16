import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabaseClient";

const statusTabs = [
  { label: "Pending", value: "ASSIGNED" },
  { label: "Completed", value: "COMPLETED" },
];

type BookingInfo = {
  name?: string | null;
  phone?: string | null;
  vehicle?: string | null;
  service_date?: string | null;
  created_at?: string | null;
};

type WorkOrder = {
  id: string;
  status: string | null;
  booking_id: string | null;
  service_type?: string | null;
  customer_name?: string | null;
  phone?: string | null;
  vehicle_brand?: string | null;
  vehicle_model?: string | null;
  vehicle_no?: string | null;
  pickup_required?: boolean | null;
  scheduled_date?: string | null;
  updated_at?: string | null;
  bookings?: BookingInfo | null;
};

type StaffProfile = {
  id: string;
  role?: string | null;
  full_name?: string | null;
  name?: string | null;
  phone?: string | null;
};

const formatDate = (value?: string | null) => {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleDateString();
};

const statusLabel = (status?: string | null) => {
  if (!status) {
    return "-";
  }
  return status.replace(/_/g, " ").toLowerCase();
};

export default function MechanicDashboard() {
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [activeTab, setActiveTab] = useState(statusTabs[0].value);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      setLoading(true);
      setErrorMessage("");

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        if (isMounted) {
          setErrorMessage(userError?.message || "Unable to load your session.");
          setLoading(false);
        }
        return;
      }

      const { data: staffProfile, error: profileError } = await supabase
        .from("profiles")
        .select("id, role, full_name, name, phone")
        .eq("id", userData.user.id)
        .single();

      if (isMounted) {
        if (profileError) {
          setErrorMessage(profileError.message);
        }
        setProfile(staffProfile || null);
      }

      const { data: orders, error: orderError } = await supabase
        .from("work_orders")
        .select(
          "id, status, booking_id, service_type, customer_name, phone, vehicle_brand, vehicle_model, vehicle_no, pickup_required, scheduled_date, updated_at, bookings (name, phone, vehicle, service_date, created_at)"
        )
        .eq("assigned_to", userData.user.id)
        .order("updated_at", { ascending: false });

      if (isMounted) {
        if (orderError) {
          setErrorMessage(orderError.message);
        }
        setWorkOrders((orders as WorkOrder[]) || []);
        setLoading(false);
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const kpis = useMemo(() => {
    const pending = workOrders.filter((order) => order.status === "ASSIGNED").length;
    const inProgress = workOrders.filter((order) => order.status === "IN_PROGRESS").length;
    const completed = workOrders.filter((order) => order.status === "COMPLETED").length;

    return {
      pending,
      inProgress,
      completed,
    };
  }, [workOrders]);

  const filteredOrders = useMemo(
    () => workOrders.filter((order) => order.status === activeTab),
    [workOrders, activeTab]
  );

  return (
    <div className="space-y-8">
      {errorMessage ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Mechanic Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Name</p>
            <p className="text-sm font-semibold text-foreground">
              {profile?.full_name || profile?.name || "Staff"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Role</p>
            <p className="text-sm font-semibold text-foreground">{profile?.role || "staff"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Phone</p>
            <p className="text-sm font-semibold text-foreground">{profile?.phone || "-"}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{kpis.pending}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{kpis.inProgress}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{kpis.completed}</CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Assigned Work Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="flex flex-wrap">
              {statusTabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {statusTabs.map((tab) => (
              <TabsContent key={tab.value} value={tab.value}>
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading work orders...</p>
                ) : filteredOrders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No work orders found.</p>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-border/60">
                    <div className="grid grid-cols-1 gap-0 border-b border-border/60 bg-muted/40 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid-cols-[1.4fr_1fr_1.3fr_1.2fr_0.8fr_0.9fr_0.9fr_0.7fr]">
                      <div className="px-4 py-3">Customer</div>
                      <div className="px-4 py-3">Phone</div>
                      <div className="px-4 py-3">Vehicle</div>
                      <div className="px-4 py-3">Service</div>
                      <div className="px-4 py-3">Pickup</div>
                      <div className="px-4 py-3">Booking</div>
                      <div className="px-4 py-3">Status</div>
                      <div className="px-4 py-3 text-right">Action</div>
                    </div>

                    {filteredOrders.map((order) => {
                      const booking = order.bookings;
                      const customerName =
                        order.customer_name || booking?.name || `Booking ${order.booking_id || "-"}`;
                      const phone = order.phone || booking?.phone || "-";
                      const vehicle = [order.vehicle_brand, order.vehicle_model, order.vehicle_no]
                        .filter(Boolean)
                        .join(" ");
                      const vehicleLabel = vehicle || booking?.vehicle || `Booking ${order.booking_id || "-"}`;
                      const serviceType = order.service_type || "-";
                      const pickupRequired = order.pickup_required ? "Yes" : "No";
                      const bookingDate = formatDate(
                        order.scheduled_date || booking?.service_date || booking?.created_at
                      );

                      return (
                        <div
                          key={order.id}
                          className="grid grid-cols-1 gap-0 border-b border-border/60 text-sm md:grid-cols-[1.4fr_1fr_1.3fr_1.2fr_0.8fr_0.9fr_0.9fr_0.7fr]"
                        >
                          <div className="px-4 py-3">
                            <p className="font-medium text-foreground">{customerName}</p>
                            <p className="text-xs text-muted-foreground">{order.booking_id || "-"}</p>
                          </div>
                          <div className="px-4 py-3 text-muted-foreground">{phone}</div>
                          <div className="px-4 py-3 text-muted-foreground">{vehicleLabel}</div>
                          <div className="px-4 py-3 text-muted-foreground">{serviceType}</div>
                          <div className="px-4 py-3 text-muted-foreground">{pickupRequired}</div>
                          <div className="px-4 py-3 text-muted-foreground">{bookingDate}</div>
                          <div className="px-4 py-3 text-muted-foreground">{statusLabel(order.status)}</div>
                          <div className="px-4 py-3 text-right">
                            <Button asChild variant="outline" size="sm">
                              <Link to={`/mechanic/work-orders/${order.id}`}>View</Link>
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
