import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";

type BookingInfo = {
  name?: string | null;
  phone?: string | null;
  vehicle?: string | null;
  service_date?: string | null;
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
  pickup_required?: boolean | null;
  bookings?: BookingInfo | null;
};

const statusLabel = (status?: string | null) => {
  if (!status) {
    return "-";
  }
  return status.replace(/_/g, " ").toLowerCase();
};

export default function WorkOrderDetails() {
  const { id } = useParams();
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const fallbackId = useMemo(() => id || "WO-0000", [id]);

  useEffect(() => {
    let isMounted = true;

    const loadDetails = async () => {
      if (!id) {
        setErrorMessage("Missing work order id.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("work_orders")
        .select(
          "id, status, booking_id, customer_name, phone, vehicle_brand, vehicle_model, vehicle_no, service_type, pickup_required, bookings (name, phone, vehicle, service_date)"
        )
        .eq("id", id)
        .single();

      if (isMounted) {
        if (error) {
          setErrorMessage(error.message);
        }
        setWorkOrder((data as WorkOrder) || null);
        setLoading(false);
      }
    };

    loadDetails();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const updateStatus = async (nextStatus: string) => {
    if (!id) {
      return;
    }
    setSaving(true);
    setErrorMessage("");

    const { error } = await supabase
      .from("work_orders")
      .update({ status: nextStatus })
      .eq("id", id);

    if (error) {
      setErrorMessage(error.message);
      setSaving(false);
      return;
    }

    setWorkOrder((prev) => (prev ? { ...prev, status: nextStatus } : prev));
    setSaving(false);
  };

  const booking = workOrder?.bookings;
  const customerName = workOrder?.customer_name || booking?.name || `Booking ${workOrder?.booking_id || "-"}`;
  const vehicle = [workOrder?.vehicle_brand, workOrder?.vehicle_model, workOrder?.vehicle_no]
    .filter(Boolean)
    .join(" ");
  const vehicleLabel = vehicle || booking?.vehicle || `Booking ${workOrder?.booking_id || "-"}`;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Work Order</p>
        <h1 className="text-3xl font-semibold text-foreground">{fallbackId}</h1>
      </div>

      {errorMessage ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Customer & Vehicle</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading work order...</p>
          ) : (
            <>
              <div>
                <p className="text-xs text-muted-foreground">Customer</p>
                <p className="text-sm font-semibold text-foreground">{customerName}</p>
                <p className="text-sm text-muted-foreground">{workOrder?.phone || booking?.phone || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Vehicle</p>
                <p className="text-sm font-semibold text-foreground">{vehicleLabel}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Service</p>
                <p className="text-sm font-semibold text-foreground">{workOrder?.service_type || "-"}</p>
                <p className="text-sm text-muted-foreground">
                  Pickup: {workOrder?.pickup_required ? "Yes" : "No"}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Job Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <div className="text-sm text-muted-foreground">Status: {statusLabel(workOrder?.status)}</div>
          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={() => updateStatus("IN_PROGRESS")} disabled={saving}>
              Start Job
            </Button>
            <Button type="button" variant="outline" onClick={() => updateStatus("WAITING_PARTS")} disabled={saving}>
              Waiting Parts
            </Button>
            <Button type="button" variant="secondary" onClick={() => updateStatus("COMPLETED")} disabled={saving}>
              Mark Completed
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
