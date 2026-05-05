import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center border-b border-border px-4 bg-card/50 backdrop-blur sticky top-0 z-40 gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 mr-1"
              onClick={() => navigate(-1)}
              title="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <SidebarTrigger className="mr-3" />
            <span className="text-sm text-muted-foreground">Credit Predictor</span>
          </header>
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
