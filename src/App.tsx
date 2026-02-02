import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import About from "./pages/About";
import Booking from "./pages/Booking";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ServicesPage from "./pages/ServicesPage";
import Admin from "./pages/Admin";
import Staff from "./pages/Staff";
import NotFound from "./pages/NotFound";
import Track from "./pages/Track";
import GarageListing from "./pages/GarageListing";
import GarageDetail from "./pages/GarageDetail";
import Dashboard from "./pages/Dashboard";
import MechanicDashboard from "./pages/MechanicDashboard";
import Pricing from "./pages/Pricing";
import ErrorBoundary from "./components/ErrorBoundary";
import DotPattern from "./components/ui/dot-pattern";
import { MainLayout } from "./components/MainLayout";

export default function App() {
  return (
    <ErrorBoundary>
      <DotPattern
        className="fixed inset-0 z-[50] pointer-events-none opacity-30 text-white fill-white"
        width={24}
        height={24}
        cx={1.5}
        cy={1.5}
        cr={1.5}
      />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/garages" element={<GarageListing />} />
            <Route path="/garage/:id" element={<GarageDetail />} />
            <Route path="/track" element={<Track />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/mechanic-dashboard" element={<MechanicDashboard />} />
            <Route path="/pricing" element={<Pricing />} />
          </Route>

          {/* Routes without Navbar/Transition if needed, or wrapped separately */}
          <Route path="/admin" element={<Admin />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
