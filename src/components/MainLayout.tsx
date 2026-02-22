import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { PageTransition } from "@/components/ui/page-transition";
import { WhatsAppButton } from "@/components/WhatsAppButton";

export const MainLayout = () => {
    return (
        <div className="min-h-screen flex flex-col relative">
            {/* Navbar - Highest z-index */}
            <div className="relative z-50">
                <Navbar />
            </div>

            {/* Main content - Medium z-index, transparent background */}
            <div className="flex-1 relative z-10">
                <PageTransition>
                    <Outlet />
                </PageTransition>
            </div>

            {/* WhatsApp Button - High z-index */}
            <div className="relative z-50">
                <WhatsAppButton />
            </div>
        </div>
    );
};
