import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Suspense, lazy } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import DotPattern from "./components/ui/dot-pattern";
import { MainLayout } from "./components/MainLayout";
import Navbar from "./components/Navbar";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/useAuth";
import { Loader2 } from "lucide-react";
import { Navigate } from "react-router-dom";
import { GlobalShortcuts } from "./components/GlobalShortcuts";
import { RouteChangeProgress } from "./components/RouteChangeProgress";

// Lazy load pages
const Index = lazy(() => import("./pages/Index"));
const About = lazy(() => import("./pages/About"));
const Booking = lazy(() => import("./pages/Booking"));
const Contact = lazy(() => import("./pages/Contact"));
const Register = lazy(() => import("./pages/Register"));
const ServicesPage = lazy(() => import("./pages/ServicesPage"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const MechanicDashboard = lazy(() => import("./pages/MechanicDashboard"));
const StaffLogin = lazy(() => import("./pages/StaffLogin"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Track = lazy(() => import("./pages/Track"));
const GarageListing = lazy(() => import("./pages/GarageListing"));
const GarageDetail = lazy(() => import("./pages/GarageDetail"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Pricing = lazy(() => import("./pages/Pricing"));
const AddGarage = lazy(() => import("./pages/AddGarage"));
const GarageHost = lazy(() => import("./pages/GarageHost"));
const AddStaff = lazy(() => import("./pages/AddStaff"));
const GarageLogin = lazy(() => import("./pages/GarageLogin"));
const CustomerLogin = lazy(() => import("./pages/CustomerLogin"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

// Background component loaded separately
const BackgroundRotatingCar = lazy(() => import("./components/BackgroundRotatingCar"));

const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse" />
      </div>
      <p className="text-xs font-bold text-primary uppercase tracking-[0.3em] animate-pulse">Initializing System</p>
    </div>
  </div>
);

const RequireAuth = ({ children, redirectTo = "/register" }: { children: JSX.Element; redirectTo?: string }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

const RequireAdmin = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (String(user.role || "").toLowerCase() !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
};

const RequireRole = ({ children, roles, redirectTo = "/" }: { children: JSX.Element; roles: string[]; redirectTo?: string }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  const normalizedRole = String(user.role || "").toLowerCase();
  if (!roles.map((role) => role.toLowerCase()).includes(normalizedRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const GuestOnly = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    return children;
  }

  const role = String(user.role || "").toLowerCase();
  if (role === "admin") return <Navigate to="/admin" replace />;
  if (role === "staff" || role === "mechanic") return <Navigate to="/staff" replace />;
  if (role === "manager") return <Navigate to="/garagehost" replace />;
  return <Navigate to="/dashboard" replace />;
};

const BackgroundLayer = () => {
  const { pathname } = useLocation();

  const noCanvasBackground =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/staff") ||
    pathname.startsWith("/garagehost") ||
    pathname.startsWith("/garage/staff") ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/garage/login";

  if (pathname === "/services" || noCanvasBackground) {
    return <div className="fixed inset-0 bg-background z-[-1]" />;
  }

  return (
    <Suspense fallback={<div className="fixed inset-0 bg-background z-[-1]" />}>
      <BackgroundRotatingCar />
    </Suspense>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      {/* White Dot Pattern */}
      <DotPattern
        className="fixed inset-0 z-[1] pointer-events-none opacity-20 text-white fill-white"
        width={24}
        height={24}
        cx={1.5}
        cy={1.5}
        cr={1.5}
      />

      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <BackgroundLayer />
        <AuthProvider>
          <div className="relative z-10">
            <RouteChangeProgress />
            <GlobalShortcuts />
            <Navbar />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route element={<MainLayout />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/services" element={<ServicesPage />} />
                  <Route
                    path="/booking"
                    element={
                      <RequireAuth>
                        <Booking />
                      </RequireAuth>
                    }
                  />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/garages" element={<GarageListing />} />
                  <Route
                    path="/garagehost"
                    element={
                      <RequireRole roles={["manager", "admin"]} redirectTo="/garage/login">
                        <GarageHost />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/garage/add"
                    element={
                      <RequireAuth>
                        <AddGarage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/garage/staff/add"
                    element={
                      <RequireAuth>
                        <AddStaff />
                      </RequireAuth>
                    }
                  />
                  <Route path="/garage/:id" element={<GarageDetail />} />
                  <Route
                    path="/track"
                    element={
                      <RequireAuth>
                        <Track />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/register"
                    element={
                      <GuestOnly>
                        <Register />
                      </GuestOnly>
                    }
                  />
                  <Route
                    path="/dashboard"
                    element={
                      <RequireAuth>
                        <Dashboard />
                      </RequireAuth>
                    }
                  />
                  <Route path="/pricing" element={<Pricing />} />
                </Route>

                <Route
                  path="/login"
                  element={
                    <GuestOnly>
                      <CustomerLogin />
                    </GuestOnly>
                  }
                />
                <Route
                  path="/forgot-password"
                  element={
                    <GuestOnly>
                      <ForgotPassword />
                    </GuestOnly>
                  }
                />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route
                  path="/admin/login"
                  element={
                    <GuestOnly>
                      <AdminLogin />
                    </GuestOnly>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <RequireAdmin>
                      <Admin />
                    </RequireAdmin>
                  }
                />
                <Route
                  path="/garage/login"
                  element={
                    <GuestOnly>
                      <GarageLogin />
                    </GuestOnly>
                  }
                />
                <Route
                  path="/staff/login"
                  element={
                    <GuestOnly>
                      <StaffLogin />
                    </GuestOnly>
                  }
                />
                <Route
                  path="/staff"
                  element={
                    <RequireRole roles={["staff", "mechanic", "admin"]} redirectTo="/staff/login">
                      <MechanicDashboard />
                    </RequireRole>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
