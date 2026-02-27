import { Outlet } from "react-router-dom";
import { PageTransition } from "@/components/ui/page-transition";
import { WhatsAppButton } from "@/components/WhatsAppButton";

export const MainLayout = () => {
    return (
        <div className="min-h-screen flex flex-col relative">
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
