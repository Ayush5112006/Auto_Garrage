import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Car, LogOut, Plus, Settings } from "lucide-react";

interface User {
  id?: number;
  name: string;
  email: string;
}

interface Booking {
  trackingId: string;
  name: string;
  email: string;
  phone: string;
  vehicle: string;
  services: Array<{ id: string; name?: string; price?: number }>;
  date: string;
  time: string;
  total: number;
  status: string;
  createdAt: string;
}

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("user");
    const userBookings = localStorage.getItem("bookings");

    if (!storedUser) {
      navigate("/login");
      return;
    }

    try {
      setUser(JSON.parse(storedUser));
      if (userBookings) {
        const allBookings = JSON.parse(userBookings);
        const userSpecificBookings = allBookings.filter(
          (b: Booking) => b.email === JSON.parse(storedUser).email
        );
        setBookings(userSpecificBookings);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      navigate("/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    navigate("/");
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "in progress":
        return "bg-purple-100 text-purple-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="pt-32 pb-24 bg-background">
          <div className="container mx-auto px-4 text-center">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-32 pb-24 bg-background">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="font-display text-4xl text-foreground mb-2">Dashboard</h1>
                <p className="text-muted-foreground">Welcome back, {user.name}!</p>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>

          {/* User Profile Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Name</p>
                  <p className="text-lg font-semibold">{user.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Email</p>
                  <p className="text-lg font-semibold break-all">{user.email}</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="mt-6 gap-2"
              >
                <Settings className="w-4 h-4" />
                Edit Profile
              </Button>
            </CardContent>
          </Card>

          {/* Booking History */}
          <div className="mb-8">
            <div className="flex items-center justify-between gap-4 mb-6">
              <h2 className="font-display text-2xl text-foreground">Booking History</h2>
              <Button onClick={() => navigate("/booking")} className="gap-2">
                <Plus className="w-4 h-4" />
                New Booking
              </Button>
            </div>

            {bookings.length > 0 ? (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <Card key={booking.trackingId} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="grid md:grid-cols-4 gap-4 mb-4">
                        {/* Tracking ID */}
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Tracking ID</p>
                          <p className="font-mono font-semibold text-primary">
                            {booking.trackingId}
                          </p>
                        </div>

                        {/* Date & Time */}
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Appointment</p>
                          <p className="font-semibold">
                            {new Date(booking.date).toLocaleDateString("en-IN")}
                          </p>
                          <p className="text-sm text-muted-foreground">{booking.time}</p>
                        </div>

                        {/* Services */}
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Services</p>
                          <div className="flex flex-wrap gap-1">
                            {booking.services.slice(0, 2).map((service, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {service.name || "Service"}
                              </Badge>
                            ))}
                            {booking.services.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{booking.services.length - 2}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Status & Total */}
                        <div className="flex items-center justify-between md:flex-col gap-2">
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                          <p className="font-display text-lg text-primary">
                            ₹{booking.total.toLocaleString("en-IN")}
                          </p>
                        </div>
                      </div>

                      {/* Action */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          localStorage.setItem("lastTrackingId", booking.trackingId);
                          navigate("/track");
                        }}
                        className="gap-2"
                      >
                        <Clock className="w-4 h-4" />
                        Track Booking
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Car className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Bookings Yet</h3>
                <p className="text-muted-foreground mb-6">
                  You haven't made any bookings yet. Start by booking a service!
                </p>
                <Button onClick={() => navigate("/booking")}>
                  Make Your First Booking
                </Button>
              </Card>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-4">
            <Button
              onClick={() => navigate("/garages")}
              variant="outline"
              className="h-auto py-6 flex-col gap-2"
            >
              <Car className="w-6 h-6" />
              Browse Garages
            </Button>
            <Button
              onClick={() => navigate("/booking")}
              variant="outline"
              className="h-auto py-6 flex-col gap-2"
            >
              <Calendar className="w-6 h-6" />
              New Booking
            </Button>
            <Button
              onClick={() => navigate("/track")}
              variant="outline"
              className="h-auto py-6 flex-col gap-2"
            >
              <Clock className="w-6 h-6" />
              Track Order
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
