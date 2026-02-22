import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import DotPattern from "./components/ui/dot-pattern";
import { MainLayout } from "./components/MainLayout";
import { AuthProvider } from "./context/AuthContext";
import { Loader2 } from "lucide-react";

// Lazy load pages
const Index = lazy(() => import("./pages/Index"));
const About = lazy(() => import("./pages/About"));
const Booking = lazy(() => import("./pages/Booking"));
const Contact = lazy(() => import("./pages/Contact"));
const Register = lazy(() => import("./pages/Register"));
const ServicesPage = lazy(() => import("./pages/ServicesPage"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const Staff = lazy(() => import("./pages/Staff"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Track = lazy(() => import("./pages/Track"));
const GarageListing = lazy(() => import("./pages/GarageListing"));
const GarageDetail = lazy(() => import("./pages/GarageDetail"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Pricing = lazy(() => import("./pages/Pricing"));
const AddGarage = lazy(() => import("./pages/AddGarage"));

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

export default function App() {
  return (
    <ErrorBoundary>
      {/* Background Car - Independent Suspense so it doesn't block the UI */}
      <Suspense fallback={<div className="fixed inset-0 bg-background z-[-1]" />}>
        <BackgroundRotatingCar />
      </Suspense>

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
        <AuthProvider>
          <div className="relative z-10">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route element={<MainLayout />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/services" element={<ServicesPage />} />
                  <Route path="/booking" element={<Booking />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/garages" element={<GarageListing />} />
                  <Route path="/garage/add" element={<AddGarage />} />
                  <Route path="/garage/:id" element={<GarageDetail />} />
                  <Route path="/track" element={<Track />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/pricing" element={<Pricing />} />
                </Route>

                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/staff" element={<Staff />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
