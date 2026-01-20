import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, CheckCircle, AlertCircle, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const Staff = () => {
  const navigate = useNavigate();
  const [staffMember] = useState({
    name: "Mike Johnson",
    role: "Senior Mechanic",
    email: "mike@garage.com",
    id: "STF-001",
  });

  const [todayTasks] = useState([
    { id: 1, service: "Oil Change", customer: "John Doe", time: "09:00 AM", status: "Completed" },
    { id: 2, service: "Brake Service", customer: "Jane Smith", time: "10:30 AM", status: "In Progress" },
    { id: 3, service: "Engine Inspection", customer: "Bob Wilson", time: "01:00 PM", status: "Pending" },
    { id: 4, service: "Tire Replacement", customer: "Alice Brown", time: "03:00 PM", status: "Pending" },
  ]);

  const [timeLog] = useState([
    { date: "2025-01-19", clockIn: "08:00 AM", clockOut: "05:00 PM", hours: "9" },
    { date: "2025-01-18", clockIn: "08:30 AM", clockOut: "05:30 PM", hours: "9" },
    { date: "2025-01-17", clockIn: "08:00 AM", clockOut: "04:30 PM", hours: "8.5" },
  ]);

  const [performances] = useState([
    { metric: "Services Completed", value: "156", trend: "+12%" },
    { metric: "Customer Satisfaction", value: "4.8/5", trend: "+0.2" },
    { metric: "Punctuality Rate", value: "98%", trend: "+5%" },
  ]);

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
            <h1 className="text-4xl font-display text-primary-foreground mb-2">Staff Portal</h1>
            <p className="text-muted-foreground">Welcome, {staffMember.name}</p>
          </div>
          <Button variant="destructive" onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>

        {/* Profile Card */}
        <Card className="mb-8 scale-rotate-3d shadow-3d">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Staff ID</p>
                <p className="text-2xl font-bold text-primary-foreground mb-4">{staffMember.id}</p>
                <p className="text-primary-foreground font-medium">{staffMember.name}</p>
                <p className="text-muted-foreground">{staffMember.role}</p>
                <p className="text-sm text-muted-foreground mt-2">{staffMember.email}</p>
              </div>
              <div className="text-right">
                <div className="inline-block bg-primary/20 px-6 py-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="text-lg font-bold text-garage-success">On Duty</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {performances.map((perf, idx) => (
            <Card key={idx} className="scale-rotate-3d shadow-3d">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{perf.metric}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold text-primary-foreground">{perf.value}</div>
                  <div className="text-sm text-garage-success font-medium">{perf.trend}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="tasks" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-card border border-border">
            <TabsTrigger value="tasks">Today's Tasks</TabsTrigger>
            <TabsTrigger value="timelog">Time Log</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          {/* Today's Tasks Tab */}
          <TabsContent value="tasks" className="space-y-4">
            <Card className="shadow-3d">
              <CardHeader>
                <CardTitle>Today's Service Tasks</CardTitle>
                <CardDescription>Your scheduled services for today</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {todayTasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-4 bg-card/50 rounded-lg border border-border/50 tilt-3d hover:bg-card/70 transition">
                      <div className="flex items-center gap-4 flex-1">
                        {task.status === "Completed" && <CheckCircle className="w-5 h-5 text-garage-success" />}
                        {task.status === "In Progress" && <Clock className="w-5 h-5 text-primary animate-spin" />}
                        {task.status === "Pending" && <AlertCircle className="w-5 h-5 text-garage-warning" />}
                        <div>
                          <p className="font-medium text-primary-foreground">{task.service}</p>
                          <p className="text-sm text-muted-foreground">{task.customer} • {task.time}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        task.status === "Completed" ? "bg-garage-success/20 text-garage-success" :
                        task.status === "In Progress" ? "bg-primary/20 text-primary" :
                        "bg-garage-warning/20 text-garage-warning"
                      }`}>
                        {task.status}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Time Log Tab */}
          <TabsContent value="timelog" className="space-y-4">
            <div className="flex gap-4 mb-6">
              <Button className="bg-garage-success hover:bg-garage-success/90">Clock In</Button>
              <Button variant="outline" className="border-primary-foreground/20">Clock Out</Button>
            </div>
            <Card className="shadow-3d">
              <CardHeader>
                <CardTitle>Time Log History</CardTitle>
                <CardDescription>Your recent clock in/out records</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Date</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Clock In</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Clock Out</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Hours Worked</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timeLog.map((log, idx) => (
                        <tr key={idx} className="border-b border-border/50 hover:bg-card/50">
                          <td className="py-3 px-4">{log.date}</td>
                          <td className="py-3 px-4">{log.clockIn}</td>
                          <td className="py-3 px-4">{log.clockOut}</td>
                          <td className="py-3 px-4 font-medium">{log.hours}h</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <Card className="shadow-3d">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-primary-foreground">Full Name</label>
                    <input 
                      type="text" 
                      defaultValue={staffMember.name}
                      className="w-full px-4 py-2 rounded-lg bg-input border border-border text-primary-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-primary-foreground">Email</label>
                    <input 
                      type="email" 
                      defaultValue={staffMember.email}
                      className="w-full px-4 py-2 rounded-lg bg-input border border-border text-primary-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-primary-foreground">Role</label>
                    <input 
                      type="text" 
                      defaultValue={staffMember.role}
                      disabled
                      className="w-full px-4 py-2 rounded-lg bg-input border border-border text-primary-foreground/50 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-primary-foreground">Staff ID</label>
                    <input 
                      type="text" 
                      defaultValue={staffMember.id}
                      disabled
                      className="w-full px-4 py-2 rounded-lg bg-input border border-border text-primary-foreground/50 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-primary-foreground">Change Password</label>
                  <input 
                    type="password" 
                    placeholder="Enter new password"
                    className="w-full px-4 py-2 rounded-lg bg-input border border-border text-primary-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <Button className="bg-primary hover:bg-primary/90 w-full">Update Profile</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Staff;
