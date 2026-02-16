import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import useStaffSession from "@/mechanic/useStaffSession";

export default function StaffProtectedRoute() {
  const { loading, session, profile } = useStaffSession();
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (session?.user && profile?.role === "customer") {
      setIsSigningOut(true);
      void supabase.auth.signOut().finally(() => {
        if (isMounted) {
          setIsSigningOut(false);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [session, profile?.role]);

  if (loading || isSigningOut) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">
        Checking access...
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/mechanic/login" replace />;
  }

  if (profile?.role === "customer") {
    return <Navigate to="/mechanic/login" replace />;
  }

  return <Outlet />;
}
