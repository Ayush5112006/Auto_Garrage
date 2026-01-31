import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Phone, Clock, ArrowRight, Search } from "lucide-react";
import { TiltCard } from "@/components/ui/tilt-card";
import { GlitchText } from "@/components/ui/glitch-text";

interface Garage {
  id: number;
  name: string;
  location: string;
  phone: string;
  rating: number;
  reviews: number;
  image: string;
  services: string[];
  openTime: string;
  isOpen: boolean;
}

const garageData: Garage[] = [
  {
    id: 1,
    name: "AutoCare Premium",
    location: "Mumbai, Maharashtra",
    phone: "+91 98765 43210",
    rating: 4.8,
    reviews: 234,
    image: "https://images.unsplash.com/photo-1486262715619-67b519e0aeb4?w=500&h=300&fit=crop",
    services: ["Oil Change", "Brake Service", "AC Service"],
    openTime: "08:00 AM - 08:00 PM",
    isOpen: true,
  },
  {
    id: 2,
    name: "Quick Fix Auto Hub",
    location: "Delhi, NCR",
    phone: "+91 87654 32109",
    rating: 4.6,
    reviews: 189,
    image: "https://images.unsplash.com/photo-1487700492518-7921c3307bbe?w=500&h=300&fit=crop",
    services: ["Tire Services", "Engine Repair", "Car Wash"],
    openTime: "07:00 AM - 09:00 PM",
    isOpen: true,
  },
  {
    id: 3,
    name: "Expert Mechanics Garage",
    location: "Bangalore, Karnataka",
    phone: "+91 76543 21098",
    rating: 4.7,
    reviews: 156,
    image: "https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=500&h=300&fit=crop",
    services: ["Engine Repair", "Oil Change", "Brake Service"],
    openTime: "08:30 AM - 07:30 PM",
    isOpen: true,
  },
  {
    id: 4,
    name: "Shine & Drive",
    location: "Pune, Maharashtra",
    phone: "+91 65432 10987",
    rating: 4.5,
    reviews: 142,
    image: "https://images.unsplash.com/photo-1507541957570-b8161f06210a?w=500&h=300&fit=crop",
    services: ["Car Wash & Detail", "Tire Services", "AC Service"],
    openTime: "09:00 AM - 07:00 PM",
    isOpen: true,
  },
  {
    id: 5,
    name: "TurboFix Service Center",
    location: "Hyderabad, Telangana",
    phone: "+91 54321 09876",
    rating: 4.9,
    reviews: 267,
    image: "https://images.unsplash.com/photo-1486262715619-67b519e0aeb4?w=500&h=300&fit=crop",
    services: ["All Services", "Engine Diagnostic", "Custom Repairs"],
    openTime: "08:00 AM - 09:00 PM",
    isOpen: true,
  },
  {
    id: 6,
    name: "Professional Car Care",
    location: "Chennai, Tamil Nadu",
    phone: "+91 43210 98765",
    rating: 4.4,
    reviews: 128,
    image: "https://images.unsplash.com/photo-1487700492518-7921c3307bbe?w=500&h=300&fit=crop",
    services: ["Oil Change", "Car Wash", "Brake Service"],
    openTime: "08:00 AM - 08:00 PM",
    isOpen: true,
  },
];

const GarageListing = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const filteredGarages = garageData.filter(
    (garage) =>
      garage.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      garage.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      <main className="pt-32 pb-24 bg-background">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-primary font-medium text-sm uppercase tracking-wider">Find Your Garage</span>
            <h1 className="font-display text-4xl md:text-5xl text-foreground mt-3 mb-4">
              <GlitchText text="BROWSE GARAGES" className="text-foreground" speed={40} />
            </h1>
            <p className="text-muted-foreground">
              Choose from our network of trusted and verified auto repair centers across India.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search garage name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 py-6 text-base"
              />
            </div>
          </div>

          {/* Results Info */}
          <div className="mb-8">
            <p className="text-muted-foreground">
              Showing {filteredGarages.length} garage{filteredGarages.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Garage Grid */}
          {filteredGarages.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

              {filteredGarages.map((garage) => (
                <TiltCard key={garage.id} className="h-full">
                  <Card
                    className="overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full bg-card/80 backdrop-blur-sm border-white/10"
                  >
                    {/* Image */}
                    <div className="relative h-48 bg-muted overflow-hidden">
                      <img
                        src={garage.image}
                        alt={garage.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                      {garage.isOpen && (
                        <Badge className="absolute top-4 right-4 bg-green-500 text-white">Open Now</Badge>
                      )}
                    </div>

                    {/* Content */}
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-start justify-between gap-2">
                        <span className="text-lg">{garage.name}</span>
                        <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-semibold">{garage.rating}</span>
                        </div>
                      </CardTitle>
                      <CardDescription className="text-xs">
                        ({garage.reviews} reviews)
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="flex-1 space-y-3">
                      {/* Location */}
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{garage.location}</span>
                      </div>

                      {/* Phone */}
                      <div className="flex items-start gap-2">
                        <Phone className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{garage.phone}</span>
                      </div>

                      {/* Time */}
                      <div className="flex items-start gap-2">
                        <Clock className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{garage.openTime}</span>
                      </div>

                      {/* Services */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Services:</p>
                        <div className="flex flex-wrap gap-1">
                          {garage.services.map((service, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {service}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>

                    {/* Action Button */}
                    <div className="p-4 border-t">
                      <Button
                        onClick={() => navigate(`/garage/${garage.id}`)}
                        className="w-full"
                      >
                        View Details <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </Card>
                </TiltCard>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No garages found matching your search.</p>
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                Clear Search
              </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default GarageListing;
