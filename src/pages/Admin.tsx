import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Users, Calendar, DollarSign, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Booking {
  id: number;
  customer: string;
  service: string;
  date: string;
  status: string;
}

interface StaffMember {
  id: number;
  name: string;
  role: string;
  email: string;
  status: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const [stats] = useState({
    totalBookings: 127,
    totalUsers: 256,
    totalRevenue: "$45,320",
    pendingServices: 12,
  });

  const [bookings, setBookings] = useState<Booking[]>([
    { id: 1, customer: "John Doe", service: "Oil Change", date: "2025-01-20", status: "Completed" },
    { id: 2, customer: "Jane Smith", service: "Brake Service", date: "2025-01-21", status: "Pending" },
    { id: 3, customer: "Bob Wilson", service: "Engine Repair", date: "2025-01-22", status: "In Progress" },
  ]);

  const [staff, setStaff] = useState<StaffMember[]>([
    { id: 1, name: "Mike Johnson", role: "Senior Mechanic", email: "mike@garage.com", status: "Active" },
    { id: 2, name: "Sarah Lee", role: "Technician", email: "sarah@garage.com", status: "Active" },
    { id: 3, name: "Tom Brown", role: "Apprentice", email: "tom@garage.com", status: "On Leave" },
  ]);

  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [openBookingDialog, setOpenBookingDialog] = useState(false);
  const [openStaffDialog, setOpenStaffDialog] = useState(false);

  const handleEditBooking = (booking: Booking) => {
    setEditingBooking(booking);
    setOpenBookingDialog(true);
  };

  const handleSaveBooking = () => {
    if (editingBooking) {
      setBookings(bookings.map(b => b.id === editingBooking.id ? editingBooking : b));
      setOpenBookingDialog(false);
      setEditingBooking(null);
    }
  };

  const handleEditStaff = (staffMember: StaffMember) => {
    setEditingStaff(staffMember);
    setOpenStaffDialog(true);
  };

  const handleSaveStaff = () => {
    if (editingStaff) {
      setStaff(staff.map(s => s.id === editingStaff.id ? editingStaff : s));
      setOpenStaffDialog(false);
      setEditingStaff(null);
    }
  };

  const handleLogout = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-32 pb-20">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-display text-primary-foreground mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage your auto garage operations</p>
          </div>
          <Button variant="destructive" onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="scale-rotate-3d shadow-3d">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-primary-foreground">{stats.totalBookings}</div>
                <Calendar className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="scale-rotate-3d shadow-3d">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-primary-foreground">{stats.totalUsers}</div>
                <Users className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="scale-rotate-3d shadow-3d">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-primary-foreground">{stats.totalRevenue}</div>
                <DollarSign className="w-8 h-8 text-garage-success opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="scale-rotate-3d shadow-3d">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-primary-foreground">{stats.pendingServices}</div>
                <BarChart3 className="w-8 h-8 text-garage-warning opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-card border border-border">
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="staff">Staff Management</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-4">
            <Card className="shadow-3d">
              <CardHeader>
                <CardTitle>Recent Bookings</CardTitle>
                <CardDescription>View and manage customer service bookings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Customer</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Service</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Date</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((booking) => (
                        <tr key={booking.id} className="border-b border-border/50 hover:bg-card/50">
                          <td className="py-3 px-4">{booking.customer}</td>
                          <td className="py-3 px-4">{booking.service}</td>
                          <td className="py-3 px-4">{booking.date}</td>
                          <td className="py-3 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              booking.status === "Completed" ? "bg-garage-success/20 text-garage-success" :
                              booking.status === "Pending" ? "bg-garage-warning/20 text-garage-warning" :
                              "bg-primary/20 text-primary"
                            }`}>
                              {booking.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <Dialog open={openBookingDialog && editingBooking?.id === booking.id} onOpenChange={setOpenBookingDialog}>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline" onClick={() => handleEditBooking(booking)}>Edit</Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit Booking</DialogTitle>
                                  <DialogDescription>Update booking status and details</DialogDescription>
                                </DialogHeader>
                                {editingBooking && (
                                  <div className="space-y-4">
                                    <div>
                                      <label className="text-sm font-medium text-primary-foreground">Status</label>
                                      <Select value={editingBooking.status} onValueChange={(value) => setEditingBooking({...editingBooking, status: value})}>
                                        <SelectTrigger className="mt-1">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="Pending">Pending</SelectItem>
                                          <SelectItem value="In Progress">In Progress</SelectItem>
                                          <SelectItem value="Completed">Completed</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <Button onClick={handleSaveBooking} className="w-full bg-primary hover:bg-primary/90">Save Changes</Button>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Staff Tab */}
          <TabsContent value="staff" className="space-y-4">
            <div className="flex justify-end mb-4">
              <Button className="bg-primary hover:bg-primary/90">Add Staff Member</Button>
            </div>
            <Card className="shadow-3d">
              <CardHeader>
                <CardTitle>Staff Members</CardTitle>
                <CardDescription>Manage team members and their roles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {staff.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 bg-card/50 rounded-lg border border-border/50 tilt-3d">
                      <div className="flex-1">
                        <p className="font-medium text-primary-foreground">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.role}</p>
                        <p className="text-xs text-muted-foreground mt-1">{member.email}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          member.status === "Active" ? "bg-garage-success/20 text-garage-success" : "bg-garage-warning/20 text-garage-warning"
                        }`}>
                          {member.status}
                        </span>
                        <Dialog open={openStaffDialog && editingStaff?.id === member.id} onOpenChange={setOpenStaffDialog}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" onClick={() => handleEditStaff(member)}>Edit</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Staff Member</DialogTitle>
                              <DialogDescription>Update staff status and information</DialogDescription>
                            </DialogHeader>
                            {editingStaff && (
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium text-primary-foreground">Status</label>
                                  <Select value={editingStaff.status} onValueChange={(value) => setEditingStaff({...editingStaff, status: value})}>
                                    <SelectTrigger className="mt-1">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Active">Active</SelectItem>
                                      <SelectItem value="On Leave">On Leave</SelectItem>
                                      <SelectItem value="Inactive">Inactive</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button onClick={handleSaveStaff} className="w-full bg-primary hover:bg-primary/90">Save Changes</Button>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card className="shadow-3d">
              <CardHeader>
                <CardTitle>Admin Settings</CardTitle>
                <CardDescription>Configure your garage management system</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-primary-foreground">Business Name</label>
                  <input 
                    type="text" 
                    defaultValue="Auto Garage" 
                    className="w-full px-4 py-2 rounded-lg bg-input border border-border text-primary-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-primary-foreground">Contact Email</label>
                  <input 
                    type="email" 
                    defaultValue="admin@autogarage.com"
                    className="w-full px-4 py-2 rounded-lg bg-input border border-border text-primary-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-primary-foreground">Phone Number</label>
                  <input 
                    type="tel"
                    defaultValue="(123) 456-7890"
                    className="w-full px-4 py-2 rounded-lg bg-input border border-border text-primary-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <Button className="bg-primary hover:bg-primary/90 w-full">Save Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
