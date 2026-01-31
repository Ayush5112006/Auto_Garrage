import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { PageTransition } from "@/components/ui/page-transition";

export const MainLayout = () => {
    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <div className="flex-1">
                <PageTransition>
                    <Outlet />
                </PageTransition>
            </div>
        </div>
    );
};
