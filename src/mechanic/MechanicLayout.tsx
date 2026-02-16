import { useEffect, useMemo, useState } from "react";
import { NavLink, Navigate, Outlet, useNavigate } from "react-router-dom";
import {
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Truck,
  User,
  Wrench,
  Car,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import useStaffSession from "@/mechanic/useStaffSession";

export default function MechanicLayout() {
  const navigate = useNavigate();
  const { loading, session, user, profile } = useStaffSession();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const role = profile?.role || "staff";
  const staffName = profile?.full_name || user?.email || "Staff";

  const isMechanic = role === "junior_mechanic" || role === "senior_mechanic";
  const isPickupDriver = role === "pickup_driver";
  const isCarSeller = role === "car_seller";
  const isAdvisorOrAdmin = role === "service_advisor" || role === "admin";

  const menuItems = useMemo(
    () => [
      { label: "Dashboard", to: "/mechanic/dashboard", icon: LayoutDashboard },
      { label: "Profile", to: "/mechanic/profile", icon: User },
      ...(isMechanic ? [{ label: "Work Orders", to: "/mechanic/work-orders", icon: Wrench }] : []),
      ...(isPickupDriver ? [{ label: "Pickups", to: "/mechanic/pickups", icon: Truck }] : []),
      ...(isCarSeller ? [{ label: "Leads", to: "/mechanic/leads", icon: Car }] : []),
      ...(isAdvisorOrAdmin
        ? [{ label: "Assign Work Orders", to: "/mechanic/assign-work-orders", icon: ClipboardList }]
        : []),
    ],
    [isMechanic, isPickupDriver, isCarSeller, isAdvisorOrAdmin]
  );

  const handleLogout = async () => {
    setIsSigningOut(true);
    await supabase.auth.signOut();
    navigate("/mechanic/login");
  };

  useEffect(() => {
    if (!isSigningOut) {
      return;
    }
    const timeout = setTimeout(() => setIsSigningOut(false), 800);
    return () => clearTimeout(timeout);
  }, [isSigningOut]);

  if (loading || isSigningOut) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">
        Loading staff portal...
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/mechanic/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="flex min-h-screen flex-col md:flex-row">
        <aside className="w-full border-b border-border/60 bg-background/80 backdrop-blur md:w-64 md:border-b-0 md:border-r">
          <div className="flex items-center gap-3 px-5 py-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Wrench className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Staff Portal</p>
              <p className="text-base font-semibold text-foreground">{staffName}</p>
            </div>
          </div>

          <nav className="flex flex-col gap-2 px-3 pb-6">
            {menuItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  ].join(" ")
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}

            <Button
              type="button"
              variant="ghost"
              className="mt-2 flex w-full items-center justify-start gap-3 text-sm text-muted-foreground hover:text-foreground"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </nav>
        </aside>

        <main className="flex-1 px-6 py-8 md:px-10">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/60 bg-background/80 px-4 py-3 shadow-sm backdrop-blur">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Staff Portal</p>
              <p className="text-lg font-semibold text-foreground">
                {staffName}
              </p>
              <p className="text-xs text-muted-foreground">Role: {role}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
