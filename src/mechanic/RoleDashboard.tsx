import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MechanicWorkOrders from "@/mechanic/WorkOrders";
import AssignWorkOrders from "@/mechanic/AssignWorkOrders";

const readStaffSession = () => {
  const raw = localStorage.getItem("staff_session");
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as { id: string; name: string; role: string };
  } catch {
    return null;
  }
};

const RolePlaceholder = ({ title, body }: { title: string; body: string }) => (
  <Card className="border-border/60">
    <CardHeader>
      <CardTitle className="text-base">{title}</CardTitle>
    </CardHeader>
    <CardContent className="text-sm text-muted-foreground">{body}</CardContent>
  </Card>
);

export default function RoleDashboard() {
  const role = useMemo(() => readStaffSession()?.role || "staff", []);

  if (role === "service_advisor" || role === "admin") {
    return <AssignWorkOrders />;
  }

  if (role === "junior_mechanic" || role === "senior_mechanic") {
    return <MechanicWorkOrders />;
  }

  if (role === "pickup_driver") {
    return (
      <RolePlaceholder
        title="Pickup Queue"
        body="Pickup assignments will appear here once dispatch is enabled."
      />
    );
  }

  if (role === "car_seller") {
    return (
      <RolePlaceholder
        title="Sales Leads"
        body="New sales leads will appear here when lead capture is enabled."
      />
    );
  }

  return (
    <RolePlaceholder
      title="Staff Dashboard"
      body="Your role does not have a custom dashboard yet."
    />
  );
}
