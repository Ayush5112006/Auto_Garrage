import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import {
  Star,
  MapPin,
  Phone,
  Clock,
  Mail,
  Globe,
  ArrowRight,
  Edit,
  Save,
  X,
  BarChart3,
  DollarSign,
  Users,
  TrendingUp,
} from "lucide-react";
import { api } from "@/lib/api-client";

type Garage = {
  id: string;
  name: string;
  contactPhone: string;
  openTime: string;
  logoUrl: string;
  serviceImageUrl: string;
  addressCountry: string;
  addressState: string;
  addressStreet: string;
  services: string[];
  carRepairTypes: string[];
  paymentMethods: string[];
  mapUrl: string;
  mechanicsCount: number;
  sinceYear: number;
  problemsSolvedCount: number;
  sellsSecondHand: boolean;
  description: string;
  rating: number;
  reviews: number;
  createdAt: string;
};

type Analytics = {
  totalRevenue: number;
  totalBookings: number;
  completedBookings: number;
  pendingBookings: number;
  cancellations: number;
  averageOrderValue: number;
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
};

const fallbackImage = "https://images.unsplash.com/photo-1486262715619-67b519e0aeb4?w=800&h=400&fit=crop";
const apiOrigin = (() => {
  try {
    return new URL(import.meta.env.VITE_API_URL || "http://localhost:3001/api").origin;
  } catch {
    return "http://localhost:3001";
  }
})();

const resolveImageUrl = (value?: string | null) => {
  if (!value) return "";
  const cleaned = value.trim();
  if (!cleaned || cleaned.toLowerCase() === "null" || cleaned.toLowerCase() === "undefined") return "";
  if (/^(https?:|data:|blob:)/i.test(cleaned)) return cleaned;
  if (cleaned.startsWith("/")) return `${apiOrigin}${cleaned}`;
  return `${apiOrigin}/${cleaned}`;
};

const isProbablyImageUrl = (url: string) => {
  if (!url) return false;
  if (/^data:image\//i.test(url) || /^blob:/i.test(url)) return true;
  if (url.includes("/uploads/") || url.includes("/storage/v1/object/public/")) return true;
  return /\.(png|jpe?g|webp|gif|svg|avif)(\?|#|$)/i.test(url);
};

const normalizeGarage = (raw: Record<string, any>): Garage => ({
  id: String(raw.id ?? ""),
  name: String(raw.name ?? ""),
  contactPhone: String(raw.contact_phone ?? raw.contactPhone ?? ""),
  openTime: String(raw.open_time ?? raw.openTime ?? ""),
  logoUrl: String(raw.logo_url ?? raw.logoUrl ?? ""),
  serviceImageUrl: String(raw.service_image_url ?? raw.serviceImageUrl ?? ""),
  addressCountry: String(raw.address_country ?? raw.addressCountry ?? ""),
  addressState: String(raw.address_state ?? raw.addressState ?? ""),
  addressStreet: String(raw.address_street ?? raw.addressStreet ?? ""),
  services: Array.isArray(raw.services) ? raw.services : (raw.services ? String(raw.services).split(",") : []),
  carRepairTypes: Array.isArray(raw.car_repair_types)
    ? raw.car_repair_types
    : raw.carRepairTypes
      ? String(raw.carRepairTypes).split(",")
      : [],
  paymentMethods: Array.isArray(raw.payment_methods)
    ? raw.payment_methods
    : raw.paymentMethods
      ? String(raw.paymentMethods).split(",")
      : [],
  mapUrl: String(raw.map_url ?? raw.mapUrl ?? ""),
  mechanicsCount: Number(raw.mechanics_count ?? raw.mechanicsCount ?? 0) || 0,
  sinceYear: Number(raw.since_year ?? raw.sinceYear ?? 0) || 0,
  problemsSolvedCount: Number(raw.problems_solved_count ?? raw.problemsSolvedCount ?? 0) || 0,
  sellsSecondHand: Boolean(raw.sells_second_hand ?? raw.sellsSecondHand ?? false),
  description: String(raw.description ?? ""),
  rating: Number(raw.rating ?? 0) || 0,
  reviews: Number(raw.reviews ?? 0) || 0,
  createdAt: String(raw.created_at ?? raw.createdAt ?? ""),
});

const normalizeBooking = (raw: Record<string, any>): Booking => ({
  trackingId: String(raw.tracking_id ?? raw.trackingId ?? ""),
  name: String(raw.name ?? ""),
  email: String(raw.email ?? ""),
  phone: String(raw.phone ?? ""),
  vehicle: String(raw.vehicle ?? ""),
  date: String(raw.service_date ?? raw.date ?? ""),
  time: String(raw.time ?? ""),
  total: Number(raw.total ?? 0) || 0,
  status: String(raw.status ?? "pending"),
  createdAt: String(raw.created_at ?? raw.createdAt ?? ""),
});

const GarageDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [garage, setGarage] = useState<Garage | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const [editForm, setEditForm] = useState<Partial<Garage>>({});

  const loadGarageData = async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const [garageResult, analyticsResult, bookingsResult] = await Promise.all([
      api.getGarage(id),
      api.getGarageAnalytics(id),
      api.getGarageBookings(id),
    ]);

    if (garageResult.error) {
      setLoadError(garageResult.error);
      setGarage(null);
    } else {
      const normalized = normalizeGarage(garageResult.data as Record<string, any>);
      setGarage(normalized);
      setEditForm(normalized);
      setLoadError(null);
    }

    if (!analyticsResult.error && analyticsResult.data) {
      setAnalytics(analyticsResult.data as Analytics);
    }

    if (!bookingsResult.error && Array.isArray(bookingsResult.data)) {
      const normalized = bookingsResult.data.map((row) => normalizeBooking(row as Record<string, any>));
      setBookings(normalized);
    }

    setLoading(false);
  };

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      await loadGarageData();
      if (!mounted) return;
    };

    run();

    return () => {
      mounted = false;
    };
  }, [id]);

  const locationText = useMemo(() => {
    if (!garage) return "";
    return [garage.addressStreet, garage.addressState, garage.addressCountry].filter(Boolean).join(", ");
  }, [garage]);

  const updateEditField = (field: keyof Garage, value: any) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveChanges = async () => {
    if (!garage) return;

    setIsSaving(true);

    const updatePayload = {
      name: editForm.name,
      contactPhone: editForm.contactPhone,
      openTime: editForm.openTime,
      addressCountry: editForm.addressCountry,
      addressState: editForm.addressState,
      addressStreet: editForm.addressStreet,
      mapUrl: editForm.mapUrl,
      mechanicsCount: editForm.mechanicsCount,
      sinceYear: editForm.sinceYear,
      sellsSecondHand: editForm.sellsSecondHand,
      problemsSolvedCount: editForm.problemsSolvedCount,
      description: editForm.description,
    };

    const { error } = await api.updateGarageWithFallback(garage.id, updatePayload);

    if (error) {
      toast({
        title: "Save failed",
        description: error,
        variant: "destructive",
      });
      setIsSaving(false);
      return;
    }

    const updated = normalizeGarage({ ...garage, ...editForm } as Record<string, any>);
    setGarage(updated);
    setIsEditing(false);

    toast({
      title: "Garage updated",
      description: "Changes saved successfully.",
    });

    setIsSaving(false);
  };

  const deleteGarage = async () => {
    if (!garage) return;

    const confirmed = window.confirm("Delete this garage permanently?");
    if (!confirmed) return;

    setIsSaving(true);
    const { error } = await api.deleteGarageWithFallback(garage.id);

    if (error) {
      toast({
        title: "Delete failed",
        description: error,
        variant: "destructive",
      });
      setIsSaving(false);
      return;
    }

    toast({
      title: "Garage deleted",
      description: "This garage has been removed.",
    });

    navigate("/garages");
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <main className="pt-32 pb-24 bg-background">
          <div className="container mx-auto px-4 text-center text-muted-foreground">
            Loading garage details...
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!garage) {
    return (
      <div className="min-h-screen">
        <main className="pt-32 pb-24 bg-background">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl font-bold mb-4">Garage Not Found</h1>
            {loadError && <p className="text-sm text-destructive mb-4">{loadError}</p>}
            <Button onClick={() => navigate("/garages")}>Back to Garages</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <main className="pt-32 pb-24 bg-background">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="relative h-80 rounded-2xl overflow-hidden mb-8">
            <img
              src={(() => {
                if (isEditing && editForm.serviceImageUrl) {
                  const editImage = resolveImageUrl(String(editForm.serviceImageUrl));
                  return isProbablyImageUrl(editImage) ? editImage : fallbackImage;
                }

                const serviceImage = resolveImageUrl(garage.serviceImageUrl);
                const logoImage = resolveImageUrl(garage.logoUrl);
                if (isProbablyImageUrl(serviceImage)) return serviceImage;
                if (isProbablyImageUrl(logoImage)) return logoImage;
                return fallbackImage;
              })()}
              alt={garage.name}
              onError={(event) => {
                if (event.currentTarget.src !== fallbackImage) {
                  event.currentTarget.src = fallbackImage;
                }
              }}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col items-end justify-between p-8">
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowAnalytics(!showAnalytics)}
                  variant="secondary"
                  size="sm"
                  className="gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </Button>
              </div>
              <div className="text-white">
                {isEditing ? (
                  <Input
                    value={editForm.name || ""}
                    onChange={(e) => updateEditField("name", e.target.value)}
                    className="bg-white/20 border-white/30 text-white font-bold text-3xl mb-2"
                    placeholder="Garage name"
                  />
                ) : (
                  <h1 className="font-display text-4xl md:text-5xl mb-2">{garage.name}</h1>
                )}
                <div className="flex items-center gap-2">
                  {garage.rating ? (
                    <div className="flex items-center gap-1 bg-yellow-400 bg-opacity-90 px-3 py-1 rounded">
                      <Star className="w-5 h-5 fill-white text-white" />
                      <span className="font-bold">{garage.rating}</span>
                    </div>
                  ) : (
                    <Badge className="bg-white/20 text-white">New</Badge>
                  )}
                  {garage.reviews ? (
                    <span className="text-white/90">({garage.reviews} reviews)</span>
                  ) : (
                    <span className="text-white/90">No reviews yet</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Analytics Section */}
              {showAnalytics && analytics && (
                <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Performance Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="p-3 rounded-lg bg-white/50 dark:bg-slate-900">
                        <p className="text-xs text-muted-foreground mb-1">Total Revenue</p>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-primary" />
                          <p className="text-xl font-bold">₹{analytics.totalRevenue.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-white/50 dark:bg-slate-900">
                        <p className="text-xs text-muted-foreground mb-1">Avg Order Value</p>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-primary" />
                          <p className="text-xl font-bold">₹{Math.round(analytics.averageOrderValue).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-white/50 dark:bg-slate-900">
                        <p className="text-xs text-muted-foreground mb-1">Completion Rate</p>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-primary" />
                          <p className="text-xl font-bold">
                            {analytics.totalBookings > 0
                              ? Math.round((analytics.completedBookings / analytics.totalBookings) * 100)
                              : 0}
                            %
                          </p>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-white/50 dark:bg-slate-900">
                        <p className="text-xs text-muted-foreground">Total Bookings</p>
                        <p className="text-xl font-bold">{analytics.totalBookings}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-white/50 dark:bg-slate-900">
                        <p className="text-xs text-muted-foreground">Completed</p>
                        <p className="text-xl font-bold text-green-600">{analytics.completedBookings}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-white/50 dark:bg-slate-900">
                        <p className="text-xs text-muted-foreground">Pending</p>
                        <p className="text-xl font-bold text-orange-600">{analytics.pendingBookings}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle>About This Garage</CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <Textarea
                      value={editForm.description || ""}
                      onChange={(e) => updateEditField("description", e.target.value)}
                      placeholder="Garage description"
                      className="min-h-24"
                    />
                  ) : (
                    <p className="text-muted-foreground leading-relaxed">
                      {garage.description || "This garage has not added a description yet."}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Services */}
              <Card>
                <CardHeader>
                  <CardTitle>Services</CardTitle>
                  <CardDescription>Services offered by this garage</CardDescription>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <Input
                      value={(editForm.services || []).join(", ")}
                      onChange={(e) => updateEditField("services", e.target.value.split(", ").filter(Boolean))}
                      placeholder="Oil Change, Tire Repair, ..."
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {(garage.services || []).length > 0 ? (
                        (garage.services || []).map((service, index) => (
                          <Badge key={`${service}-${index}`} variant="secondary">
                            {service}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No services listed.</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Repair Types */}
              <Card>
                <CardHeader>
                  <CardTitle>Car Repair Types</CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <Input
                      value={(editForm.carRepairTypes || []).join(", ")}
                      onChange={(e) => updateEditField("carRepairTypes", e.target.value.split(", ").filter(Boolean))}
                      placeholder="Engine, Electrical, ..."
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {(garage.carRepairTypes || []).length > 0 ? (
                        (garage.carRepairTypes || []).map((type, index) => (
                          <Badge key={`${type}-${index}`} variant="secondary">
                            {type}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No repair types listed.</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Methods */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Methods</CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <Input
                      value={(editForm.paymentMethods || []).join(", ")}
                      onChange={(e) => updateEditField("paymentMethods", e.target.value.split(", ").filter(Boolean))}
                      placeholder="Cash, Card, UPI, ..."
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {(garage.paymentMethods || []).length > 0 ? (
                        (garage.paymentMethods || []).map((method, index) => (
                          <Badge key={`${method}-${index}`} variant="secondary">
                            {method}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No payment methods listed.</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Bookings */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Bookings</CardTitle>
                  <CardDescription>Latest service bookings for this garage</CardDescription>
                </CardHeader>
                <CardContent>
                  {bookings.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No bookings yet.</p>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {bookings.slice(0, 10).map((booking) => (
                        <div key={booking.trackingId} className="border rounded-lg p-3 text-sm">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium">{booking.trackingId}</p>
                            <Badge
                              variant={
                                booking.status === "completed"
                                  ? "default"
                                  : booking.status === "pending"
                                    ? "outline"
                                    : "secondary"
                              }
                            >
                              {booking.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">
                            {booking.name} • {booking.vehicle}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {booking.date} {booking.time}
                          </p>
                          <p className="text-sm font-medium mt-1">₹{booking.total.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Card */}
              <Card className="lg:sticky lg:top-32">
                <CardHeader>
                  <CardTitle className="text-lg">Contact & Hours</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    {isEditing ? (
                      <div className="text-sm space-y-2 flex-1">
                        <Input
                          value={editForm.addressStreet || ""}
                          onChange={(e) => updateEditField("addressStreet", e.target.value)}
                          placeholder="Street"
                          size={10}
                          className="text-xs"
                        />
                        <Input
                          value={editForm.addressState || ""}
                          onChange={(e) => updateEditField("addressState", e.target.value)}
                          placeholder="State"
                          size={10}
                          className="text-xs"
                        />
                        <Input
                          value={editForm.addressCountry || ""}
                          onChange={(e) => updateEditField("addressCountry", e.target.value)}
                          placeholder="Country"
                          size={10}
                          className="text-xs"
                        />
                      </div>
                    ) : (
                      <div className="text-sm">
                        <p className="font-medium">{locationText || "Location not set"}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    {isEditing ? (
                      <Input
                        value={editForm.contactPhone || ""}
                        onChange={(e) => updateEditField("contactPhone", e.target.value)}
                        placeholder="Phone number"
                        className="text-xs"
                      />
                    ) : garage.contactPhone ? (
                      <a href={`tel:${garage.contactPhone}`} className="text-sm font-medium hover:text-primary transition-colors">
                        {garage.contactPhone}
                      </a>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not provided</span>
                    )}
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    {isEditing ? (
                      <Input
                        value={editForm.openTime || ""}
                        onChange={(e) => updateEditField("openTime", e.target.value)}
                        placeholder="Opening hours"
                        className="text-xs"
                      />
                    ) : (
                      <div className="text-sm">
                        <p className="font-medium mb-1">{garage.openTime || "Hours not listed"}</p>
                        {garage.openTime && <Badge className="bg-green-500 text-white text-xs">Open Hours</Badge>}
                      </div>
                    )}
                  </div>

                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    {isEditing ? (
                      <Input
                        value={editForm.mapUrl || ""}
                        onChange={(e) => updateEditField("mapUrl", e.target.value)}
                        placeholder="Map URL"
                        className="text-xs"
                      />
                    ) : garage.mapUrl ? (
                      <a href={garage.mapUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:text-primary transition-colors">
                        Open Map
                      </a>
                    ) : (
                      <span className="text-sm text-muted-foreground">Map not provided</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Garage Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Garage Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mechanics</span>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editForm.mechanicsCount || 0}
                        onChange={(e) => updateEditField("mechanicsCount", Number(e.target.value))}
                        className="h-6 w-16 text-xs"
                        min={0}
                      />
                    ) : (
                      <span>{garage.mechanicsCount ?? "-"}</span>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Since Year</span>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editForm.sinceYear || 0}
                        onChange={(e) => updateEditField("sinceYear", Number(e.target.value))}
                        className="h-6 w-16 text-xs"
                        min={1990}
                        max={new Date().getFullYear()}
                      />
                    ) : (
                      <span>{garage.sinceYear ?? "-"}</span>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Problems Solved</span>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editForm.problemsSolvedCount || 0}
                        onChange={(e) => updateEditField("problemsSolvedCount", Number(e.target.value))}
                        className="h-6 w-16 text-xs"
                        min={0}
                      />
                    ) : (
                      <span>{garage.problemsSolvedCount ?? "-"}</span>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sells 2nd Hand</span>
                    {isEditing ? (
                      <Checkbox
                        checked={editForm.sellsSecondHand ?? false}
                        onCheckedChange={(checked) => updateEditField("sellsSecondHand", checked === true)}
                      />
                    ) : (
                      <span>{garage.sellsSecondHand ? "Yes" : "No"}</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button onClick={() => navigate("/booking")} className="w-full gap-2">
                  <Star className="w-4 h-4" />
                  Book Service
                </Button>
                <Button onClick={() => navigate("/garages")} variant="outline" className="w-full">
                  Back to Garages
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default GarageDetail;
