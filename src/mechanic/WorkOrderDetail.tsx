import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabaseClient";

type BookingInfo = {
  phone?: string | null;
  name?: string | null;
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
  start_time?: string | null;
  end_time?: string | null;
  bookings?: BookingInfo | null;
};

type WorkOrderUpdate = {
  id: string;
  note?: string | null;
  created_at?: string | null;
  created_by?: string | null;
};

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
};

export default function MechanicWorkOrderDetail() {
  const { id } = useParams();
  const fallbackId = useMemo(() => id || "WO-0000", [id]);
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [updates, setUpdates] = useState<WorkOrderUpdate[]>([]);
  const [updateNote, setUpdateNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionMessage, setActionMessage] = useState("");

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

      const { data: workOrderData, error: workOrderError } = await supabase
        .from("work_orders")
        .select(
          "id, status, booking_id, customer_name, phone, vehicle_brand, vehicle_model, vehicle_no, service_type, pickup_required, start_time, end_time, bookings (name, phone, vehicle, service_date)"
        )
        .eq("id", id)
        .single();

      if (isMounted) {
        if (workOrderError) {
          setErrorMessage(workOrderError.message);
        }
        setWorkOrder((workOrderData as WorkOrder) || null);
      }

      const { data: updateData, error: updateError } = await supabase
        .from("work_order_updates")
        .select("id, note, created_at, created_by")
        .eq("work_order_id", id)
        .order("created_at", { ascending: false });

      if (isMounted) {
        if (updateError) {
          setErrorMessage(updateError.message);
        }
        setUpdates((updateData as WorkOrderUpdate[]) || []);
        setLoading(false);
      }
    };

    loadDetails();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const insertUpdate = async (note: string) => {
    const { data: userData } = await supabase.auth.getUser();
    const payload = {
      work_order_id: id,
      note,
      created_by: userData.user?.id,
    };

    return supabase.from("work_order_updates").insert(payload);
  };

  const handleStartJob = async () => {
    if (!id) {
      return;
    }
    setSaving(true);
    setActionMessage("");

    const { error } = await supabase
      .from("work_orders")
      .update({ status: "IN_PROGRESS", start_time: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      setActionMessage(error.message);
      setSaving(false);
      return;
    }

    await insertUpdate("Status changed to IN_PROGRESS.");
    setActionMessage("Status updated.");
    setSaving(false);
    setWorkOrder((prev) =>
      prev ? { ...prev, status: "IN_PROGRESS", start_time: new Date().toISOString() } : prev
    );
  };

  const handleCompleteJob = async () => {
    if (!id) {
      return;
    }
    setSaving(true);
    setActionMessage("");

    const { error } = await supabase
      .from("work_orders")
      .update({ status: "COMPLETED", end_time: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      setActionMessage(error.message);
      setSaving(false);
      return;
    }

    await insertUpdate("Status changed to COMPLETED.");
    setActionMessage("Status updated.");
    setSaving(false);
    setWorkOrder((prev) =>
      prev ? { ...prev, status: "COMPLETED", end_time: new Date().toISOString() } : prev
    );
  };

  const handleAddUpdate = async () => {
    if (!id || !updateNote.trim()) {
      return;
    }
    setSaving(true);
    setActionMessage("");

    const { error } = await insertUpdate(updateNote.trim());

    if (error) {
      setActionMessage(error.message);
      setSaving(false);
      return;
    }

    setUpdateNote("");
    setActionMessage("Update added.");
    setSaving(false);

    const { data: refreshedUpdates } = await supabase
      .from("work_order_updates")
      .select("id, note, created_at, created_by")
      .eq("work_order_id", id)
      .order("created_at", { ascending: false });

    setUpdates((refreshedUpdates as WorkOrderUpdate[]) || []);
  };

  const booking = workOrder?.bookings;
  const vehicleDetails = [workOrder?.vehicle_brand, workOrder?.vehicle_model, workOrder?.vehicle_no]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Work Order</p>
          <h1 className="text-3xl font-semibold text-foreground">{fallbackId}</h1>
        </div>
        <Button asChild variant="outline">
          <Link to="/mechanic/work-orders">Back to list</Link>
        </Button>
      </div>

      {errorMessage ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Job Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          {loading ? (
            <p>Loading work order...</p>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{workOrder?.status || "-"}</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-foreground">Customer</p>
                  <p>{workOrder?.customer_name || booking?.name || `Booking ${workOrder?.booking_id || "-"}`}</p>
                  <p>{workOrder?.phone || booking?.phone || "No phone"}</p>
                </div>
                <div>
                  <p className="text-foreground">Vehicle</p>
                  <p>{vehicleDetails || booking?.vehicle || "Vehicle details unavailable"}</p>
                </div>
                <div>
                  <p className="text-foreground">Service Type</p>
                  <p>{workOrder?.service_type || "-"}</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-foreground">Pickup Required</p>
                  <p>{workOrder?.pickup_required ? "Yes" : "No"}</p>
                </div>
                <div>
                  <p className="text-foreground">Start Time</p>
                  <p>{formatDateTime(workOrder?.start_time)}</p>
                </div>
                <div>
                  <p className="text-foreground">End Time</p>
                  <p>{formatDateTime(workOrder?.end_time)}</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={handleStartJob} disabled={saving || loading}>
              Start Job
            </Button>
            <Button type="button" variant="outline" onClick={handleCompleteJob} disabled={saving || loading}>
              Complete Job
            </Button>
          </div>
          {actionMessage ? (
            <p className="text-sm text-muted-foreground">{actionMessage}</p>
          ) : null}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="update-note">
              Add Timeline Update
            </label>
            <Textarea
              id="update-note"
              placeholder="Describe the latest progress or parts used..."
              value={updateNote}
              onChange={(event) => setUpdateNote(event.target.value)}
            />
            <div className="flex justify-end">
              <Button type="button" onClick={handleAddUpdate} disabled={saving || !updateNote.trim()}>
                Add Update
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Timeline Updates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading updates...</p>
          ) : updates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No updates yet.</p>
          ) : (
            updates.map((update) => (
              <div key={update.id} className="rounded-lg border border-border/60 px-4 py-3">
                <p className="text-sm text-foreground">{update.note || "Update"}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(update.created_at)}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
