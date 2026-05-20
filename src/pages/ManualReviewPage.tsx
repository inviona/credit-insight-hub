import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, Loader2, ClipboardList, User, DollarSign, TrendingUp, Ban, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

type LoanApplication = {
  id: string;
  customer_id: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  person_age: number | null;
  person_income: number | null;
  loan_amount: number | null;
  loan_int_rate: number | null;
  loan_term: number | null;
  credit_score: number | null;
  employment_status: string | null;
  monthly_expenses: number | null;
  existing_debt: number | null;
  person_emp_length: number | null;
  cb_person_default_on_file: string | null;
  status: string | null;
  created_at: string | null;
};

export default function ManualReviewPage() {
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedApp, setSelectedApp] = useState<LoanApplication | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchReviewApplications();
  }, []);

  const fetchReviewApplications = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("loan_applications")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "pending_review")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Fetch error:", error);
      } else {
        setApplications(data || []);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!search) return applications;
    const s = search.toLowerCase();
    return applications.filter(
      (app) =>
        (app.customer_id || "").toLowerCase().includes(s) ||
        (app.full_name || "").toLowerCase().includes(s) ||
        (app.email || "").toLowerCase().includes(s)
    );
  }, [applications, search]);

  const getRiskScore = (app: LoanApplication): number => {
    const income = app.person_income || 0;
    const loan = app.loan_amount || 0;
    if (income <= 0 && loan <= 0) return 50;
    const ratio = income > 0 ? loan / income : 1;
    const score = 50 - ratio * 25 + (app.person_emp_length || 0 >= 2 ? 5 : 0);
    return Math.max(0, Math.min(99, Math.round(score)));
  };

  const getRiskLevel = (score: number): string => {
    if (score < 20) return "Low";
    if (score < 40) return "Moderate";
    if (score < 60) return "Elevated";
    return "High";
  };

  const handleAddToPortfolio = async () => {
    if (!selectedApp) return;
    setActionLoading(true);
    const { error } = await supabase
      .from("loan_applications")
      .update({ status: "approved" })
      .eq("id", selectedApp.id);
    setActionLoading(false);
    if (error) {
      toast({ title: "Error", description: "Failed to approve application", variant: "destructive" });
    } else {
      toast({ title: "Added to Portfolio", description: "Application has been approved" });
      setApplications((prev) => prev.filter((a) => a.id !== selectedApp.id));
      setSelectedApp(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedApp) return;
    setActionLoading(true);
    const { error } = await supabase
      .from("loan_applications")
      .delete()
      .eq("id", selectedApp.id);
    setActionLoading(false);
    if (error) {
      toast({ title: "Error", description: "Failed to delete application", variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Application removed from review list" });
      setApplications((prev) => prev.filter((a) => a.id !== selectedApp.id));
      setSelectedApp(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <ClipboardList className="h-6 w-6 text-primary" />
              Manual Review
            </h1>
            <p className="text-sm text-muted-foreground">
              Review flagged applications before adding them to the portfolio
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            {applications.length} pending review
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, customer ID, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium">No applications pending review</p>
            <p className="text-sm mt-1">
              Applications sent to manual review from the assessment page will appear here
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((app) => {
              const riskScore = getRiskScore(app);
              const riskLevel = getRiskLevel(riskScore);
              const riskColor =
                riskLevel === "Low"
                  ? "text-success"
                  : riskLevel === "Moderate"
                  ? "text-accent"
                  : riskLevel === "Elevated"
                  ? "text-warning"
                  : "text-destructive";
              return (
                <Card
                  key={app.id}
                  className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
                  onClick={() => setSelectedApp(app)}
                >
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground truncate">
                          {app.full_name || "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono truncate">
                          {app.customer_id || app.id.slice(0, 8).toUpperCase()}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs border-primary/30 text-primary shrink-0 ml-2">
                        Review
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <DollarSign className="h-3 w-3" /> Income
                        </p>
                        <p className="font-mono font-medium">
                          {app.person_income ? `$${app.person_income.toLocaleString()}` : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" /> Loan
                        </p>
                        <p className="font-mono font-medium">
                          {app.loan_amount ? `$${app.loan_amount.toLocaleString()}` : "N/A"}
                        </p>
                      </div>
                      {app.loan_int_rate && (
                        <div>
                          <p className="text-xs text-muted-foreground">Rate</p>
                          <p className="font-mono">{app.loan_int_rate}%</p>
                        </div>
                      )}
                      {app.loan_term && (
                        <div>
                          <p className="text-xs text-muted-foreground">Term</p>
                          <p className="font-mono">{app.loan_term}mo</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <div>
                        <p className="text-xs text-muted-foreground">Risk Score</p>
                        <p className={cn("font-bold font-mono", riskColor)}>
                          {riskScore}%
                        </p>
                      </div>
                      <Badge variant={riskLevel === "Low" || riskLevel === "Moderate" ? "default" : "destructive"} className={cn(
                        "text-xs",
                        riskLevel === "Low" && "bg-success/15 text-success border-success/30",
                        riskLevel === "Moderate" && "bg-accent/15 text-accent border-accent/30",
                        riskLevel === "Elevated" && "bg-warning/15 text-warning border-warning/30",
                        riskLevel === "High" && "bg-destructive/15 text-destructive border-destructive/30",
                      )}>
                        {riskLevel}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!selectedApp} onOpenChange={(open) => !open && setSelectedApp(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              {selectedApp?.full_name || "Applicant"}
            </DialogTitle>
            <DialogDescription>
              ID: {selectedApp?.customer_id || selectedApp?.id.slice(0, 8).toUpperCase()}
            </DialogDescription>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Email</p>
                  <p className="font-medium">{selectedApp.email || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Phone</p>
                  <p className="font-medium">{selectedApp.phone || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Age</p>
                  <p className="font-medium">{selectedApp.person_age || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Employment</p>
                  <p className="font-medium">{selectedApp.employment_status || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Annual Income</p>
                  <p className="font-mono font-semibold">
                    {selectedApp.person_income ? `$${selectedApp.person_income.toLocaleString()}` : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Loan Amount</p>
                  <p className="font-mono font-semibold">
                    {selectedApp.loan_amount ? `$${selectedApp.loan_amount.toLocaleString()}` : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Interest Rate</p>
                  <p className="font-mono">{selectedApp.loan_int_rate ? `${selectedApp.loan_int_rate}%` : "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Loan Term</p>
                  <p className="font-mono">{selectedApp.loan_term ? `${selectedApp.loan_term} months` : "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Monthly Expenses</p>
                  <p className="font-mono">
                    {selectedApp.monthly_expenses ? `$${selectedApp.monthly_expenses.toLocaleString()}` : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Existing Debt</p>
                  <p className="font-mono">
                    {selectedApp.existing_debt ? `$${selectedApp.existing_debt.toLocaleString()}` : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Risk Score</p>
                  <p className="font-mono font-bold">{getRiskScore(selectedApp)}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Risk Level</p>
                  <p className="font-medium">{getRiskLevel(getRiskScore(selectedApp))}</p>
                </div>
              </div>

              <div className="border-t border-border pt-3">
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm font-mono">
                  {selectedApp.created_at ? new Date(selectedApp.created_at).toLocaleString() : "N/A"}
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={actionLoading}
              className="gap-2"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
              Delete
            </Button>
            <Button
              variant="default"
              onClick={handleAddToPortfolio}
              disabled={actionLoading}
              className="gap-2"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Add to Portfolio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
