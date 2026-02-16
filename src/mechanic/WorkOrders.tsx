import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";

const statusTabs = [
  { label: "Assigned", value: "ASSIGNED" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Completed", value: "COMPLETED" },
];

type BookingInfo = {
  name?: string | null;
  phone?: string | null;
  vehicle?: string | null;
};

type WorkOrder = {
  id: string;
  status: string | null;
  booking_id: string | null;
  customer_name?: string | null;
  phone?: string | null;
  vehicle_brand?: string | null;
  vehicle_model?: string | null;
  vehicle_no?: string | null;
  service_type?: string | null;
  updated_at?: string | null;
  bookings?: BookingInfo | null;
};

const statusLabel = (status?: string | null) => {
  if (!status) {
    return "-";
  }
  return status.replace(/_/g, " ").toLowerCase();
};

export default function WorkOrders() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState(statusTabs[0].value);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadWorkOrders = async () => {
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

      const { data: orders, error: orderError } = await supabase
        .from("work_orders")
        .select(
          "id, status, booking_id, customer_name, phone, vehicle_brand, vehicle_model, vehicle_no, service_type, updated_at, bookings (name, phone, vehicle)"
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

    loadWorkOrders();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return workOrders.filter((order) => {
      if (order.status !== activeTab) {
        return false;
      }

      if (!query) {
        return true;
      }

      const booking = order.bookings;
      const customerName = order.customer_name || booking?.name || "";
      const vehicleNo = order.vehicle_no || "";
      const searchTarget = [order.id, order.booking_id, customerName, vehicleNo]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchTarget.includes(query);
    });
  }, [workOrders, activeTab, searchQuery]);

  const content = useMemo(() => {
    if (loading) {
      return <p className="text-sm text-muted-foreground">Loading work orders...</p>;
    }
    if (filteredOrders.length === 0) {
      return <p className="text-sm text-muted-foreground">No work orders found.</p>;
    }

    return (
      <div className="overflow-hidden rounded-lg border border-border/60">
        <div className="grid grid-cols-1 gap-0 border-b border-border/60 bg-muted/40 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid-cols-[1.3fr_1fr_1.3fr_1fr_0.8fr]">
          <div className="px-4 py-3">Job ID</div>
          <div className="px-4 py-3">Customer</div>
          <div className="px-4 py-3">Vehicle</div>
          <div className="px-4 py-3">Service</div>
          <div className="px-4 py-3">Status</div>
        </div>
        {filteredOrders.map((order) => {
          const booking = order.bookings;
          const customerName = order.customer_name || booking?.name || `Booking ${order.booking_id || "-"}`;
          const vehicle = [order.vehicle_brand, order.vehicle_model, order.vehicle_no]
            .filter(Boolean)
            .join(" ");
          const vehicleLabel = vehicle || booking?.vehicle || `Booking ${order.booking_id || "-"}`;
          const serviceType = order.service_type || "-";

          return (
            <Link
              key={order.id}
              to={`/mechanic/work-orders/${order.id}`}
              className="grid grid-cols-1 gap-0 border-b border-border/60 text-sm transition hover:bg-muted/60 md:grid-cols-[1.3fr_1fr_1.3fr_1fr_0.8fr]"
            >
              <div className="px-4 py-3 font-medium text-foreground">{order.id}</div>
              <div className="px-4 py-3 text-muted-foreground">{customerName}</div>
              <div className="px-4 py-3 text-muted-foreground">{vehicleLabel}</div>
              <div className="px-4 py-3 text-muted-foreground">{serviceType}</div>
              <div className="px-4 py-3 text-muted-foreground">{statusLabel(order.status)}</div>
            </Link>
          );
        })}
      </div>
    );
  }, [filteredOrders, loading]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Work Orders</h1>
        <p className="text-muted-foreground">Track assigned jobs by status and priority.</p>
      </div>

      {errorMessage ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      <Card className="border-border/60">
        <CardHeader className="space-y-4">
          <CardTitle className="text-base">Assigned Work Orders</CardTitle>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                {statusTabs.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="w-full sm:w-72">
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by customer, vehicle, or job id"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {statusTabs.map((tab) => (
              <TabsContent key={tab.value} value={tab.value}>
                {content}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
