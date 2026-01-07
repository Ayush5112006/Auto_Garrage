import { Link } from "react-router-dom";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CurrencyToggle from "@/components/ui/currency-toggle";
import useExchangeRate from "@/hooks/useExchangeRate";
import { convertUSDToINR, formatCurrency } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Droplets, Settings, Disc, Sparkles, Wind, CircleDot, Battery, Gauge, Wrench, Zap, ArrowRight, Check } from "lucide-react";

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
  const { rate, loading: rateLoading } = useExchangeRate();
  const [currency, setCurrency] = useState<'USD'|'INR'>('INR');

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-32 pb-24 bg-background">
        <div className="container mx-auto px-4">

          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="flex items-center justify-center gap-4 mb-4">
              <CurrencyToggle value={currency} onChange={setCurrency} />
              <div className="text-sm text-muted-foreground">
                {rateLoading ? 'Fetching rate...' : rate ? `1 USD = ${rate.toFixed(4)} INR` : 'Rate unavailable'}
              </div>
            </div>

            <span className="text-primary font-medium text-sm uppercase tracking-wider">Our Services</span>
            <h1 className="font-display text-4xl md:text-5xl text-foreground mt-3 mb-4">
              COMPLETE AUTO CARE
            </h1>
            <p className="text-muted-foreground">
              From routine maintenance to major repairs, our certified technicians provide
              comprehensive services to keep your vehicle in perfect condition.
            </p>
          </div>


          <div className="grid md:grid-cols-2 gap-8">
            {allServices.map((service, index) => (
              <div
                key={index}
                className="bg-card rounded-2xl p-6 md:p-8 border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5"
              >
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                    <service.icon className="w-8 h-8 text-primary" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-display text-2xl text-card-foreground">{service.name}</h3>
                      <span className="font-display text-xl text-primary">{
                        `From ${currency === 'USD' ? formatCurrency(service.price, 'USD') : rate ? formatCurrency(convertUSDToINR(service.price, rate), 'INR') : '₹--'}`
                      }</span>
                    </div>

                    <p className="text-muted-foreground text-sm mb-4">{service.description}</p>

                    <div className="grid grid-cols-2 gap-2 mb-6">
                      {service.features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="w-4 h-4 text-primary shrink-0" />
                          {feature}
                        </div>
                      ))}
                    </div>

                    <Button asChild variant="outline" className="w-full">
                      <Link to="/booking">
                        Book This Service
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
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
