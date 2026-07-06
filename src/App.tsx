import { useEffect, useRef } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/AuthGuard";
import { ChatBot } from "@/components/ChatBot";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import AssessmentPage from "./pages/AssessmentPage";
import BatchPage from "./pages/BatchPage";
import HistoryPage from "./pages/HistoryPage";
import ManualReviewPage from "./pages/ManualReviewPage";
import PersonalPage from "./pages/PersonalPage";
import ContactSalesPage from "./pages/ContactSalesPage";
import VerificationCallback from "./pages/VerificationCallback";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AuthCallbackRedirect() {
  const { fromEmailVerification, user, loading } = useAuth();
  const navigate = useNavigate();
  const redirected = useRef(false);

  useEffect(() => {
    if (!loading && fromEmailVerification && user && !redirected.current) {
      redirected.current = true;
      navigate("/auth/callback", { replace: true });
    }
  }, [fromEmailVerification, user, loading, navigate]);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ChatBot />
      <BrowserRouter>
        <AuthProvider>
          <AuthCallbackRedirect />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/auth/callback" element={<VerificationCallback />} />
            <Route path="/personal" element={<PersonalPage />} />
            <Route path="/contact-sales" element={<ContactSalesPage />} />
            <Route
              path="/dashboard"
              element={
                <AuthGuard>
                  <DashboardPage />
                </AuthGuard>
              }
            />
            <Route
              path="/assess"
              element={
                <AuthGuard>
                  <AssessmentPage />
                </AuthGuard>
              }
            />
            <Route
              path="/batch"
              element={
                <AuthGuard>
                  <BatchPage />
                </AuthGuard>
              }
            />
            <Route
              path="/history"
              element={
                <AuthGuard>
                  <HistoryPage />
                </AuthGuard>
              }
            />
            <Route
              path="/manual-review"
              element={
                <AuthGuard>
                  <ManualReviewPage />
                </AuthGuard>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
