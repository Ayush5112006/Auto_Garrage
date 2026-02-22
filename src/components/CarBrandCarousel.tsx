import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Car, Wrench } from "lucide-react";

const CarBrandCarousel = () => {
    const [currentCarIndex, setCurrentCarIndex] = useState(0);

    // Car brands carousel data
    const carBrands = [
        {
            name: "Ferrari",
            model: "458 Italia",
            description: "Italian luxury sports car",
            color: "#DC0000",
            gradient: "from-red-600 to-red-800",
            image: "/ferrari.png"
        },
        {
            name: "Audi",
            model: "R8 V10",
            description: "German engineering excellence",
            color: "#BB0A30",
            gradient: "from-gray-700 to-gray-900",
            image: "/audi.png"
        },
        {
            name: "Mercedes-Benz",
            model: "AMG GT",
            description: "Luxury performance vehicle",
            color: "#00ADEF",
            gradient: "from-blue-600 to-blue-800",
            image: "/mercedes.png"
        }
    ];

    return (
        <section className="py-24 bg-background">
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20">
                        Premium Brands
                    </Badge>
                    <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
                        Specialized Service for Luxury Brands
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Expert care for the world's most prestigious automotive brands
                    </p>
                </div>

                {/* Car Brands Carousel */}
                <Card className="overflow-hidden max-w-6xl mx-auto">
                    <CardContent className="p-0">
                        <div className="relative">
                            {/* Carousel Content */}
                            <div
                                className={`bg-gradient-to-r ${carBrands[currentCarIndex].gradient} p-12 md:p-16 transition-all duration-500`}
                            >
                                <div className="flex items-center justify-between">
                                    {/* Car Info */}
                                    <div className="text-white space-y-4">
                                        <Badge className="bg-white/20 text-white border-white/30 mb-2">
                                            Premium Brand
                                        </Badge>
                                        <h3 className="font-display text-4xl md:text-6xl font-bold">
                                            {carBrands[currentCarIndex].name}
                                        </h3>
                                        <p className="text-xl md:text-3xl font-semibold opacity-90">
                                            {carBrands[currentCarIndex].model}
                                        </p>
                                        <p className="text-base md:text-lg opacity-75 max-w-md">
                                            {carBrands[currentCarIndex].description}
                                        </p>
                                        <div className="flex gap-3 mt-6">
                                            <Button variant="secondary" className="gap-2" size="lg">
                                                <Wrench className="w-4 h-4" />
                                                Service This Brand
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Car 3D Image */}
                                    <div className="hidden lg:block">
                                        <div className="w-[500px] h-80 flex items-center justify-center">
                                            <img
                                                src={carBrands[currentCarIndex].image}
                                                alt={`${carBrands[currentCarIndex].name} ${carBrands[currentCarIndex].model}`}
                                                className="w-full h-full object-contain drop-shadow-2xl"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Navigation Arrows */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
                                onClick={() => setCurrentCarIndex((prev) =>
                                    prev === 0 ? carBrands.length - 1 : prev - 1
                                )}
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
                                onClick={() => setCurrentCarIndex((prev) =>
                                    prev === carBrands.length - 1 ? 0 : prev + 1
                                )}
                            >
                                <ChevronRight className="w-6 h-6" />
                            </Button>

                            {/* Carousel Indicators */}
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                                {carBrands.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentCarIndex(idx)}
                                        className={`w-2 h-2 rounded-full transition-all ${idx === currentCarIndex
                                            ? "bg-white w-8"
                                            : "bg-white/50 hover:bg-white/75"
                                            }`}
                                        aria-label={`Go to ${carBrands[idx].name}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Features Grid */}
                <div className="grid md:grid-cols-3 gap-6 mt-12 max-w-6xl mx-auto">
                    <Card className="text-center p-6 hover:shadow-lg transition-shadow">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Wrench className="w-6 h-6 text-primary" />
                        </div>
                        <h4 className="font-semibold text-lg mb-2">Expert Technicians</h4>
                        <p className="text-muted-foreground text-sm">
                            Certified specialists for luxury automotive brands
                        </p>
                    </Card>
                    <Card className="text-center p-6 hover:shadow-lg transition-shadow">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Car className="w-6 h-6 text-primary" />
                        </div>
                        <h4 className="font-semibold text-lg mb-2">Premium Parts</h4>
                        <p className="text-muted-foreground text-sm">
                            Genuine OEM parts for all luxury vehicles
                        </p>
                    </Card>
                    <Card className="text-center p-6 hover:shadow-lg transition-shadow">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ChevronRight className="w-6 h-6 text-primary" />
                        </div>
                        <h4 className="font-semibold text-lg mb-2">Fast Service</h4>
                        <p className="text-muted-foreground text-sm">
                            Quick turnaround without compromising quality
                        </p>
                    </Card>
                </div>
            </div>
        </section>
    );
};

export default CarBrandCarousel;
