import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/useAuth";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api-client";
import {
  Users,
  Calendar,
  Settings,
  Plus,
  Wrench,
  Store,
  ExternalLink,
  ClipboardList,
  UserPlus,
  Trash2,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
} from "lucide-react";
import Footer from "@/components/Footer";

type Staff = {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
};

type Booking = {
  id: string;
  trackingId: string;
  name: string;
  email: string;
  phone: string;
  vehicle: string;
  date: string;
  time: string;
  total: number;
  status: string;
  createdAt: string;
};

type Garage = {
  id: string;
  name: string;
  contactPhone: string | null;
  addressStreet: string | null;
  staff: Staff[];
  bookings: Booking[];
};

export default function GarageHostDashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [garage, setGarage] = useState<Garage | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "staff" | "bookings" | "settings">("overview");

  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    name: "",
    contactPhone: "",
    addressStreet: "",
  });

  const normalizeGarageData = (raw: Record<string, any>): Garage => ({
    id: String(raw.id ?? ""),
    name: String(raw.garage_name ?? raw.name ?? ""),
    contactPhone: String(raw.contact_phone ?? raw.contactPhone ?? ""),
    addressStreet: String(raw.location ?? raw.addressStreet ?? ""),
    staff: (raw.staff || []).map((s: any) => ({
      id: s.id,
      userId: s.user_id || s.userId,
      user: {
        id: s.user?.id,
        name: s.user?.name,
        email: s.user?.email,
        role: s.user?.role
      }
    })),
    bookings: (raw.bookings || []).map((b: any) => ({
      id: b.id,
      trackingId: b.tracking_id || b.trackingId || b.id.slice(0, 8),
      name: b.name || b.customer?.name || "Customer",
      email: b.email || b.customer?.email || "",
      phone: b.phone || b.customer?.phone || "",
      vehicle: b.vehicle || "Vehicle",
      date: b.service_date || b.date || "",
      time: b.time || "",
      total: Number(b.total_price || b.total || 0),
      status: b.status || "pending",
      createdAt: b.created_at || b.createdAt || ""
    }))
  });

  const loadData = async () => {
    try {
      const { data, error } = await api.getMyGarageApi();
      if (error) throw new Error(error);
      const normalized = normalizeGarageData(data);
      setGarage(normalized);
      setSettingsForm({
        name: normalized.name || "",
        contactPhone: normalized.contactPhone || "",
        addressStreet: normalized.addressStreet || "",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load garage data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGarageSettings = async () => {
    if (!garage?.id) return;

    setIsSavingSettings(true);
    try {
      const { error } = await api.updateGarageWithFallback(garage.id, {
        garage_name: settingsForm.name,
        contact_phone: settingsForm.contactPhone,
        location: settingsForm.addressStreet,
      });

      if (error) throw new Error(error);

      toast({ title: "Garage updated", description: "Garage profile settings saved." });
      await loadData();
    } catch (error: any) {
      toast({ title: "Save failed", description: error.message || "Unable to save settings", variant: "destructive" });
    } finally {
      setIsSavingSettings(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user || (user.role !== "manager" && user.role !== "admin")) {
      navigate("/garage/login");
      return;
    }
    loadData();
  }, [authLoading, user, navigate]);

  const handleAddStaff = async () => {
    if (!newStaffEmail.trim()) return;
    setIsAddingStaff(true);
    try {
      // 1. Find user by email
      const { data: users, error: userError } = await api.getUsersApi();
      if (userError) throw new Error(userError);

      const targetUser = users?.find((u: any) => u.email.toLowerCase() === newStaffEmail.toLowerCase());
      if (!targetUser) throw new Error("User not found with this email");

      // 2. Add to garage staff
      const { error: staffError } = await api.addGarageStaffApi(targetUser.id, garage!.id);
      if (staffError) throw new Error(staffError);

      toast({ title: "Staff added", description: `${targetUser.name} is now a mechanic at your garage.` });
      setNewStaffEmail("");
      loadData();
    } catch (error: any) {
      toast({ title: "Failed to add staff", description: error.message, variant: "destructive" });
    } finally {
      setIsAddingStaff(false);
    }
  };

  const handleUpdateBookingStatus = async (trackingId: string, status: string) => {
    try {
      const { error } = await api.updateBookingStatusApi(trackingId, status);
      if (error) throw new Error(error);
      toast({ title: "Status updated", description: `Booking ${trackingId} set to ${status}` });
      loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleRemoveStaff = async (staffUserId: string, staffName: string) => {
    if (!garage?.id) return;

    const confirmed = window.confirm(`Remove ${staffName} from this garage?`);
    if (!confirmed) return;

    try {
      const { error } = await api.removeGarageStaffApi(staffUserId, garage.id);
      if (error) throw new Error(error);
      toast({ title: "Staff removed", description: `${staffName} removed successfully.` });
      loadData();
    } catch (error: any) {
      toast({ title: "Failed to remove staff", description: error.message, variant: "destructive" });
    }
  };

  const stats = useMemo(() => {
    if (!garage) return { revenue: 0, completed: 0, pending: 0 };
    const revenue = garage.bookings.reduce((sum, b) => sum + (b.total || 0), 0);
    const completed = garage.bookings.filter(b => b.status === "completed").length;
    const pending = garage.bookings.filter(b => b.status === "pending").length;
    return { revenue, completed, pending };
  }, [garage]);

  if (loading) return null;
  if (!garage) return <div className="p-20 text-center">No garage found for your account.</div>;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 pt-24 pb-12">
        <div className="page-shell max-w-7xl">
          {/* Dashboard Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <div className="flex items-center gap-2 text-primary mb-2">
                <Store className="w-5 h-5" />
                <span className="text-sm font-bold uppercase tracking-[0.2em]">Garage Host Portal</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-display text-foreground tracking-tight">
                {garage.name}
              </h1>
              <p className="text-muted-foreground mt-2 max-w-xl">
                Managing your operations, staff, and customer bookings in one place.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" className="gap-2" onClick={() => navigate(`/garage/${garage.id}`)}>
                <ExternalLink className="w-4 h-4" />
                View Public Page
              </Button>
              <Button onClick={() => logout()} variant="destructive" className="gap-2">
                Sign Out
              </Button>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            <Card className="card-simple">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Revenue</p>
                    <p className="text-2xl font-bold">₹{stats.revenue.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-simple">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500">
                    <ClipboardList className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Completed</p>
                    <p className="text-2xl font-bold">{stats.completed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-simple">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-500">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pending Tasks</p>
                    <p className="text-2xl font-bold">{stats.pending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-simple">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Staff Count</p>
                    <p className="text-2xl font-bold">{garage.staff.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Dashboard Tabs */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1 space-y-2">
              <button
                onClick={() => setActiveTab("overview")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${activeTab === "overview" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "hover:bg-muted text-muted-foreground"
                  }`}
              >
                <Store className="w-4 h-4" />
                Overview
              </button>
              <button
                onClick={() => setActiveTab("bookings")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${activeTab === "bookings" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "hover:bg-muted text-muted-foreground"
                  }`}
              >
                <Calendar className="w-4 h-4" />
                Bookings
              </button>
              <button
                onClick={() => setActiveTab("staff")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${activeTab === "staff" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "hover:bg-muted text-muted-foreground"
                  }`}
              >
                <Users className="w-4 h-4" />
                Staff Management
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${activeTab === "settings" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "hover:bg-muted text-muted-foreground"
                  }`}
              >
                <Settings className="w-4 h-4" />
                Garage Settings
              </button>
            </div>

            {/* Content Area */}
            <div className="lg:col-span-3">
              {activeTab === "overview" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-bold">Recent Bookings</h2>
                    <Button variant="ghost" className="text-primary text-xs font-bold uppercase" onClick={() => setActiveTab("bookings")}>
                      View All
                    </Button>
                  </div>

                  <div className="grid gap-4">
                    {garage.bookings.length === 0 ? (
                      <p className="text-muted-foreground italic">No bookings found yet.</p>
                    ) : (
                      garage.bookings.slice(0, 5).map((booking) => (
                        <Card key={booking.id} className="card-simple hover:bg-muted/30 transition-colors">
                          <CardContent className="p-4 flex items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold uppercase py-0.5 px-2 bg-primary/20 text-primary rounded-full">
                                  {booking.trackingId}
                                </span>
                                <Badge variant={booking.status === "completed" ? "default" : "secondary"} className="text-[9px] uppercase font-bold px-2 py-0">
                                  {booking.status}
                                </Badge>
                              </div>
                              <h3 className="font-bold text-foreground">{booking.vehicle}</h3>
                              <p className="text-xs text-muted-foreground">{booking.name} • {new Date(booking.date).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-primary">₹{booking.total.toLocaleString()}</p>
                              <Button variant="ghost" size="sm" className="h-7 text-[10px] uppercase font-bold" onClick={() => navigate("/track")}>
                                Details
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === "staff" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <Card className="card-simple">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-primary" />
                        Add Staff Member
                      </CardTitle>
                      <CardDescription>Enter the user's email registered on Auto Garage to add them to your workshop.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex gap-4">
                      <Input
                        placeholder="mechanic@email.com"
                        value={newStaffEmail}
                        onChange={(e) => setNewStaffEmail(e.target.value)}
                        className="max-w-md"
                      />
                      <Button onClick={handleAddStaff} disabled={isAddingStaff}>
                        {isAddingStaff ? "Adding..." : "Add Staff"}
                      </Button>
                    </CardContent>
                  </Card>

                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold">Your Team</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {garage.staff.length === 0 ? (
                        <p className="text-muted-foreground italic col-span-2">No staff assigned yet.</p>
                      ) : (
                        garage.staff.map((s) => (
                          <Card key={s.id} className="card-simple border-l-4 border-l-primary group">
                            <CardContent className="p-4 flex items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-primary">
                                  {s.user.name[0]}
                                </div>
                                <div>
                                  <p className="font-bold">{s.user.name}</p>
                                  <p className="text-xs text-muted-foreground">{s.user.email}</p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleRemoveStaff(s.user.id, s.user.name || s.user.email)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "bookings" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-foreground">All Bookings</h2>
                  </div>

                  <div className="grid gap-4">
                    {garage.bookings.map((booking) => (
                      <Card key={booking.id} className="card-simple hover:border-primary/50 transition-all group">
                        <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="font-mono text-[10px] bg-muted">{booking.trackingId}</Badge>
                              <Badge variant={booking.status === "completed" ? "default" : booking.status === "cancelled" ? "destructive" : "secondary"} className="uppercase text-[9px] font-bold">
                                {booking.status}
                              </Badge>
                            </div>
                            <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{booking.vehicle}</h3>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2">
                              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {booking.name}</span>
                              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(booking.date).toLocaleDateString()}</span>
                              <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> ₹{booking.total.toLocaleString()}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 border-t md:border-t-0 pt-4 md:pt-0">
                            <select
                              className="h-9 px-3 rounded-md border text-xs font-bold uppercase bg-background"
                              value={booking.status}
                              onChange={(e) => handleUpdateBookingStatus(booking.trackingId, e.target.value)}
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="in progress">In Progress</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                            <Button size="sm" variant="outline" className="h-9 gap-2">
                              <Wrench className="w-4 h-4" />
                              Assign
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "settings" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h2 className="text-2xl font-bold">Garage Profile</h2>
                  <Card className="card-simple overflow-hidden">
                    <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/40" />
                    <CardContent className="p-6 -mt-12">
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="w-24 h-24 rounded-2xl bg-card border-4 border-background flex items-center justify-center text-4xl font-display text-primary shadow-xl">
                          {garage.name[0]}
                        </div>
                        <div className="flex-1 space-y-4 pt-6 md:pt-14">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold text-muted-foreground">Garage Name</label>
                              <Input
                                value={settingsForm.name}
                                onChange={(e) => setSettingsForm((prev) => ({ ...prev, name: e.target.value }))}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold text-muted-foreground">Contact Phone</label>
                              <Input
                                value={settingsForm.contactPhone}
                                onChange={(e) => setSettingsForm((prev) => ({ ...prev, contactPhone: e.target.value }))}
                              />
                            </div>
                            <div className="space-y-1 md:col-span-2">
                              <label className="text-[10px] uppercase font-bold text-muted-foreground">Address</label>
                              <Input
                                value={settingsForm.addressStreet}
                                onChange={(e) => setSettingsForm((prev) => ({ ...prev, addressStreet: e.target.value }))}
                              />
                            </div>
                          </div>
                          <Button className="mt-4" onClick={handleSaveGarageSettings} disabled={isSavingSettings}>
                            {isSavingSettings ? "Saving..." : "Save Changes"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
