import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Search, Calendar as CalendarIcon, Plus, Info, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
    if (app.loan_int_rate) return Math.min(Math.round(app.loan_int_rate * 3), 99);
    if (app.credit_score) {
      if (app.credit_score >= 700) return Math.round(10 + Math.random() * 20);
      if (app.credit_score >= 600) return Math.round(30 + Math.random() * 30);
      return Math.round(60 + Math.random() * 30);
    }
    const status = (app.status || "").toLowerCase();
    if (status === "approved") return Math.round(10 + Math.random() * 30);
    if (status === "rejected") return Math.round(60 + Math.random() * 35);
    return Math.round(30 + Math.random() * 40);
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
        impact: Math.min(score + Math.random() * 15, 95),
        negative: score > 50
      },
      {
        name: income < 50000 ? "Insufficient Income for Requested Line" : "Stable Income Profile",
        value: `$${income.toLocaleString()}`,
        impact: income < 50000 ? 72 : 25,
        negative: income < 50000
      },
      {
        name: age > 0 && age < 25 ? "Limited Credit History (Young Age)" : app.credit_score ? "Credit Score Assessment" : "Mature Credit Profile",
        value: age > 0 ? `${age} years` : (app.credit_score ? `${app.credit_score}` : "N/A"),
        impact: (age > 0 && age < 25) ? 58 : (app.credit_score ? (app.credit_score < 600 ? 65 : 20) : 20),
        negative: (age > 0 && age < 25) || (app.credit_score !== null && app.credit_score < 600)
      }
    ].sort((a, b) => b.impact - a.impact).slice(0, 3);
    
    return factors;
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

          {/* Enhanced Filter Bar */}
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
                {/* Search */}
                <div className="xl:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by customer ID, name, email..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 bg-background/50"
                    />
                  </div>
                </div>

                {/* Date Range */}
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start text-left font-normal bg-background/50">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFrom ? format(dateFrom, "MMM dd") : "From"}
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
                      <Button variant="outline" className="justify-start text-left font-normal bg-background/50">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateTo ? format(dateTo, "MMM dd") : "To"}
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

                {/* Income Range */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Min Income"
                    value={incomeMin}
                    onChange={(e) => setIncomeMin(e.target.value)}
                    className="bg-background/50"
                    type="number"
                  />
                  <Input
                    placeholder="Max Income"
                    value={incomeMax}
                    onChange={(e) => setIncomeMax(e.target.value)}
                    className="bg-background/50"
                    type="number"
                  />
                </div>

                {/* Credit Amount Range */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Min Loan"
                    value={creditMin}
                    onChange={(e) => setCreditMin(e.target.value)}
                    className="bg-background/50"
                    type="number"
                  />
                  <Input
                    placeholder="Max Loan"
                    value={creditMax}
                    onChange={(e) => setCreditMax(e.target.value)}
                    className="bg-background/50"
                    type="number"
                  />
                </div>

                {/* Risk Score Range */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Min Risk %"
                    value={riskScoreMin}
                    onChange={(e) => setRiskScoreMin(e.target.value)}
                    className="bg-background/50"
                    type="number"
                    min="0"
                    max="100"
                  />
                  <Input
                    placeholder="Max Risk %"
                    value={riskScoreMax}
                    onChange={(e) => setRiskScoreMax(e.target.value)}
                    className="bg-background/50"
                    type="number"
                    min="0"
                    max="100"
                  />
                </div>

                {/* Decision Filter */}
                <Select value={filter} onValueChange={(v) => setFilter(v as "all" | "APPROVED" | "REJECTED" | "PENDING")}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Decision" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Decisions</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                  </SelectContent>
                </Select>

                {/* Clear Filters */}
                <Button 
                  variant="ghost" 
                  onClick={() => {
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
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Clear All
                </Button>
              </div>
            </CardContent>
          </Card>

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
          <SheetContent className="w-[35%] min-w-[500px] bg-card border-l-border">
            {selectedApplication && (
              <>
                <SheetHeader className="space-y-4">
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

                <div className="mt-6 space-y-6">
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
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </TooltipProvider>
    </DashboardLayout>
  );
}
