import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import ThreeDCar from "@/components/ThreeDCar";
import { Button } from "@/components/ui/button";
import { Droplets, Settings, Disc, Sparkles, Wind, CircleDot, Battery, Gauge, Wrench, Zap, Check, ArrowRight } from "lucide-react";
import { TiltCard } from "@/components/ui/tilt-card";

const allServices = [
  {
    icon: Droplets,
    name: "Oil Change",
    description: "Keep your engine running smoothly with our premium oil change service. We use high-quality synthetic and conventional oils.",
    price: 49,
    features: ["Full synthetic options", "Filter replacement", "Fluid top-off", "21-point inspection"],
  },
  {
    icon: Settings,
    name: "Engine Repair",
    description: "Complete engine diagnostics and repair services. From minor fixes to major overhauls, we handle it all.",
    price: 199,
    features: ["Computer diagnostics", "Timing belt repair", "Head gasket replacement", "Engine rebuild"],
  },
  {
    icon: Disc,
    name: "Brake Service",
    description: "Ensure your safety with comprehensive brake inspection and repair services.",
    price: 89,
    features: ["Brake pad replacement", "Rotor resurfacing", "Brake fluid flush", "ABS diagnostics"],
  },
  {
    icon: Sparkles,
    name: "Car Wash & Detail",
    description: "Professional detailing to make your car look brand new, inside and out.",
    price: 29,
    features: ["Exterior wash", "Interior vacuum", "Wax & polish", "Leather conditioning"],
  },
  {
    icon: Wind,
    name: "AC Service",
    description: "Stay cool on the road with our AC inspection, recharge, and repair services.",
    price: 79,
    features: ["AC recharge", "Leak detection", "Compressor repair", "Cabin filter replacement"],
  },
  {
    icon: CircleDot,
    name: "Tire Services",
    description: "Complete tire care including rotation, balancing, alignment, and replacement.",
    price: 39,
    features: ["Tire rotation", "Wheel balancing", "Alignment check", "New tire installation"],
  },
  {
    icon: Battery,
    name: "Battery Service",
    description: "Battery testing, charging, and replacement to keep you on the road.",
    price: 25,
    features: ["Battery testing", "Terminal cleaning", "Jump start service", "New battery installation"],
  },
  {
    icon: Gauge,
    name: "Transmission Service",
    description: "Keep your transmission in top shape with our comprehensive services.",
    price: 149,
    features: ["Fluid change", "Filter replacement", "Diagnostic scan", "Transmission rebuild"],
  },
  {
    icon: Wrench,
    name: "General Maintenance",
    description: "Routine maintenance to keep your vehicle running at peak performance.",
    price: 99,
    features: ["Multi-point inspection", "Fluid checks", "Belt inspection", "Tune-up service"],
  },
  {
    icon: Zap,
    name: "Electrical Repair",
    description: "Expert diagnosis and repair of all electrical system issues.",
    price: 75,
    features: ["Starter repair", "Alternator service", "Wiring repair", "Light replacement"],
  },
];

const ServicesPage = () => {
  return (
    <div className="min-h-screen">
      <main className="pt-32 pb-24 bg-background">
        <div className="container mx-auto px-4">

          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-primary font-medium text-sm uppercase tracking-wider">Our Services</span>
            <h1 className="font-display text-4xl md:text-5xl text-foreground mt-3 mb-4">
              COMPLETE AUTO CARE
            </h1>
            <p className="text-muted-foreground">
              From routine maintenance to major repairs, our certified technicians provide
              comprehensive services to keep your vehicle in perfect condition.
            </p>
          </div>

          {/* Destroyed Car 3D Display - Accident Recovery Showcase */}
          <div className="mb-20 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-orange-500/10 to-yellow-500/10 rounded-3xl blur-3xl" />
            <div className="relative bg-gradient-to-br from-card to-muted rounded-3xl p-8 md:p-12 border border-border overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ff0000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }} />
              </div>

              <div className="grid lg:grid-cols-2 gap-8 items-center relative z-10">
                {/* Left Side - Text Content */}
                <div className="text-center lg:text-left order-2 lg:order-1">
                  <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-2 mb-6">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-sm text-red-500 font-medium">Accident Recovery Specialists</span>
                  </div>

                  <h2 className="font-display text-3xl md:text-4xl text-foreground mb-4">
                    WE RESTORE
                    <span className="block text-primary">DAMAGED VEHICLES</span>
                  </h2>

                  <p className="text-muted-foreground text-lg mb-6">
                    From minor dents to major collision damage, our expert team can restore your vehicle to its former glory. We handle insurance claims and provide comprehensive accident recovery services.
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-background/50 backdrop-blur-sm rounded-xl p-4 border border-border">
                      <div className="text-2xl font-display text-primary mb-1">24/7</div>
                      <div className="text-sm text-muted-foreground">Emergency Service</div>
                    </div>
                    <div className="bg-background/50 backdrop-blur-sm rounded-xl p-4 border border-border">
                      <div className="text-2xl font-display text-primary mb-1">100%</div>
                      <div className="text-sm text-muted-foreground">Insurance Approved</div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                    <Button size="lg" className="text-lg px-8" asChild>
                      <Link to="/contact">
                        Get Free Estimate
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </Link>
                    </Button>
                    <Button size="lg" variant="outline" className="text-lg px-8" asChild>
                      <Link to="/garages">Find Repair Shop</Link>
                    </Button>
                  </div>
                </div>

                {/* Right Side - 3D Destroyed Car */}
                <div className="order-1 lg:order-2">
                  <div className="relative h-[400px] md:h-[500px] lg:h-[600px]">
                    <div className="absolute -inset-4 bg-red-500/20 rounded-3xl blur-2xl animate-pulse" />
                    <div className="relative h-full bg-gradient-to-br from-background/80 to-muted/80 backdrop-blur-sm rounded-2xl border border-red-500/20 overflow-hidden shadow-2xl">
                      <ThreeDCar
                        modelPath="/models/ferrari.glb"
                        quality="low"
                        interactive={false}
                      />

                      {/* Overlay Badge */}
                      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md px-6 py-3 rounded-full border border-red-500/30">
                        <p className="text-white font-semibold text-center">Vehicle Service Preview</p>
                        <p className="text-red-400 text-xs text-center">Fast 3D Load Mode</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {allServices.map((service, index) => (
              <TiltCard key={index} className="h-full">
                <div
                  className="bg-card rounded-2xl p-6 md:p-8 border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 h-full"
                >
                  <div className="flex items-start gap-6">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                      <service.icon className="w-8 h-8 text-primary" />
                    </div>

                    <div className="flex-1">
                      <div className="mb-3">
                        <h3 className="font-display text-2xl text-card-foreground">{service.name}</h3>
                      </div>

                      <p className="text-muted-foreground text-sm mb-4">{service.description}</p>

                      <div className="grid grid-cols-2 gap-2">
                        {service.features.map((feature, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Check className="w-4 h-4 text-primary shrink-0" />
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </TiltCard>
            ))}
          </div>


          <div className="text-center mt-16 p-12 bg-muted rounded-3xl">
            <h2 className="font-display text-3xl text-foreground mb-4">
              NOT SURE WHAT YOU NEED?
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto mb-6">
              Bring your vehicle in for a free inspection and our experts will
              recommend the services you need.
            </p>
            <Button size="lg" asChild>
              <Link to="/contact">
                Contact Us
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ServicesPage;
