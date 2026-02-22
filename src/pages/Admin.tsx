import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api-client";
import { Building2, Mail, MapPin, Phone, Plus, Search, UserCog, Users } from "lucide-react";

type AdminOption =
  | "manage-garage"
  | "garage-wise-staff"
  | "manage-customer"
  | "manage-all-users"
  | "garage-contact";

type Garage = {
  id: string;
  name: string;
  contactPhone: string;
  addressState: string;
  addressCountry: string;
  mechanicsCount: number;
  mapUrl: string;
  openTime: string;
  description: string;
  createdAt: string;
};

type Booking = {
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
  userId: string;
};

type CustomerSummary = {
  email: string;
  name: string;
  phone: string;
  totalBookings: number;
  totalSpent: number;
  lastBookingAt: string;
};

const navOptions: Array<{ key: AdminOption; label: string }> = [
  { key: "manage-garage", label: "Manage Garage" },
  { key: "garage-wise-staff", label: "Garage Wise Staff" },
  { key: "manage-customer", label: "Manage User/Customer" },
  { key: "manage-all-users", label: "Manage All Users" },
  { key: "garage-contact", label: "Contact for All Garage" },
];

const bookingStatuses = ["pending", "confirmed", "in-progress", "completed", "cancelled"];
const DEFAULT_ADMIN_EMAIL = (import.meta.env.VITE_DEFAULT_ADMIN_EMAIL || "admin@garage.com").toLowerCase();

const normalizeGarage = (raw: Record<string, any>): Garage => ({
  id: String(raw.id ?? ""),
  name: String(raw.name ?? ""),
  contactPhone: String(raw.contactPhone ?? raw.contact_phone ?? ""),
  addressState: String(raw.addressState ?? raw.address_state ?? ""),
  addressCountry: String(raw.addressCountry ?? raw.address_country ?? ""),
  mechanicsCount: Number(raw.mechanicsCount ?? raw.mechanics_count ?? 0) || 0,
  mapUrl: String(raw.mapUrl ?? raw.map_url ?? ""),
  openTime: String(raw.openTime ?? raw.open_time ?? ""),
  description: String(raw.description ?? ""),
  createdAt: String(raw.createdAt ?? raw.created_at ?? ""),
});

const normalizeBooking = (raw: Record<string, any>): Booking => ({
  trackingId: String(raw.trackingId ?? raw.tracking_id ?? ""),
  name: String(raw.name ?? ""),
  email: String(raw.email ?? ""),
  phone: String(raw.phone ?? ""),
  vehicle: String(raw.vehicle ?? ""),
  date: String(raw.date ?? raw.service_date ?? ""),
  time: String(raw.time ?? ""),
  total: Number(raw.total ?? 0) || 0,
  status: String(raw.status ?? "pending"),
  createdAt: String(raw.createdAt ?? raw.created_at ?? ""),
  userId: String(raw.userId ?? raw.user_id ?? ""),
});

const toDateLabel = (value: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [activeOption, setActiveOption] = useState<AdminOption>("manage-garage");
  const [garages, setGarages] = useState<Garage[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingGarageId, setSavingGarageId] = useState<string | null>(null);
  const [deletingGarageId, setDeletingGarageId] = useState<string | null>(null);
  const [updatingTrackingId, setUpdatingTrackingId] = useState<string | null>(null);
  const [selectedCustomerEmail, setSelectedCustomerEmail] = useState<string>("");

  const [garageEdits, setGarageEdits] = useState<Record<string, Partial<Garage>>>({});
  const [contactEdits, setContactEdits] = useState<Record<string, Partial<Garage>>>({});
  const isAdminUser =
    !!user && (user.role === "admin" || user.email?.toLowerCase() === DEFAULT_ADMIN_EMAIL);

  const loadAdminData = async () => {
    setLoading(true);

    const [garageResult, bookingResult] = await Promise.all([api.getGarages(), api.getAdminBookings()]);

    const nextGarages = Array.isArray(garageResult.data)
      ? garageResult.data.map((row) => normalizeGarage(row as Record<string, any>))
      : [];

    const nextBookings = Array.isArray(bookingResult.data)
      ? bookingResult.data.map((row) => normalizeBooking(row as Record<string, any>))
      : [];

    setGarages(nextGarages);
    setBookings(nextBookings);

    if (nextBookings.length > 0 && !selectedCustomerEmail) {
      setSelectedCustomerEmail(nextBookings[0].email);
    }

    if (garageResult.error || bookingResult.error) {
      toast({
        title: "Some data could not load",
        description: garageResult.error || bookingResult.error || "Please refresh and try again.",
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user || !isAdminUser) {
      navigate("/admin/login", { replace: true });
      return;
    }

    loadAdminData();
  }, [authLoading, user, isAdminUser, navigate]);

  if (authLoading || !user || !isAdminUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">Checking admin session...</p>
      </div>
    );
  }

  const title = useMemo(() => {
    switch (activeOption) {
      case "manage-garage":
        return "Manage Garage";
      case "garage-wise-staff":
        return "Garage Wise Staff";
      case "manage-customer":
        return "Manage User / Customer";
      case "manage-all-users":
        return "Manage All Users";
      case "garage-contact":
        return "Contact for All Garage";
      default:
        return "Admin";
    }
  }, [activeOption]);

  const filteredGarages = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return garages;

    return garages.filter((garage) => {
      const stack = [garage.name, garage.addressState, garage.addressCountry, garage.contactPhone]
        .join(" ")
        .toLowerCase();
      return stack.includes(query);
    });
  }, [garages, search]);

  const filteredBookings = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return bookings;

    return bookings.filter((booking) => {
      const stack = [
        booking.trackingId,
        booking.name,
        booking.email,
        booking.phone,
        booking.vehicle,
        booking.status,
      ]
        .join(" ")
        .toLowerCase();
      return stack.includes(query);
    });
  }, [bookings, search]);

  const totalStaff = useMemo(
    () => garages.reduce((sum, garage) => sum + (garage.mechanicsCount || 0), 0),
    [garages]
  );

  const customerSummaries = useMemo(() => {
    const map = new Map<string, CustomerSummary>();

    for (const booking of filteredBookings) {
      const key = booking.email || `unknown-${booking.trackingId}`;
      const existing = map.get(key);

      if (!existing) {
        map.set(key, {
          email: booking.email || "unknown@example.com",
          name: booking.name || "Unknown Customer",
          phone: booking.phone || "",
          totalBookings: 1,
          totalSpent: booking.total || 0,
          lastBookingAt: booking.createdAt || booking.date,
        });
        continue;
      }

      existing.totalBookings += 1;
      existing.totalSpent += booking.total || 0;

      const currentDate = new Date(existing.lastBookingAt).getTime();
      const nextDate = new Date(booking.createdAt || booking.date).getTime();
      if (!Number.isNaN(nextDate) && (Number.isNaN(currentDate) || nextDate > currentDate)) {
        existing.lastBookingAt = booking.createdAt || booking.date;
      }

      if (!existing.phone && booking.phone) {
        existing.phone = booking.phone;
      }
    }

    return Array.from(map.values()).sort((a, b) => b.totalBookings - a.totalBookings);
  }, [filteredBookings]);

  const selectedCustomerBookings = useMemo(
    () => filteredBookings.filter((booking) => booking.email === selectedCustomerEmail),
    [filteredBookings, selectedCustomerEmail]
  );

  const usersList = useMemo(() => {
    const adminRow = {
      id: user?.id || "admin-local",
      name: user?.name || "Admin",
      email: user?.email || "admin@garage.com",
      role: "admin",
      source: "Auth",
    };

    const customerRows = customerSummaries.map((item, index) => ({
      id: `customer-${index + 1}`,
      name: item.name,
      email: item.email,
      role: "customer",
      source: `${item.totalBookings} bookings`,
    }));

    return [adminRow, ...customerRows];
  }, [customerSummaries, user]);

  const updateGarageEditField = (
    id: string,
    field: keyof Garage,
    value: string | number,
    mode: "garage" | "contact"
  ) => {
    if (mode === "garage") {
      setGarageEdits((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          [field]: value,
        },
      }));
      return;
    }

    setContactEdits((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const saveGaragePatch = async (
    id: string,
    patch: Record<string, unknown>,
    successTitle: string,
    successDescription: string
  ) => {
    setSavingGarageId(id);
    const { error } = await api.updateGarageWithFallback(id, patch);

    if (error) {
      toast({
        title: "Save failed",
        description: error,
        variant: "destructive",
      });
      setSavingGarageId(null);
      return;
    }

    setGarages((prev) =>
      prev.map((garage) => (garage.id === id ? { ...garage, ...(patch as Partial<Garage>) } : garage))
    );

    toast({
      title: successTitle,
      description: successDescription,
    });

    setSavingGarageId(null);
  };

  const deleteGarage = async (id: string) => {
    const confirmed = window.confirm("Delete this garage?");
    if (!confirmed) return;

    setDeletingGarageId(id);
    const { error } = await api.deleteGarageWithFallback(id);

    if (error) {
      toast({
        title: "Delete failed",
        description: error,
        variant: "destructive",
      });
      setDeletingGarageId(null);
      return;
    }

    setGarages((prev) => prev.filter((garage) => garage.id !== id));
    toast({ title: "Garage deleted", description: "Garage has been removed." });
    setDeletingGarageId(null);
  };

  const updateBookingStatus = async (trackingId: string, status: string) => {
    setUpdatingTrackingId(trackingId);
    const { error } = await api.updateBookingStatus(trackingId, status);

    if (error) {
      toast({ title: "Status update failed", description: error, variant: "destructive" });
      setUpdatingTrackingId(null);
      return;
    }

    setBookings((prev) => prev.map((item) => (item.trackingId === trackingId ? { ...item, status } : item)));
    toast({ title: "Booking updated", description: `Tracking ${trackingId} is now ${status}.` });
    setUpdatingTrackingId(null);
  };

  const renderSection = () => {
    if (loading) {
      return <p className="text-sm text-muted-foreground">Loading data...</p>;
    }

    if (activeOption === "manage-garage") {
      return (
        <div className="space-y-4">
          {filteredGarages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No garages found.</p>
          ) : (
            filteredGarages.map((garage) => {
              const draft = garageEdits[garage.id] || {};
              const name = String(draft.name ?? garage.name);
              const addressState = String(draft.addressState ?? garage.addressState);
              const addressCountry = String(draft.addressCountry ?? garage.addressCountry);

              return (
                <div key={garage.id} className="card-simple p-5 space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Garage Name</label>
                      <Input
                        value={name}
                        onChange={(event) => updateGarageEditField(garage.id, "name", event.target.value, "garage")}
                        placeholder="Garage name"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">State</label>
                      <Input
                        value={addressState}
                        onChange={(event) =>
                          updateGarageEditField(garage.id, "addressState", event.target.value, "garage")
                        }
                        placeholder="State"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Country</label>
                      <Input
                        value={addressCountry}
                        onChange={(event) =>
                          updateGarageEditField(garage.id, "addressCountry", event.target.value, "garage")
                        }
                        placeholder="Country"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50">
                    <p className="text-[10px] text-muted-foreground uppercase font-medium">Created: {toDateLabel(garage.createdAt)}</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={savingGarageId === garage.id}
                        onClick={() =>
                          saveGaragePatch(
                            garage.id,
                            { name, addressState, addressCountry },
                            "Garage updated",
                            "Garage details saved successfully."
                          )
                        }
                      >
                        {savingGarageId === garage.id ? "Saving..." : "Save"}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={deletingGarageId === garage.id}
                        onClick={() => deleteGarage(garage.id)}
                      >
                        {deletingGarageId === garage.id ? "Deleting..." : "Delete"}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      );
    }

    if (activeOption === "garage-wise-staff") {
      return (
        <div className="space-y-3">
          {filteredGarages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No garages found.</p>
          ) : (
            filteredGarages.map((garage) => {
              const draft = garageEdits[garage.id] || {};
              const mechanicsCount = Number(draft.mechanicsCount ?? garage.mechanicsCount) || 0;

              return (
                <div key={garage.id} className="card-simple p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{garage.name}</p>
                    <p className="text-xs text-muted-foreground">Assigned mechanics for this garage.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      className="w-24 h-9"
                      min={0}
                      value={mechanicsCount}
                      onChange={(event) =>
                        updateGarageEditField(
                          garage.id,
                          "mechanicsCount",
                          Number(event.target.value) || 0,
                          "garage"
                        )
                      }
                    />
                    <Button
                      size="sm"
                      onClick={() =>
                        saveGaragePatch(
                          garage.id,
                          { mechanicsCount },
                          "Staff count updated",
                          `${garage.name} staff count updated.`
                        )
                      }
                      disabled={savingGarageId === garage.id}
                    >
                      {savingGarageId === garage.id ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      );
    }

    if (activeOption === "manage-customer") {
      return (
        <div className="space-y-4">
          {customerSummaries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No customer records found.</p>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                {customerSummaries.map((customer) => (
                  <button
                    key={customer.email}
                    type="button"
                    onClick={() => setSelectedCustomerEmail(customer.email)}
                    className={`card-simple p-4 text-left transition-all ${selectedCustomerEmail === customer.email
                        ? "ring-2 ring-primary border-transparent bg-primary/5"
                        : ""
                      }`}
                  >
                    <p className="font-semibold text-foreground">{customer.name}</p>
                    <p className="text-xs text-muted-foreground">{customer.email}</p>
                    <div className="mt-3 flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <span className="bg-secondary px-2 py-0.5 rounded">{customer.totalBookings} bookings</span>
                      <span className="bg-secondary px-2 py-0.5 rounded">₹{customer.totalSpent.toLocaleString()}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="card-simple p-5 space-y-4 mt-6">
                <p className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Customer Bookings</p>
                {selectedCustomerBookings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No bookings for selected customer.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedCustomerBookings.map((booking) => (
                      <div
                        key={booking.trackingId}
                        className="rounded-lg border border-border p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-muted/30"
                      >
                        <div>
                          <p className="font-bold text-xs uppercase text-primary tracking-widest">{booking.trackingId}</p>
                          <p className="font-medium text-sm mt-1">{booking.vehicle}</p>
                          <p className="text-xs text-muted-foreground">
                            {toDateLabel(booking.date)} {booking.time}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="font-bold">₹{booking.total.toLocaleString()}</Badge>
                          <select
                            className="h-9 rounded-md border border-input bg-background px-3 text-xs font-medium"
                            value={booking.status}
                            onChange={(event) => updateBookingStatus(booking.trackingId, event.target.value)}
                            disabled={updatingTrackingId === booking.trackingId}
                          >
                            {bookingStatuses.map((status) => (
                              <option key={status} value={status}>
                                {status.toUpperCase()}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      );
    }

    if (activeOption === "manage-all-users") {
      return (
        <div className="space-y-3">
          {usersList.length === 0 ? (
            <p className="text-sm text-muted-foreground">No user records found.</p>
          ) : (
            usersList.map((item) => (
              <div key={`${item.role}-${item.email}`} className="card-simple p-4 flex items-center justify-between gap-3 bg-card">
                <div>
                  <p className="font-semibold text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={item.role === "admin" ? "default" : "secondary"} className="uppercase font-bold text-[10px]">
                    {item.role}
                  </Badge>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">{item.source}</p>
                </div>
              </div>
            ))
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {filteredGarages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No garages found.</p>
        ) : (
          filteredGarages.map((garage) => {
            const draft = contactEdits[garage.id] || {};
            const contactPhone = String(draft.contactPhone ?? garage.contactPhone);
            const mapUrl = String(draft.mapUrl ?? garage.mapUrl);

            return (
              <div key={garage.id} className="card-simple p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-lg text-foreground">{garage.name}</p>
                  <div className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" />
                    {[garage.addressState, garage.addressCountry].filter(Boolean).join(", ")}
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Phone Number</label>
                    <Input
                      value={contactPhone}
                      onChange={(event) => updateGarageEditField(garage.id, "contactPhone", event.target.value, "contact")}
                      placeholder="Phone number"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Map URL</label>
                    <Input
                      value={mapUrl}
                      onChange={(event) => updateGarageEditField(garage.id, "mapUrl", event.target.value, "contact")}
                      placeholder="Map URL"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  {mapUrl ? (
                    <Button variant="outline" size="sm" asChild>
                      <a href={mapUrl} target="_blank" rel="noreferrer">Open Map</a>
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    onClick={() =>
                      saveGaragePatch(
                        garage.id,
                        { contactPhone, mapUrl },
                        "Contact updated",
                        `${garage.name} contact info updated.`
                      )
                    }
                    disabled={savingGarageId === garage.id}
                  >
                    {savingGarageId === garage.id ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="mx-auto w-full max-w-7xl px-4">
          <div className="flex h-14 items-center gap-8 overflow-x-auto whitespace-nowrap scrollbar-hide">
            {navOptions.map((option) => {
              const isActive = activeOption === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setActiveOption(option.key)}
                  className={`text-xs font-bold uppercase tracking-[0.15em] transition-all duration-300 ${isActive ? "text-primary border-b-2 border-primary py-4 mt-0.5" : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 pt-8 pb-12">
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <Card className="border-none shadow-sm bg-muted/50">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Garages</p>
                <p className="text-2xl font-bold mt-1">{garages.length}</p>
              </div>
              <Building2 className="h-6 w-6 text-primary/60" />
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-muted/50">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Staff</p>
                <p className="text-2xl font-bold mt-1">{totalStaff}</p>
              </div>
              <Users className="h-6 w-6 text-primary/60" />
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-muted/50">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Users</p>
                <p className="text-2xl font-bold mt-1">{usersList.length}</p>
              </div>
              <UserCog className="h-6 w-6 text-primary/60" />
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-muted/50">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Bookings</p>
                <p className="text-2xl font-bold mt-1">{bookings.length}</p>
              </div>
              <Mail className="h-6 w-6 text-primary/60" />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
            <div className="flex w-full max-w-2xl items-center gap-3 md:justify-end">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search..."
                  className="pl-9 h-10 border-none bg-muted/50 focus-visible:ring-primary/30"
                />
              </div>
              {activeOption === "manage-garage" ? (
                <Button asChild className="h-10 whitespace-nowrap">
                  <Link to="/garage/add">
                    <Plus className="h-4 w-4" />
                    Add Garage
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
          {renderSection()}
        </div>
      </main>
    </div>
  );
};

export default Admin;
