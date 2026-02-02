import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Wrench,
    Car,
    Clock,
    CheckCircle2,
    AlertCircle,
    Package,
    Users,
    TrendingUp,
    LogOut,
    Settings,
    Calendar
} from "lucide-react";

interface WorkOrder {
    id: string;
    vehicleInfo: string;
    customerName: string;
    serviceType: string;
    status: "pending" | "in-progress" | "completed" | "waiting-parts";
    priority: "low" | "medium" | "high";
    estimatedTime: string;
    assignedBay: number;
}

interface InventoryItem {
    id: string;
    partName: string;
    quantity: number;
    minStock: number;
    status: "in-stock" | "low-stock" | "out-of-stock";
}

const MechanicDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);

    // Sample work orders data
    const [workOrders] = useState<WorkOrder[]>([
        {
            id: "WO-001",
            vehicleInfo: "Honda Civic 2020",
            customerName: "Rajesh Kumar",
            serviceType: "Oil Change + Brake Inspection",
            status: "in-progress",
            priority: "high",
            estimatedTime: "2h",
            assignedBay: 3
        },
        {
            id: "WO-002",
            vehicleInfo: "Toyota Fortuner 2019",
            customerName: "Priya Sharma",
            serviceType: "Full Service",
            status: "pending",
            priority: "medium",
            estimatedTime: "4h",
            assignedBay: 1
        },
        {
            id: "WO-003",
            vehicleInfo: "Maruti Swift 2021",
            customerName: "Amit Patel",
            serviceType: "AC Repair",
            status: "waiting-parts",
            priority: "low",
            estimatedTime: "3h",
            assignedBay: 5
        }
    ]);

    // Sample inventory data
    const [inventory] = useState<InventoryItem[]>([
        { id: "INV-001", partName: "Engine Oil (5W-30)", quantity: 45, minStock: 20, status: "in-stock" },
        { id: "INV-002", partName: "Brake Pads", quantity: 8, minStock: 10, status: "low-stock" },
        { id: "INV-003", partName: "Air Filter", quantity: 0, minStock: 15, status: "out-of-stock" },
        { id: "INV-004", partName: "Spark Plugs", quantity: 32, minStock: 20, status: "in-stock" }
    ]);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) {
            navigate("/login");
            return;
        }
        try {
            setUser(JSON.parse(storedUser));
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
        switch (status) {
            case "in-progress":
                return "bg-blue-100 text-blue-800";
            case "pending":
                return "bg-yellow-100 text-yellow-800";
            case "completed":
                return "bg-green-100 text-green-800";
            case "waiting-parts":
                return "bg-orange-100 text-orange-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "high":
                return "bg-red-100 text-red-800";
            case "medium":
                return "bg-yellow-100 text-yellow-800";
            case "low":
                return "bg-green-100 text-green-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getInventoryColor = (status: string) => {
        switch (status) {
            case "in-stock":
                return "bg-green-100 text-green-800";
            case "low-stock":
                return "bg-yellow-100 text-yellow-800";
            case "out-of-stock":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen">
                <main className="pt-32 pb-24 bg-background">
                    <div className="container mx-auto px-4 text-center">
                        <p className="text-muted-foreground">Loading...</p>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    const stats = [
        { label: "Active Jobs", value: "12", icon: Wrench, color: "text-blue-600" },
        { label: "Completed Today", value: "8", icon: CheckCircle2, color: "text-green-600" },
        { label: "Pending", value: "5", icon: Clock, color: "text-yellow-600" },
        { label: "Low Stock Items", value: "3", icon: AlertCircle, color: "text-red-600" }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            <main className="pt-32 pb-24">
                <div className="container mx-auto px-4">
                    {/* Header */}
                    <div className="mb-12">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h1 className="font-display text-4xl text-foreground mb-2 flex items-center gap-3">
                                    <Wrench className="w-10 h-10 text-primary" />
                                    Mechanic Dashboard
                                </h1>
                                <p className="text-muted-foreground">Welcome back, {user.name}! Here's your workshop overview.</p>
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

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {stats.map((stat, idx) => (
                            <Card key={idx} className="hover:shadow-lg transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                                            <p className="text-3xl font-bold">{stat.value}</p>
                                        </div>
                                        <stat.icon className={`w-12 h-12 ${stat.color}`} />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Work Orders - Takes 2 columns */}
                        <div className="lg:col-span-2">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                <Car className="w-5 h-5" />
                                                Active Work Orders
                                            </CardTitle>
                                            <CardDescription>Current vehicles in the workshop</CardDescription>
                                        </div>
                                        <Button size="sm" className="gap-2">
                                            <Calendar className="w-4 h-4" />
                                            Schedule
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {workOrders.map((order) => (
                                            <Card key={order.id} className="border-l-4 border-l-primary">
                                                <CardContent className="p-4">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div>
                                                            <p className="font-mono font-semibold text-primary">{order.id}</p>
                                                            <p className="font-semibold text-lg">{order.vehicleInfo}</p>
                                                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                                <Users className="w-3 h-3" />
                                                                {order.customerName}
                                                            </p>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Badge className={getStatusColor(order.status)}>
                                                                {order.status.replace("-", " ")}
                                                            </Badge>
                                                            <Badge className={getPriorityColor(order.priority)}>
                                                                {order.priority}
                                                            </Badge>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                                        <div>
                                                            <p className="text-muted-foreground">Service</p>
                                                            <p className="font-semibold">{order.serviceType}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground">Est. Time</p>
                                                            <p className="font-semibold flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {order.estimatedTime}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground">Bay</p>
                                                            <p className="font-semibold">Bay #{order.assignedBay}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-2 mt-4">
                                                        <Button size="sm" variant="default" className="flex-1">
                                                            Update Status
                                                        </Button>
                                                        <Button size="sm" variant="outline" className="flex-1">
                                                            View Details
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar - Inventory & Quick Actions */}
                        <div className="space-y-6">
                            {/* Parts Inventory */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Package className="w-5 h-5" />
                                        Parts Inventory
                                    </CardTitle>
                                    <CardDescription>Stock status overview</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {inventory.map((item) => (
                                            <div key={item.id} className="border rounded-lg p-3">
                                                <div className="flex items-start justify-between mb-2">
                                                    <p className="font-semibold text-sm">{item.partName}</p>
                                                    <Badge className={getInventoryColor(item.status)} variant="secondary">
                                                        {item.status.replace("-", " ")}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                    <span>Qty: {item.quantity}</span>
                                                    <span>Min: {item.minStock}</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                                    <div
                                                        className={`h-2 rounded-full ${item.quantity >= item.minStock ? "bg-green-500" :
                                                                item.quantity > 0 ? "bg-yellow-500" : "bg-red-500"
                                                            }`}
                                                        style={{ width: `${Math.min((item.quantity / item.minStock) * 100, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <Button variant="outline" className="w-full mt-4 gap-2">
                                        <Package className="w-4 h-4" />
                                        Manage Inventory
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Quick Actions */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Quick Actions</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <Button variant="outline" className="w-full justify-start gap-2">
                                        <Car className="w-4 h-4" />
                                        New Work Order
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start gap-2">
                                        <TrendingUp className="w-4 h-4" />
                                        View Reports
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start gap-2">
                                        <Settings className="w-4 h-4" />
                                        Workshop Settings
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default MechanicDashboard;
