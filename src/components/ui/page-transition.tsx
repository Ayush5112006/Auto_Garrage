import { useRef, useState, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface PageTransitionProps {
    children: React.ReactNode;
    className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
    const location = useLocation();
    const [displayLocation, setDisplayLocation] = useState(location);
    const [transitionStage, setTransitionStage] = useState<"fadeIn" | "fadeOut">("fadeIn");
    const containerRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (location.pathname !== displayLocation.pathname) {
            setTransitionStage("fadeOut");
        }
    }, [location, displayLocation]);

    const onAnimationEnd = () => {
        if (transitionStage === "fadeOut") {
            setTransitionStage("fadeIn");
            setDisplayLocation(location);
            window.scrollTo(0, 0); // Scroll to top on route change
        }
    };

    return (
        <div
            ref={containerRef}
            onAnimationEnd={onAnimationEnd}
            className={cn(
                "min-h-screen w-full animate-in flex flex-col",
                transitionStage === "fadeIn" ? "animate-in fade-in zoom-in-95 duration-500" : "animate-out fade-out zoom-out-95 duration-300",
                className
            )}
        >
            <div key={displayLocation.pathname} className="flex-1 flex flex-col">
                {children}
            </div>
        </div>
    );
}
