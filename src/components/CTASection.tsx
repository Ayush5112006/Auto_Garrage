import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, LogIn } from "lucide-react";

const CTASection = () => {
  const isLoggedIn = !!localStorage.getItem("user");

  return (
    <section className="py-12 md:py-24 bg-primary relative overflow-hidden">

      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-4xl md:text-6xl text-primary-foreground mb-6">
            FIND YOUR PERFECT GARAGE
            <span className="block">AND BOOK YOUR SERVICE</span>
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto">
            Browse our trusted garages, compare services, and book your appointment today.
            Select delivery or pickup options for convenience.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="text-lg px-8 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              asChild
            >
              <Link to="/garages">
                <ArrowRight className="mr-2 w-5 h-5" />
                Find a Garage
              </Link>
            </Button>
            {isLoggedIn ? (
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                asChild
              >
                <Link to="/dashboard">
                  <LogIn className="mr-2 w-5 h-5" />
                  My Dashboard
                </Link>
              </Button>
            ) : (
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                asChild
              >
                <Link to="/login">
                  <LogIn className="mr-2 w-5 h-5" />
                  Login
                </Link>
              </Button>
            )}
          </div>


          <div className="flex flex-wrap justify-center gap-8 mt-12 pt-12 border-t border-primary-foreground/20">
            {["Free Estimates", "Same Day Service", "Certified Mechanics", "Warranty Included"].map((badge, index) => (
              <div key={index} className="flex items-center gap-2 text-primary-foreground/80">
                <ArrowRight className="w-4 h-4 text-primary-foreground" />
                <span className="text-sm font-medium">{badge}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
