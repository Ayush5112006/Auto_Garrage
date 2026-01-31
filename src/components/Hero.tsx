import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Clock, Award } from "lucide-react";
import ThreeDCar from "./ThreeDCar";
import { GlitchText } from "@/components/ui/glitch-text";

const Hero = () => {
  const stats = [
    { icon: Shield, label: "Certified Mechanics", value: "50+" },
    { icon: Clock, label: "Years Experience", value: "15+" },
    { icon: Award, label: "Happy Customers", value: "10K+" },
  ];

  return (
    <section className="relative min-h-screen flex items-center hero-gradient overflow-hidden">

      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>


      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />

      <div className="container mx-auto px-4 pt-32 pb-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-sm text-primary font-medium">Trusted Auto Care Since 2009</span>
            </div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-white leading-tight mb-6">
              EXPERT CAR
              <GlitchText text="SERVICE & REPAIR" className="block text-primary" speed={40} />
            </h1>

            <p className="text-lg text-gray-300 max-w-xl mx-auto lg:mx-0 mb-8">
              From routine maintenance to complex repairs, our certified technicians deliver
              exceptional service with transparency and care. Book your appointment today.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button size="lg" className="text-lg px-8 animate-pulse-glow" asChild>
                <Link to="/garages">
                  Browse Garages
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 border-white/20 text-white hover:bg-white/10" asChild>
                <Link to="/track">Track Booking</Link>
              </Button>
            </div>


            <div className="grid grid-cols-3 gap-6 mt-12 pt-12 border-t border-white/10">
              {stats.map((stat, index) => (
                <div key={index} className="text-center lg:text-left">
                  <stat.icon className="w-8 h-8 text-primary mx-auto lg:mx-0 mb-2" />
                  <div className="font-display text-3xl text-white">{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>


          <div className="relative hidden lg:block perspective-container">
            <div className="absolute -inset-4 bg-primary/20 rounded-3xl blur-3xl cube-3d" />
            <div className="relative bg-gradient-to-br from-garage-steel to-garage-dark rounded-3xl p-8 border border-primary-foreground/10 scale-rotate-3d shadow-3d h-[600px]">
              <div className="w-full h-full rounded-2xl overflow-hidden float-3d">
                <ThreeDCar />
              </div>

              <div className="absolute -bottom-6 -left-6 bg-card p-6 rounded-2xl shadow-2xl border border-border tilt-3d glow-3d">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-garage-success/10 rounded-xl flex items-center justify-center pulse-3d">
                    <Shield className="w-7 h-7 text-garage-success" />
                  </div>
                  <div>
                    <p className="font-display text-xl text-card-foreground">100% Guaranteed</p>
                    <p className="text-sm text-muted-foreground">Quality Workmanship</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
