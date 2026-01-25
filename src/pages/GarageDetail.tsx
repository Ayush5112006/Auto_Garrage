import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Phone, Clock, Mail, Globe, Droplets, Settings, Disc, Sparkles, Wind, CircleDot, ArrowRight } from "lucide-react";

interface Garage {
  id: number;
  name: string;
  location: string;
  phone: string;
  email: string;
  website: string;
  rating: number;
  reviews: number;
  image: string;
  description: string;
  openTime: string;
  isOpen: boolean;
  services: Array<{
    id: string;
    name: string;
    price: number;
    icon: any;
  }>;
}

const garageDetails: { [key: number]: Garage } = {
  1: {
    id: 1,
    name: "AutoCare Premium",
    location: "Mumbai, Maharashtra",
    phone: "+91 98765 43210",
    email: "info@autocarecompremium.com",
    website: "www.autocarepremium.com",
    rating: 4.8,
    reviews: 234,
    image: "https://images.unsplash.com/photo-1486262715619-67b519e0aeb4?w=800&h=400&fit=crop",
    description: "AutoCare Premium is one of the most trusted and experienced auto service centers in Mumbai with over 15 years of service excellence.",
    openTime: "08:00 AM - 08:00 PM",
    isOpen: true,
    services: [
      { id: "oil-change", name: "Oil Change", price: 2499, icon: Droplets },
      { id: "engine-repair", name: "Engine Repair", price: 9999, icon: Settings },
      { id: "brake-service", name: "Brake Service", price: 4499, icon: Disc },
      { id: "car-wash", name: "Car Wash & Detail", price: 1499, icon: Sparkles },
      { id: "ac-service", name: "AC Service", price: 3999, icon: Wind },
      { id: "tire-service", name: "Tire Services", price: 1999, icon: CircleDot },
    ],
  },
  2: {
    id: 2,
    name: "Quick Fix Auto Hub",
    location: "Delhi, NCR",
    phone: "+91 87654 32109",
    email: "contact@quickfixautohub.com",
    website: "www.quickfixautohub.com",
    rating: 4.6,
    reviews: 189,
    image: "https://images.unsplash.com/photo-1487700492518-7921c3307bbe?w=800&h=400&fit=crop",
    description: "Quick Fix Auto Hub offers fast and reliable auto repair services with certified technicians and genuine spare parts.",
    openTime: "07:00 AM - 09:00 PM",
    isOpen: true,
    services: [
      { id: "tire-service", name: "Tire Services", price: 1999, icon: CircleDot },
      { id: "engine-repair", name: "Engine Repair", price: 9999, icon: Settings },
      { id: "car-wash", name: "Car Wash & Detail", price: 1499, icon: Sparkles },
      { id: "oil-change", name: "Oil Change", price: 2499, icon: Droplets },
      { id: "brake-service", name: "Brake Service", price: 4499, icon: Disc },
      { id: "ac-service", name: "AC Service", price: 3999, icon: Wind },
    ],
  },
  3: {
    id: 3,
    name: "Expert Mechanics Garage",
    location: "Bangalore, Karnataka",
    phone: "+91 76543 21098",
    email: "service@expertmechanics.com",
    website: "www.expertmechanics.com",
    rating: 4.7,
    reviews: 156,
    image: "https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800&h=400&fit=crop",
    description: "Expert Mechanics Garage specializes in comprehensive vehicle maintenance and repair with state-of-the-art equipment.",
    openTime: "08:30 AM - 07:30 PM",
    isOpen: true,
    services: [
      { id: "engine-repair", name: "Engine Repair", price: 9999, icon: Settings },
      { id: "oil-change", name: "Oil Change", price: 2499, icon: Droplets },
      { id: "brake-service", name: "Brake Service", price: 4499, icon: Disc },
      { id: "ac-service", name: "AC Service", price: 3999, icon: Wind },
      { id: "tire-service", name: "Tire Services", price: 1999, icon: CircleDot },
      { id: "car-wash", name: "Car Wash & Detail", price: 1499, icon: Sparkles },
    ],
  },
  4: {
    id: 4,
    name: "Shine & Drive",
    location: "Pune, Maharashtra",
    phone: "+91 65432 10987",
    email: "hello@shineanddrive.com",
    website: "www.shineanddrive.com",
    rating: 4.5,
    reviews: 142,
    image: "https://images.unsplash.com/photo-1507541957570-b8161f06210a?w=800&h=400&fit=crop",
    description: "Shine & Drive is your one-stop solution for car maintenance and detailing services with affordable pricing.",
    openTime: "09:00 AM - 07:00 PM",
    isOpen: true,
    services: [
      { id: "car-wash", name: "Car Wash & Detail", price: 1499, icon: Sparkles },
      { id: "tire-service", name: "Tire Services", price: 1999, icon: CircleDot },
      { id: "ac-service", name: "AC Service", price: 3999, icon: Wind },
      { id: "oil-change", name: "Oil Change", price: 2499, icon: Droplets },
      { id: "brake-service", name: "Brake Service", price: 4499, icon: Disc },
      { id: "engine-repair", name: "Engine Repair", price: 9999, icon: Settings },
    ],
  },
  5: {
    id: 5,
    name: "TurboFix Service Center",
    location: "Hyderabad, Telangana",
    phone: "+91 54321 09876",
    email: "support@turbofix.com",
    website: "www.turbofix.com",
    rating: 4.9,
    reviews: 267,
    image: "https://images.unsplash.com/photo-1486262715619-67b519e0aeb4?w=800&h=400&fit=crop",
    description: "TurboFix Service Center offers premium automotive services with highly skilled technicians and modern diagnostic equipment.",
    openTime: "08:00 AM - 09:00 PM",
    isOpen: true,
    services: [
      { id: "engine-repair", name: "Engine Repair", price: 9999, icon: Settings },
      { id: "brake-service", name: "Brake Service", price: 4499, icon: Disc },
      { id: "ac-service", name: "AC Service", price: 3999, icon: Wind },
      { id: "oil-change", name: "Oil Change", price: 2499, icon: Droplets },
      { id: "car-wash", name: "Car Wash & Detail", price: 1499, icon: Sparkles },
      { id: "tire-service", name: "Tire Services", price: 1999, icon: CircleDot },
    ],
  },
  6: {
    id: 6,
    name: "Professional Car Care",
    location: "Chennai, Tamil Nadu",
    phone: "+91 43210 98765",
    email: "team@profcarcare.com",
    website: "www.profcarcare.com",
    rating: 4.4,
    reviews: 128,
    image: "https://images.unsplash.com/photo-1487700492518-7921c3307bbe?w=800&h=400&fit=crop",
    description: "Professional Car Care is dedicated to providing high-quality vehicle maintenance and repair services at competitive prices.",
    openTime: "08:00 AM - 08:00 PM",
    isOpen: true,
    services: [
      { id: "oil-change", name: "Oil Change", price: 2499, icon: Droplets },
      { id: "car-wash", name: "Car Wash & Detail", price: 1499, icon: Sparkles },
      { id: "brake-service", name: "Brake Service", price: 4499, icon: Disc },
      { id: "tire-service", name: "Tire Services", price: 1999, icon: CircleDot },
      { id: "ac-service", name: "AC Service", price: 3999, icon: Wind },
      { id: "engine-repair", name: "Engine Repair", price: 9999, icon: Settings },
    ],
  },
};

const GarageDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const garage = id ? garageDetails[parseInt(id)] : null;

  if (!garage) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="pt-32 pb-24 bg-background">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl font-bold mb-4">Garage Not Found</h1>
            <Button onClick={() => navigate("/garages")}>Back to Garages</Button>
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
          {/* Hero Section */}
          <div className="relative h-80 rounded-2xl overflow-hidden mb-8">
            <img src={garage.image} alt={garage.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
              <div className="text-white">
                <h1 className="font-display text-4xl md:text-5xl mb-2">{garage.name}</h1>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-yellow-400 bg-opacity-90 px-3 py-1 rounded">
                    <Star className="w-5 h-5 fill-white text-white" />
                    <span className="font-bold">{garage.rating}</span>
                  </div>
                  <span className="text-white/90">({garage.reviews} reviews)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle>About This Garage</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{garage.description}</p>
                </CardContent>
              </Card>

              {/* Services */}
              <Card>
                <CardHeader>
                  <CardTitle>Services & Pricing</CardTitle>
                  <CardDescription>All services include professional expertise and quality assurance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {garage.services.map((service) => {
                      const Icon = service.icon;
                      return (
                        <div key={service.id} className="flex items-start gap-4 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors">
                          <Icon className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{service.name}</p>
                            <p className="text-primary font-display text-lg">₹{service.price.toLocaleString("en-IN")}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Reviews Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Customer Reviews</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[1, 2].map((idx) => (
                    <div key={idx} className="pb-4 border-b last:border-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < 5 ? "fill-yellow-400 text-yellow-400" : "text-muted"}`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground">5 stars</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {idx === 1
                          ? "Excellent service! The technicians were professional and efficient. Highly recommended!"
                          : "Great experience. The work was done quickly and the pricing was fair."}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Card */}
              <Card className="sticky top-32">
                <CardHeader>
                  <CardTitle className="text-lg">Contact & Hours</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium">{garage.location}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <a href={`tel:${garage.phone}`} className="text-sm font-medium hover:text-primary transition-colors">
                      {garage.phone}
                    </a>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <a href={`mailto:${garage.email}`} className="text-sm font-medium hover:text-primary transition-colors break-all">
                      {garage.email}
                    </a>
                  </div>

                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <a href={`https://${garage.website}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:text-primary transition-colors">
                      {garage.website}
                    </a>
                  </div>

                  <div className="flex items-start gap-3 pt-2 border-t">
                    <Clock className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium mb-1">{garage.openTime}</p>
                      {garage.isOpen && (
                        <Badge className="bg-green-500 text-white">Currently Open</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CTA */}
              <Button
                onClick={() => navigate("/booking")}
                className="w-full"
                size="lg"
              >
                Book Service <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                onClick={() => navigate("/garages")}
                variant="outline"
                className="w-full"
              >
                Back to Garages
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default GarageDetail;
