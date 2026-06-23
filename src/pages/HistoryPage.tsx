import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Search, Calendar as CalendarIcon, Plus, Info, Loader2, SlidersHorizontal, X, TrendingUp, TrendingDown, ClipboardList } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type LoanApplication = {
  id: string;
  customer_id: string | null;
  user_id: string | null;
  status: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  employment_status: string | null;
  annual_income: number | null;
  monthly_expenses: number | null;
  existing_debt: number | null;
  loan_amount: number | null;
  loan_purpose: string | null;
  loan_term: number | null;
  credit_score: number | null;
  credit_history_length: number | null;
  num_credit_lines: number | null;
  num_delinquencies: number | null;
  bankruptcy_history: boolean | null;
  person_age: number | null;
  person_income: number | null;
  person_emp_length: number | null;
  loan_int_rate: number | null;
  loan_percent_income: number | null;
  cb_person_cred_hist_length: number | null;
  person_home_ownership: string | null;
  loan_grade: string | null;
  cb_person_default_on_file: string | null;
  risk_score: number | null;
  shap_explanation: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
};

export default function HistoryPage() {
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "APPROVED" | "REJECTED" | "PENDING">("all");
  const [search, setSearch] = useState("");
  const [selectedApplication, setSelectedApplication] = useState<LoanApplication | null>(null);
  
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [incomeMin, setIncomeMin] = useState("");
  const [incomeMax, setIncomeMax] = useState("");
  const [creditMin, setCreditMin] = useState("");
  const [creditMax, setCreditMax] = useState("");
  const [riskScoreMin, setRiskScoreMin] = useState("");
  const [riskScoreMax, setRiskScoreMax] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
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

  const getDecision = (app: LoanApplication): string => {
    const status = (app.status || "").toLowerCase();
    if (status === "approved" || status === "accepted") return "APPROVED";
    if (status === "rejected" || status === "denied") return "REJECTED";
    if (status === "pending" || status === "pending_review") return "PENDING";
    return app.status?.toUpperCase() || "UNKNOWN";
  };

  const getRiskScore = (app: LoanApplication): number => {
    if (app.risk_score != null) return app.risk_score;

    const annualIncome = app.person_income || 0;
    const loanAmount = app.loan_amount || 0;
    const monthlyExpenses = app.monthly_expenses || 0;
    const existingDebt = app.existing_debt || 0;
    const yearsEmployed = app.person_emp_length || 0;
    const empStatus = (app.employment_status || "").toLowerCase();
    const hasDefaults = (app.cb_person_default_on_file || "").toUpperCase() === "Y";

    if (annualIncome <= 0) return 50;

    const dti = (monthlyExpenses + existingDebt) / annualIncome * 12;
    const lti = loanAmount / annualIncome;

    let score = 50;
    score -= dti * 25;
    score -= lti * 15;
    if (hasDefaults) score -= 15;
    if (yearsEmployed >= 2) score += 5;
    if (empStatus === "full_time" || empStatus === "self_employed") score += 5;
    if (empStatus === "unemployed") score -= 15;

    return Math.max(0, Math.min(99, Math.round(score * 10) / 10));
  };

  const getRiskLevel = (score: number): string => {
    if (score < 20) return "Low";
    if (score < 40) return "Moderate";
    if (score < 60) return "Elevated";
    return "High";
  };

  const filtered = useMemo(() => {
    let data = applications;
    
    if (filter !== "all") data = data.filter((h) => getDecision(h) === filter);
    
    if (search) {
      const s = search.toLowerCase();
      data = data.filter((h) =>
        (h.customer_id || "").toLowerCase().includes(s) ||
        (h.full_name || "").toLowerCase().includes(s) ||
        (h.email || "").toLowerCase().includes(s) ||
        (h.person_income || 0).toString().includes(s) ||
        (h.loan_amount || 0).toString().includes(s)
      );
    }
    
    if (dateFrom) {
      data = data.filter((h) => h.created_at && new Date(h.created_at) >= dateFrom);
    }
    if (dateTo) {
      const endOfDay = new Date(dateTo);
      endOfDay.setHours(23, 59, 59);
      data = data.filter((h) => h.created_at && new Date(h.created_at) <= endOfDay);
    }
    
    if (incomeMin) {
      data = data.filter((h) => (h.person_income || 0) >= parseInt(incomeMin));
    }
    if (incomeMax) {
      data = data.filter((h) => (h.person_income || 0) <= parseInt(incomeMax));
    }
    
    if (creditMin) {
      data = data.filter((h) => (h.loan_amount || 0) >= parseInt(creditMin));
    }
    if (creditMax) {
      data = data.filter((h) => (h.loan_amount || 0) <= parseInt(creditMax));
    }
    
    if (riskScoreMin) {
      data = data.filter((h) => getRiskScore(h) >= parseFloat(riskScoreMin));
    }
    if (riskScoreMax) {
      data = data.filter((h) => getRiskScore(h) <= parseFloat(riskScoreMax));
    }
    
    return data;
  }, [applications, filter, search, dateFrom, dateTo, incomeMin, incomeMax, creditMin, creditMax, riskScoreMin, riskScoreMax]);

  const clearAllFilters = () => {
    setSearch("");
    setDateFrom(undefined);
    setDateTo(undefined);
    setIncomeMin("");
    setIncomeMax("");
    setCreditMin("");
    setCreditMax("");
    setRiskScoreMin("");
    setRiskScoreMax("");
    setFilter("all");
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (dateFrom) count++;
    if (dateTo) count++;
    if (incomeMin) count++;
    if (incomeMax) count++;
    if (creditMin) count++;
    if (creditMax) count++;
    if (riskScoreMin) count++;
    if (riskScoreMax) count++;
    if (filter !== "all") count++;
    return count;
  }, [dateFrom, dateTo, incomeMin, incomeMax, creditMin, creditMax, riskScoreMin, riskScoreMax, filter]);

  const getRiskFactors = (app: LoanApplication) => {
    const income = app.person_income || 0;
    const loan = app.loan_amount || 0;
    const age = app.person_age || 0;
    const ratio = income > 0 ? ((loan / income) * 100).toFixed(1) : "N/A";
    const score = getRiskScore(app);

    const factors = [
      {
        name: score > 50 ? "High Debt-to-Income Ratio" : "Loan-to-Income Ratio",
        value: ratio !== "N/A" ? `${ratio}%` : "N/A",
        impact: Math.min(score + (score * 0.15), 95),
        negative: score > 50
      },
      {
        name: income < 50000 ? "Insufficient Income for Requested Line" : "Stable Income Profile",
        value: `$${income.toLocaleString()}`,
        impact: income < 50000 ? 72 : 25,
        negative: income < 50000
      },
      {
        name: age > 0 && age < 25 ? "Limited Credit History (Young Age)" : "Employment Stability",
        value: age > 0 ? `${age} years` : "N/A",
        impact: (age > 0 && age < 25) ? 58 : ((app.person_emp_length || 0) < 1 ? 45 : 20),
        negative: (age > 0 && age < 25) || ((app.person_emp_length || 0) < 1)
      }
    ].sort((a, b) => b.impact - a.impact).slice(0, 3);
    
    return factors;
  };

  const handleSendToManualReview = async (app: LoanApplication) => {
    const { error } = await supabase
      .from("loan_applications")
      .update({ status: "pending_review" })
      .eq("id", app.id);
    if (error) {
      toast({ title: "Error", description: "Failed to send to manual review", variant: "destructive" });
    } else {
      toast({ title: "Sent to Manual Review", description: "Application will be reviewed by a human" });
      setApplications((prev) => prev.map((a) => a.id === app.id ? { ...a, status: "pending_review" } : a));
    }
  };

  return (
    <DashboardLayout>
      <TooltipProvider>
        <div className="space-y-6 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Portfolio Ledger - All Applications</h1>
              <p className="text-muted-foreground mt-1">Comprehensive credit risk assessment overview</p>
            </div>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6 gap-2" onClick={() => window.location.href = "/assess"}>
              <Plus className="h-4 w-4" />
              Create New Assessment
            </Button>
          </div>

          {/* Filter Bar */}
          <div className="space-y-3">
            {/* Search + Filter Button Row */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by customer ID, name, email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("gap-2", activeFilterCount > 0 && "border-primary bg-primary/5")}>
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                    {activeFilterCount > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                        {activeFilterCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                  <div className="p-4 space-y-5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm">Filters</h3>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={clearAllFilters}>
                        Clear all
                      </Button>
                    </div>

                    {/* Date Range */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Date Range</label>
                      <div className="flex gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="flex-1 justify-start text-left font-normal">
                              <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                              {dateFrom ? format(dateFrom, "MMM dd, yyyy") : "From date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={dateFrom}
                              onSelect={setDateFrom}
                              initialFocus
                              className="p-3 pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="flex-1 justify-start text-left font-normal">
                              <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                              {dateTo ? format(dateTo, "MMM dd, yyyy") : "To date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={dateTo}
                              onSelect={setDateTo}
                              initialFocus
                              className="p-3 pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    {/* Income Range */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Income Range</label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Min"
                          value={incomeMin}
                          onChange={(e) => setIncomeMin(e.target.value)}
                          className="h-8"
                          type="number"
                        />
                        <Input
                          placeholder="Max"
                          value={incomeMax}
                          onChange={(e) => setIncomeMax(e.target.value)}
                          className="h-8"
                          type="number"
                        />
                      </div>
                    </div>

                    {/* Loan Amount Range */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Loan Amount</label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Min"
                          value={creditMin}
                          onChange={(e) => setCreditMin(e.target.value)}
                          className="h-8"
                          type="number"
                        />
                        <Input
                          placeholder="Max"
                          value={creditMax}
                          onChange={(e) => setCreditMax(e.target.value)}
                          className="h-8"
                          type="number"
                        />
                      </div>
                    </div>

                    {/* Risk Score Range */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Risk Score (%)</label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Min"
                          value={riskScoreMin}
                          onChange={(e) => setRiskScoreMin(e.target.value)}
                          className="h-8"
                          type="number"
                          min="0"
                          max="100"
                        />
                        <Input
                          placeholder="Max"
                          value={riskScoreMax}
                          onChange={(e) => setRiskScoreMax(e.target.value)}
                          className="h-8"
                          type="number"
                          min="0"
                          max="100"
                        />
                      </div>
                    </div>

                    {/* Decision */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Decision</label>
                      <Select value={filter} onValueChange={(v) => setFilter(v as "all" | "APPROVED" | "REJECTED" | "PENDING")}>
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="All decisions" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Decisions</SelectItem>
                          <SelectItem value="APPROVED">Approved</SelectItem>
                          <SelectItem value="REJECTED">Rejected</SelectItem>
                          <SelectItem value="PENDING">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={clearAllFilters}>
                  <X className="h-3.5 w-3.5" />
                  Clear all
                </Button>
              )}
            </div>

            {/* Decision Pill Tabs */}
            <div className="flex items-center gap-1.5">
              {(["all", "APPROVED", "REJECTED", "PENDING"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                    filter === status
                      ? status === "APPROVED"
                        ? "bg-success/15 text-success"
                        : status === "REJECTED"
                        ? "bg-destructive/15 text-destructive"
                        : status === "PENDING"
                        ? "bg-warning/15 text-warning"
                        : "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {status === "all" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
                  {status !== "all" && (
                    <span className="ml-1.5 opacity-70">
                      ({applications.filter((a) => getDecision(a) === status).length})
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Active Filter Tags */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {dateFrom && (
                  <span className="inline-flex items-center gap-1.5 rounded-md border bg-muted/50 px-2.5 py-1 text-xs">
                    <span className="font-medium">From: {format(dateFrom, "MMM dd, yyyy")}</span>
                    <button onClick={() => setDateFrom(undefined)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {dateTo && (
                  <span className="inline-flex items-center gap-1.5 rounded-md border bg-muted/50 px-2.5 py-1 text-xs">
                    <span className="font-medium">To: {format(dateTo, "MMM dd, yyyy")}</span>
                    <button onClick={() => setDateTo(undefined)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {(incomeMin || incomeMax) && (
                  <span className="inline-flex items-center gap-1.5 rounded-md border bg-muted/50 px-2.5 py-1 text-xs">
                    <span className="font-medium">Income: ${incomeMin || "0"} - ${incomeMax || "∞"}</span>
                    <button onClick={() => { setIncomeMin(""); setIncomeMax(""); }} className="text-muted-foreground hover:text-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {(creditMin || creditMax) && (
                  <span className="inline-flex items-center gap-1.5 rounded-md border bg-muted/50 px-2.5 py-1 text-xs">
                    <span className="font-medium">Loan: ${creditMin || "0"} - ${creditMax || "∞"}</span>
                    <button onClick={() => { setCreditMin(""); setCreditMax(""); }} className="text-muted-foreground hover:text-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {(riskScoreMin || riskScoreMax) && (
                  <span className="inline-flex items-center gap-1.5 rounded-md border bg-muted/50 px-2.5 py-1 text-xs">
                    <span className="font-medium">Risk: {riskScoreMin || "0"}% - {riskScoreMax || "100"}%</span>
                    <button onClick={() => { setRiskScoreMin(""); setRiskScoreMax(""); }} className="text-muted-foreground hover:text-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Data Table */}
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              <div className="relative">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="font-medium text-muted-foreground">Date</TableHead>
                      <TableHead className="font-medium text-muted-foreground">Customer ID</TableHead>
                      <TableHead className="font-medium text-muted-foreground">Name</TableHead>
                      <TableHead className="text-right font-medium text-muted-foreground">Income</TableHead>
                      <TableHead className="text-right font-medium text-muted-foreground">Loan Amount</TableHead>
                      <TableHead className="text-right font-medium text-muted-foreground">Risk Score</TableHead>
                      <TableHead className="font-medium text-muted-foreground">Decision</TableHead>
                      <TableHead className="w-8"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12">
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            <span className="text-muted-foreground">Loading applications...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                    {!loading && filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                          No applications found matching your criteria
                        </TableCell>
                      </TableRow>
                    )}
                    {!loading && filtered.map((app) => {
                      const decision = getDecision(app);
                      const riskScore = getRiskScore(app);
                      const riskLevel = getRiskLevel(riskScore);
                      
                      return (
                        <TableRow
                          key={app.id}
                          className="border-border hover:bg-muted/30 cursor-pointer transition-colors"
                          onClick={() => setSelectedApplication(app)}
                        >
                          <TableCell className="font-mono text-sm text-muted-foreground">
                            {app.created_at ? new Date(app.created_at).toLocaleDateString() : "N/A"}
                          </TableCell>
                          <TableCell className="font-mono text-sm font-medium">
                            {app.customer_id || app.id.slice(0, 8).toUpperCase()}
                          </TableCell>
                          <TableCell className="text-sm">
                            {app.full_name || app.email || "N/A"}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {app.person_income ? `$${app.person_income.toLocaleString()}` : "N/A"}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {app.loan_amount ? `$${app.loan_amount.toLocaleString()}` : "N/A"}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm font-medium">
                            {riskScore.toFixed(1)}% <span className="text-xs text-muted-foreground">({riskLevel})</span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={decision === "APPROVED" ? "default" : decision === "REJECTED" ? "destructive" : "outline"}
                              className={cn(
                                "font-medium px-3 py-1",
                                decision === "APPROVED" 
                                  ? "bg-success/15 text-success border-success/30 hover:bg-success/20" 
                                  : decision === "REJECTED"
                                  ? "bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/20"
                                  : "bg-muted text-muted-foreground border-border"
                              )}
                            >
                              {decision}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-muted-foreground hover:text-accent cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent side="left" className="max-w-sm">
                                <p className="text-xs">
                                  Click to view detailed application information and risk analysis.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Application Details Side Panel */}
        <Sheet open={!!selectedApplication} onOpenChange={(open) => !open && setSelectedApplication(null)}>
          <SheetContent className="w-[35%] min-w-[500px] bg-card border-l-border p-0">
            {selectedApplication && (
              <>
                <SheetHeader className="space-y-4 px-6 pt-6 pb-4">
                  <div className="space-y-2">
                    <SheetTitle className="text-lg font-semibold">
                      {selectedApplication.customer_id || selectedApplication.id.slice(0, 8).toUpperCase()}
                    </SheetTitle>
                    <div className={cn(
                      "inline-flex items-center px-3 py-2 rounded-md border text-sm font-medium",
                      getDecision(selectedApplication) === "REJECTED" 
                        ? "bg-destructive/10 text-destructive border-destructive/30" 
                        : getDecision(selectedApplication) === "APPROVED"
                        ? "bg-success/10 text-success border-success/30"
                        : "bg-muted text-muted-foreground border-border"
                    )}>
                      STATUS: {getDecision(selectedApplication)}
                    </div>
                  </div>
                </SheetHeader>

                <ScrollArea className="h-[calc(100vh-8rem)] px-6 pb-6">
                  <div className="space-y-6">
                  {/* Contact Info */}
                  {selectedApplication.full_name && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                        Contact Information
                      </h3>
                      <div className="space-y-2 text-sm">
                        {selectedApplication.full_name && <p><span className="text-muted-foreground">Name:</span> {selectedApplication.full_name}</p>}
                        {selectedApplication.email && <p><span className="text-muted-foreground">Email:</span> {selectedApplication.email}</p>}
                        {selectedApplication.phone && <p><span className="text-muted-foreground">Phone:</span> {selectedApplication.phone}</p>}
                        {selectedApplication.person_age && <p><span className="text-muted-foreground">Age:</span> {selectedApplication.person_age}</p>}
                      </div>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => handleSendToManualReview(selectedApplication)}
                  >
                    <ClipboardList className="h-4 w-4" />
                    Send to Manual Review
                  </Button>

                  {/* Financial Profile Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                      Financial Profile
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Annual Income</p>
                        <p className="text-lg font-mono font-semibold">
                          {selectedApplication.person_income ? `$${selectedApplication.person_income.toLocaleString()}` : "N/A"}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Loan Amount</p>
                        <p className="text-lg font-mono font-semibold">
                          {selectedApplication.loan_amount ? `$${selectedApplication.loan_amount.toLocaleString()}` : "N/A"}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Employment Status</p>
                        <p className="text-sm font-medium">{selectedApplication.employment_status || "N/A"}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Credit Score</p>
                        <p className="text-sm font-medium">{selectedApplication.credit_score || "N/A"}</p>
                      </div>
                      {selectedApplication.monthly_expenses && (
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Monthly Expenses</p>
                          <p className="text-sm font-mono">${selectedApplication.monthly_expenses.toLocaleString()}</p>
                        </div>
                      )}
                      {selectedApplication.existing_debt && (
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Existing Debt</p>
                          <p className="text-sm font-mono">${selectedApplication.existing_debt.toLocaleString()}</p>
                        </div>
                      )}
                      {selectedApplication.loan_int_rate && (
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Interest Rate</p>
                          <p className="text-sm font-mono">{selectedApplication.loan_int_rate}%</p>
                        </div>
                      )}
                      {selectedApplication.loan_term && (
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Loan Term</p>
                          <p className="text-sm font-mono">{selectedApplication.loan_term} months</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Model Explainability Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                      Key Risk Factors
                    </h3>
                    {selectedApplication.shap_explanation ? (
                      <div className="space-y-4">
                        {(() => {
                          const shap = selectedApplication.shap_explanation as Record<string, unknown>;
                          const riskFactors = (shap.top_risk_factors as [string, number][]) || [];
                          const protectFactors = (shap.top_protect_factors as [string, number][]) || [];
                          return (
                            <>
                              {riskFactors.length > 0 && (
                                <div className="space-y-3">
                                  <p className="text-xs font-medium text-destructive flex items-center gap-1">
                                    <TrendingUp className="h-3.5 w-3.5" /> Risk Drivers
                                  </p>
                                  {riskFactors.slice(0, 5).map(([name, val], i) => (
                                    <div key={i} className="space-y-1">
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm text-foreground">{name}</span>
                                        <span className="text-xs font-mono text-destructive">+{val.toFixed(4)}</span>
                                      </div>
                                      <Progress
                                        value={Math.min(Math.abs(val) * 100, 100)}
                                        className="h-2 bg-destructive/20"
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}
                              {protectFactors.length > 0 && (
                                <div className="space-y-3">
                                  <p className="text-xs font-medium text-success flex items-center gap-1">
                                    <TrendingDown className="h-3.5 w-3.5" /> Protective Factors
                                  </p>
                                  {protectFactors.slice(0, 5).map(([name, val], i) => (
                                    <div key={i} className="space-y-1">
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm text-foreground">{name}</span>
                                        <span className="text-xs font-mono text-success">{val.toFixed(4)}</span>
                                      </div>
                                      <Progress
                                        value={Math.min(Math.abs(val) * 100, 100)}
                                        className="h-2 bg-success/20"
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {getRiskFactors(selectedApplication).map((factor, index) => (
                          <div key={index} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-foreground">
                                {factor.name}
                              </span>
                              <span className="text-xs font-mono text-muted-foreground">
                                {factor.negative ? '+' : '-'}{factor.impact.toFixed(1)}%
                              </span>
                            </div>
                            <div className="space-y-1">
                              <Progress 
                                value={factor.impact} 
                                className={cn(
                                  "h-2",
                                  factor.negative ? "bg-destructive/20" : "bg-success/20"
                                )}
                              />
                              <p className="text-xs text-muted-foreground">{factor.value}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  </div>
                </ScrollArea>
              </>
            )}
          </SheetContent>
        </Sheet>
      </TooltipProvider>
    </DashboardLayout>
  );
}
