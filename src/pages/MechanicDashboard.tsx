import { useState, useEffect, useMemo } from "react";
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
import { useAuth } from "@/context/AuthContext";
import {
    getInventoryItems,
    getStaffProfile,
    getWorkOrdersForStaff,
    type InventoryItem,
    type StaffProfile,
    type WorkOrder,
} from "@/lib/staff";

const MechanicDashboard = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading, logout } = useAuth();
    const [profile, setProfile] = useState<StaffProfile | null>(null);
    const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        if (authLoading) {
            return;
        }

        if (!user) {
            navigate("/login");
            return;
        }

        let isMounted = true;
        setLoading(true);
        setErrorMessage("");

        Promise.all([
            getStaffProfile(user.id),
            getWorkOrdersForStaff(user.id),
            getInventoryItems(),
        ])
            .then(([staffProfile, orders, stock]) => {
                if (!isMounted) return;
                setProfile(staffProfile);
                setWorkOrders(orders);
                setInventory(stock);
            })
            .catch((error: any) => {
                if (!isMounted) return;
                setErrorMessage(error?.message || "Unable to load mechanic data.");
            })
            .finally(() => {
                if (!isMounted) return;
                setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [authLoading, navigate, user]);

    const handleLogout = () => {
        logout();
    };

    const getStatusColor = (status?: string | null) => {
        switch ((status || "").toLowerCase()) {
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

    const getPriorityColor = (priority?: string | null) => {
        switch ((priority || "").toLowerCase()) {
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

    const formatStatus = (value?: string | null) => {
        if (!value) return "Pending";
        return value
            .replace(/[_-]/g, " ")
            .toLowerCase()
            .replace(/\b\w/g, (m) => m.toUpperCase());
    };

    const getInventoryStatus = (item: InventoryItem) => {
        if (item.quantity <= 0) return "out-of-stock";
        if (item.quantity <= item.min_stock) return "low-stock";
        return "in-stock";
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

    const stats = useMemo(() => {
        const completedToday = workOrders.filter((order) => (order.status || "").toLowerCase() === "completed").length;
        const pending = workOrders.filter((order) => (order.status || "").toLowerCase() === "pending").length;
        const active = workOrders.filter((order) => (order.status || "").toLowerCase() === "in-progress").length;
        const lowStock = inventory.filter((item) => item.quantity <= item.min_stock).length;

        return [
            { label: "Active Jobs", value: `${active}`, icon: Wrench, color: "text-blue-600" },
            { label: "Completed Today", value: `${completedToday}`, icon: CheckCircle2, color: "text-green-600" },
            { label: "Pending", value: `${pending}`, icon: Clock, color: "text-yellow-600" },
            { label: "Low Stock Items", value: `${lowStock}`, icon: AlertCircle, color: "text-red-600" },
        ];
    }, [inventory, workOrders]);

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
                                <p className="text-muted-foreground">
                                    Welcome back, {profile?.full_name || profile?.name || user.email}! Here's your workshop overview.
                                </p>
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

                    {errorMessage ? (
                        <div className="mb-6 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                            {errorMessage}
                        </div>
                    ) : null}

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
                                        {loading ? (
                                            <p className="text-sm text-muted-foreground">Loading work orders...</p>
                                        ) : workOrders.length === 0 ? (
                                            <p className="text-sm text-muted-foreground">No work orders assigned.</p>
                                        ) : (
                                            workOrders.map((order) => (
                                            <Card key={order.id} className="border-l-4 border-l-primary">
                                                <CardContent className="p-4">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div>
                                                            <p className="font-mono font-semibold text-primary">{order.id}</p>
                                                            <p className="font-semibold text-lg">
                                                                {[order.vehicle_brand, order.vehicle_model, order.vehicle_no]
                                                                    .filter(Boolean)
                                                                    .join(" ") || "Vehicle"}
                                                            </p>
                                                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                                <Users className="w-3 h-3" />
                                                                {order.customer_name || "Customer"}
                                                            </p>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Badge className={getStatusColor(order.status)}>
                                                                {formatStatus(order.status)}
                                                            </Badge>
                                                            <Badge className={getPriorityColor(order.priority)}>
                                                                {order.priority ? formatStatus(order.priority) : "Medium"}
                                                            </Badge>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                                        <div>
                                                            <p className="text-muted-foreground">Service</p>
                                                            <p className="font-semibold">{order.service_type || "Service"}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground">Est. Time</p>
                                                            <p className="font-semibold flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {order.estimated_time || "-"}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground">Bay</p>
                                                            <p className="font-semibold">Bay #{order.assigned_bay ?? "-"}</p>
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
                                        )}
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
                                        {loading ? (
                                            <p className="text-sm text-muted-foreground">Loading inventory...</p>
                                        ) : inventory.length === 0 ? (
                                            <p className="text-sm text-muted-foreground">No inventory items found.</p>
                                        ) : (
                                            inventory.map((item) => {
                                                const status = getInventoryStatus(item);
                                                const ratio = item.min_stock > 0 ? (item.quantity / item.min_stock) * 100 : 0;
                                                return (
                                            <div key={item.id} className="border rounded-lg p-3">
                                                <div className="flex items-start justify-between mb-2">
                                                    <p className="font-semibold text-sm">{item.part_name}</p>
                                                    <Badge className={getInventoryColor(status)} variant="secondary">
                                                        {formatStatus(status)}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                    <span>Qty: {item.quantity}</span>
                                                    <span>Min: {item.min_stock}</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                                    <div
                                                        className={`h-2 rounded-full ${item.quantity >= item.min_stock ? "bg-green-500" :
                                                                item.quantity > 0 ? "bg-yellow-500" : "bg-red-500"
                                                            }`}
                                                        style={{ width: `${Math.min(ratio, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                            })
                                        )}
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
