import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Wrench, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavLink {
  name: string;
  path: string;
}

const Navbar = (): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks: NavLink[] = [
    { name: "Home", path: "/" },
    { name: "Services", path: "/services" },
    { name: "Book Service", path: "/booking" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
  ];

  const isActive = (path: string): boolean => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <Wrench className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-2xl tracking-wide text-foreground">AUTO GARAGE</h1>
              <p className="text-xs text-muted-foreground -mt-1">Professional Car Care</p>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive(link.path) ? "text-primary" : "text-foreground"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-4">
            <a href="tel:+1234567890" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <Phone className="w-4 h-4" />
              (123) 456-7890
            </a>
            <Button asChild>
              <Link to="/booking">Book Now</Link>
            </Button>
          </div>

          <button
            className="lg:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isOpen && (
          <div className="lg:hidden py-4 border-t border-border">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`block py-3 text-sm font-medium transition-colors hover:text-primary ${
                  isActive(link.path) ? "text-primary" : "text-foreground"
                }`}
              >
                {link.name}
              </Link>
            ))}
            <Button asChild className="w-full mt-4">
              <Link to="/booking" onClick={() => setIsOpen(false)}>Book Now</Link>
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
};

export { Navbar };
export default Navbar;
