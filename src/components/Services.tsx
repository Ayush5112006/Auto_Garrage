import { Link } from "react-router-dom";
import { Droplets, Settings, Disc, Sparkles, Wind, CircleDot, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const services = [
  {
    icon: Droplets,
    name: "Oil Change",
    description: "Premium oil changes with quality filters to keep your engine running smoothly.",
    price: "From $49",
    popular: true,
  },
  {
    icon: Settings,
    name: "Engine Repair",
    description: "Complete engine diagnostics and repair services by certified technicians.",
    price: "From $199",
    popular: false,
  },
  {
    icon: Disc,
    name: "Brake Service",
    description: "Brake inspection, pad replacement, and rotor resurfacing for safe driving.",
    price: "From $89",
    popular: true,
  },
  {
    icon: Sparkles,
    name: "Car Wash & Detail",
    description: "Interior and exterior detailing to make your car look brand new.",
    price: "From $29",
    popular: false,
  },
  {
    icon: Wind,
    name: "AC Service",
    description: "AC inspection, recharge, and repair to keep you cool on the road.",
    price: "From $79",
    popular: false,
  },
  {
    icon: CircleDot,
    name: "Tire Services",
    description: "Tire rotation, balancing, alignment, and replacement services.",
    price: "From $39",
    popular: true,
  },
];

const Services = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">

        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-primary font-medium text-sm uppercase tracking-wider">What We Offer</span>
          <h2 className="font-display text-4xl md:text-5xl text-foreground mt-3 mb-4">
            OUR SERVICES
          </h2>
          <p className="text-muted-foreground">
            From routine maintenance to complex repairs, we've got your vehicle covered
            with comprehensive automotive services.
          </p>
        </div>


        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <div
              key={index}
              className="group relative bg-card rounded-2xl p-8 border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5"
            >
              {service.popular && (
                <div className="absolute -top-3 right-6 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                  Popular
                </div>
              )}

              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary transition-colors">
                <service.icon className="w-8 h-8 text-primary group-hover:text-primary-foreground transition-colors" />
              </div>

              <h3 className="font-display text-2xl text-card-foreground mb-3">{service.name}</h3>
              <p className="text-muted-foreground text-sm mb-4">{service.description}</p>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <span className="font-display text-xl text-primary">{service.price}</span>
                <Link
                  to="/booking"
                  className="text-sm font-medium text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                >
                  Book Now <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>


        <div className="text-center mt-12">
          <Button size="lg" variant="outline" asChild>
            <Link to="/services">
              View All Services
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Services;
