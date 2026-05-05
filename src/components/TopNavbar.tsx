import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function TopNavbar() {
  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between h-16 px-6">
        <Link to="/" className="flex items-center gap-3">
          <img src="/new-updated-logo.png" alt="Logo" className="h-8 object-contain" />
          <span className="font-bold text-base tracking-tight">
            Credit Risk Intelligent Predictor
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Link to="/personal">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              Personal
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="ghost" size="sm">Log in</Button>
          </Link>
          <Link to="/register">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
