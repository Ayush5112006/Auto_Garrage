import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface PageTransitionProps {
    children: React.ReactNode;
    className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const location = useLocation();
  const [transitionKey, setTransitionKey] = useState(0);

  useEffect(() => {
    setTransitionKey((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  return (
    <div
      key={`${location.pathname}-${transitionKey}`}
      className={cn(
        "w-full flex flex-col motion-reduce:transition-none motion-reduce:animate-none animate-in fade-in slide-in-from-bottom-1 duration-300",
        className
      )}
    >
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
    );
}
