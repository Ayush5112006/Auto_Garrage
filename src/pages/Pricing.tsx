import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const servicePackages = [
    {
        name: "Standard Tune-Up",
        price: 150,
        description: "Essential maintenance for reliable performance.",
        features: [
            "Engine Oil Change",
            "Oil Filter Replacement",
            "Fluids Top-up",
            "Tire Pressure Check",
            "30-Point Inspection"
        ],
        recommended: false
    },
    {
        name: "Premium Service",
        price: 350,
        description: "Comprehensive care for your vehicle's longevity.",
        features: [
            "All Standard Tune-Up Features",
            "Air Filter Replacement",
            "Cabin Filter Replacement",
            "Brake Inspection & Clean",
            "Wheel Alignment Check",
            "Battery Health Test"
        ],
        recommended: true
    },
    {
        name: "Ultimate Performance",
        price: 600,
        description: "Complete overhaul for peak vehicle condition.",
        features: [
            "All Premium Service Features",
            "Spark Plug Replacement",
            "Fuel System Cleaning",
            "Transmission Fluid Exchange",
            "Coolant System Flush",
            "Detailed Vehicle Report"
        ],
        recommended: false
    }
];

const Pricing = () => {
    const [carType, setCarType] = useState("sedan");
    const [serviceLevel, setServiceLevel] = useState("basic");
    const [urgency, setUrgency] = useState([0]);

    const calculateEstimate = () => {
        let base = 50;
        if (serviceLevel === "basic") base += 100;
        if (serviceLevel === "intermediate") base += 250;
        if (serviceLevel === "advanced") base += 500;

        if (carType === "suv") base *= 1.2;
        if (carType === "luxury") base *= 1.5;
        if (carType === "truck") base *= 1.3;

        // Urgency multiplier (0-100slider)
        // 0 = standard, 100 = emergency (2x price)
        const urgencyMultiplier = 1 + (urgency[0] / 100);

        return Math.round(base * urgencyMultiplier);
    };

    return (
        <div className="min-h-screen bg-background pt-24 pb-12">
            <div className="container mx-auto px-4">

                {/* Header */}
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h1 className="font-display text-4xl md:text-5xl text-white mb-4">
                        Transparent <span className="text-gradient">Pricing</span>
                    </h1>
                    <p className="text-lg text-gray-400">
                        No hidden fees. Just honest work at fair prices. Choose a package or get a custom estimate below.
                    </p>
                </div>

                {/* Service Packages */}
                <div className="grid md:grid-cols-3 gap-8 mb-20">
                    {servicePackages.map((pkg) => (
                        <Card key={pkg.name} className={`relative border-border/50 bg-card/50 backdrop-blur-sm tech-button overflow-hidden ${pkg.recommended ? 'ring-2 ring-primary shadow-2xl shadow-primary/20' : ''}`}>
                            {pkg.recommended && (
                                <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-bold uppercase rounded-bl-lg">
                                    Recommended
                                </div>
                            )}
                            <CardHeader>
                                <CardTitle className="text-xl text-white">{pkg.name}</CardTitle>
                                <CardDescription>{pkg.description}</CardDescription>
                                <div className="mt-4">
                                    <span className="text-4xl font-bold text-white">${pkg.price}</span>
                                    <span className="text-gray-400">/visit</span>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3">
                                    {pkg.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                                            <Check className="w-4 h-4 text-garage-success mt-0.5" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" variant={pkg.recommended ? "default" : "outline"} asChild>
                                    <Link to="/booking">Book Now</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>

                {/* Cost Estimator */}
                <Card className="max-w-4xl mx-auto border-primary/20 bg-garage-dark/50 backdrop-blur-md overflow-hidden">
                    <div className="grid md:grid-cols-2">
                        <div className="p-8 border-r border-white/10">
                            <h2 className="text-2xl font-display text-white mb-6 flex items-center gap-2">
                                <Info className="w-5 h-5 text-primary" />
                                Quick Cost Estimator
                            </h2>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Vehicle Type</Label>
                                    <Select value={carType} onValueChange={setCarType}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="sedan">Sedan / Coupe</SelectItem>
                                            <SelectItem value="suv">SUV / Crossover</SelectItem>
                                            <SelectItem value="truck">Truck / Van</SelectItem>
                                            <SelectItem value="luxury">Luxury / Exotic</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Service Level</Label>
                                    <Select value={serviceLevel} onValueChange={setServiceLevel}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="basic">Basic Maintenance</SelectItem>
                                            <SelectItem value="intermediate">Major Repairs</SelectItem>
                                            <SelectItem value="advanced">Full Restoration</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label>Urgency</Label>
                                        <span className="text-xs text-muted-foreground">{urgency[0] > 50 ? "Expedited" : "Standard Turnaround"}</span>
                                    </div>
                                    <Slider
                                        value={urgency}
                                        onValueChange={setUrgency}
                                        max={100}
                                        step={10}
                                        className="py-4"
                                    />
                                    <p className="text-xs text-muted-foreground">Slide right for faster service (Rush fees apply)</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 flex flex-col items-center justify-center bg-primary/5 relative overflow-hidden">
                            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                            <div className="text-center relative z-10">
                                <p className="text-sm text-primary font-medium mb-2">ESTIMATED COST</p>
                                <div className="text-5xl font-display text-white mb-2">
                                    ${calculateEstimate()}
                                </div>
                                <p className="text-sm text-gray-400 max-w-[200px] mx-auto mb-8">
                                    *This is a rough estimate. Final price varies based on specific parts and labor hours.
                                </p>
                                <Button size="lg" className="w-full animate-pulse-glow" asChild>
                                    <Link to="/contact">Get Official Quote</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>

            </div>
        </div>
    );
};

export default Pricing;
