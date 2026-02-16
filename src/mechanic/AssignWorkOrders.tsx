import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

type WorkOrder = {
  id: string;
  booking_id?: string | null;
  customer_name?: string | null;
  service_type?: string | null;
  status?: string | null;
  assigned_to?: string | null;
  created_at?: string | null;
};

type StaffMember = {
  id: string;
  full_name?: string | null;
  name?: string | null;
  role?: string | null;
};

const allowedRoles = new Set(["admin", "service_advisor", "mechanic", "staff"]);

export default function AssignWorkOrders() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string>>({});

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setErrorMessage("");

    const loadData = async () => {
      const [{ data: orders, error: ordersError }, { data: staff, error: staffError }] =
        await Promise.all([
          supabase
            .from("work_orders")
            .select("id, booking_id, customer_name, service_type, status, assigned_to, created_at")
            .is("assigned_to", null)
            .order("created_at", { ascending: false }),
          supabase
            .from("profiles")
            .select("id, full_name, name, role")
            .order("full_name", { ascending: true }),
        ]);

      if (!isMounted) return;

      if (ordersError) {
        setErrorMessage(ordersError.message);
      }

      if (staffError) {
        setErrorMessage(staffError.message);
      }

      setWorkOrders((orders || []) as WorkOrder[]);
      setStaffMembers((staff || []) as StaffMember[]);
      setLoading(false);
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredStaff = useMemo(
    () => staffMembers.filter((member) => !member.role || allowedRoles.has(member.role)),
    [staffMembers]
  );

  const handleAssign = async (orderId: string) => {
    const staffId = assignments[orderId];
    if (!staffId) {
      toast({
        title: "Select staff",
        description: "Please choose a staff member before assigning.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("work_orders")
      .update({ assigned_to: staffId, status: "ASSIGNED" })
      .eq("id", orderId);

    if (error) {
      toast({
        title: "Assignment failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setWorkOrders((prev) => prev.filter((order) => order.id !== orderId));
    toast({
      title: "Assigned",
      description: "Work order assigned successfully.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Assign Work Orders</h1>
        <p className="text-sm text-muted-foreground">
          Assign unassigned bookings to staff members.
        </p>
      </div>

      {errorMessage ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Unassigned Work Orders</CardTitle>
          <CardDescription>Assign pending orders to mechanics or staff.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading orders...</p>
          ) : workOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No unassigned work orders.</p>
          ) : (
            workOrders.map((order) => (
              <div
                key={order.id}
                className="flex flex-col gap-3 rounded-lg border border-border/60 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">
                      {order.customer_name || "Customer"}
                    </p>
                    <Badge variant="secondary">{order.status || "PENDING"}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {order.service_type || "Service"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Booking ID: {order.booking_id || "-"}
                  </p>
                </div>

                <div className="flex flex-col gap-2 md:flex-row md:items-center">
                  <Select
                    value={assignments[order.id] || ""}
                    onValueChange={(value) =>
                      setAssignments((prev) => ({ ...prev, [order.id]: value }))
                    }
                  >
                    <SelectTrigger className="w-full md:w-56">
                      <SelectValue placeholder="Select staff" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredStaff.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.full_name || member.name || member.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button onClick={() => handleAssign(order.id)}>Assign</Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
