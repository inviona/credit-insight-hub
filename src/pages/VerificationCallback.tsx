import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Shield, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TopNavbar } from "@/components/TopNavbar";

export default function VerificationCallback() {
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace("#", "?"));
    const type = hashParams.get("type");
    const error = hashParams.get("error");

    if (error) {
      setStatus("error");
      return;
    }

    if (type === "signup" || type === "recovery" || type === "invite") {
      setStatus("success");
      window.history.replaceState(null, "", window.location.pathname);
    } else {
      const timer = setTimeout(() => {
        setStatus("success");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <TopNavbar />
      <div className="flex items-center justify-center px-4 py-20">
        <Card className="w-full max-w-sm border-border">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-xl">
              {status === "verifying" ? "Verifying…" : "Verification"}
            </CardTitle>
            <CardDescription>
              {status === "verifying"
                ? "Please wait while we verify your email."
                : status === "success"
                  ? "Your email has been verified!"
                  : "Something went wrong."}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {status === "verifying" ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : status === "success" ? (
              <>
                <div className="flex justify-center py-4">
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Your account is now active. You can sign in to access all features.
                </p>
                <Link to="/login">
                  <Button className="w-full">Sign in</Button>
                </Link>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                The verification link may be invalid or expired. Please try signing up again.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
