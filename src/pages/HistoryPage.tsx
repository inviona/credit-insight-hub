import { useMemo, useState } from "react";
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
import { Search, Filter, Calendar as CalendarIcon, Plus, Info } from "lucide-react";
import { generateMockHistory } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function HistoryPage() {
  const allHistory = useMemo(() => generateMockHistory(50), []);
  const [filter, setFilter] = useState<"all" | "APPROVED" | "REJECTED">("all");
  const [search, setSearch] = useState("");
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  
  // Enhanced filter states
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [incomeMin, setIncomeMin] = useState("");
  const [incomeMax, setIncomeMax] = useState("");
  const [creditMin, setCreditMin] = useState("");
  const [creditMax, setCreditMax] = useState("");
  const [riskScoreMin, setRiskScoreMin] = useState("");
  const [riskScoreMax, setRiskScoreMax] = useState("");

  const filtered = useMemo(() => {
    let data = allHistory;
    
    // Decision filter
    if (filter !== "all") data = data.filter((h) => h.decision === filter);
    
    // Search filter
    if (search) {
      const s = search.toLowerCase();
      data = data.filter((h) =>
        h.id.toLowerCase().includes(s) ||
        h.amt_income.toString().includes(s) ||
        h.amt_credit.toString().includes(s) ||
        h.risk_level.toLowerCase().includes(s)
      );
    }
    
    // Date range filter
    if (dateFrom) {
      data = data.filter((h) => new Date(h.created_at) >= dateFrom);
    }
    if (dateTo) {
      data = data.filter((h) => new Date(h.created_at) <= dateTo);
    }
    
    // Income range filter
    if (incomeMin) {
      data = data.filter((h) => h.amt_income >= parseInt(incomeMin));
    }
    if (incomeMax) {
      data = data.filter((h) => h.amt_income <= parseInt(incomeMax));
    }
    
    // Credit range filter
    if (creditMin) {
      data = data.filter((h) => h.amt_credit >= parseInt(creditMin));
    }
    if (creditMax) {
      data = data.filter((h) => h.amt_credit <= parseInt(creditMax));
    }
    
    // Risk score range filter
    if (riskScoreMin) {
      data = data.filter((h) => (h.adj_probability * 100) >= parseFloat(riskScoreMin));
    }
    if (riskScoreMax) {
      data = data.filter((h) => (h.adj_probability * 100) <= parseFloat(riskScoreMax));
    }
    
    return data;
  }, [allHistory, filter, search, dateFrom, dateTo, incomeMin, incomeMax, creditMin, creditMax, riskScoreMin, riskScoreMax]);

  // Generate risk factors for selected application
  const getRiskFactors = (app: any) => {
    const debtToIncomeRatio = ((app.amt_credit / app.amt_income) * 100).toFixed(1);
    const factors = [
      {
        name: "High Debt-to-Income Ratio",
        value: `${debtToIncomeRatio}%`,
        impact: parseFloat(debtToIncomeRatio) > 40 ? 85 : 45,
        negative: parseFloat(debtToIncomeRatio) > 40
      },
      {
        name: app.amt_income < 50000 ? "Insufficient Income for Requested Line" : "Stable Income Profile",
        value: `$${app.amt_income.toLocaleString()}`,
        impact: app.amt_income < 50000 ? 72 : 25,
        negative: app.amt_income < 50000
      },
      {
        name: app.age_years < 25 ? "Limited Credit History (Young Age)" : "Mature Credit Profile",
        value: `${app.age_years} years`,
        impact: app.age_years < 25 ? 58 : 20,
        negative: app.age_years < 25
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
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6 gap-2">
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
                      placeholder="Search applications..."
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
                    placeholder="Min Credit"
                    value={creditMin}
                    onChange={(e) => setCreditMin(e.target.value)}
                    className="bg-background/50"
                    type="number"
                  />
                  <Input
                    placeholder="Max Credit"
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
                <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Decision" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Decisions</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
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
                      <TableHead className="font-medium text-muted-foreground">Applicant ID</TableHead>
                      <TableHead className="text-right font-medium text-muted-foreground">Income</TableHead>
                      <TableHead className="text-right font-medium text-muted-foreground">Credit Requested</TableHead>
                      <TableHead className="text-right font-medium text-muted-foreground">Risk Score (%)</TableHead>
                      <TableHead className="font-medium text-muted-foreground">Decision</TableHead>
                      <TableHead className="w-8"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                          No applications found matching your criteria
                        </TableCell>
                      </TableRow>
                    )}
                    {filtered.map((app) => (
                      <TableRow
                        key={app.id}
                        className="border-border hover:bg-muted/30 cursor-pointer transition-colors"
                        onClick={() => setSelectedApplication(app)}
                      >
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {new Date(app.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-mono text-sm font-medium">
                          {app.id.slice(0, 8).toUpperCase()}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          ${app.amt_income.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          ${app.amt_credit.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-medium">
                          {(app.adj_probability * 100).toFixed(1)}%
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={app.decision === "APPROVED" ? "default" : "destructive"}
                            className={cn(
                              "font-medium px-3 py-1",
                              app.decision === "APPROVED" 
                                ? "bg-success/15 text-success border-success/30 hover:bg-success/20" 
                                : "bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/20"
                            )}
                          >
                            {app.decision}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground hover:text-accent cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="left" className="max-w-sm">
                              <p className="text-xs">
                                Clicking any chart in the system opens a focused, full-screen modal with an expanded chart view and an AI-generated text summary explaining the current trend and anomalies.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
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
                      Application {selectedApplication.id.slice(0, 8).toUpperCase()}
                    </SheetTitle>
                    <div className={cn(
                      "inline-flex items-center px-3 py-2 rounded-md border text-sm font-medium",
                      selectedApplication.decision === "REJECTED" 
                        ? "bg-destructive/10 text-destructive border-destructive/30" 
                        : "bg-success/10 text-success border-success/30"
                    )}>
                      DEFAULT PREDICTION: {selectedApplication.decision}
                    </div>
                  </div>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                  {/* Financial Profile Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                      Financial Profile
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Annual Income</p>
                        <p className="text-lg font-mono font-semibold">${selectedApplication.amt_income.toLocaleString()}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Credit Requested</p>
                        <p className="text-lg font-mono font-semibold">${selectedApplication.amt_credit.toLocaleString()}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Employment Status</p>
                        <p className="text-sm font-medium">Working</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Debt-to-Income Ratio</p>
                        <p className="text-sm font-medium">{((selectedApplication.amt_credit / selectedApplication.amt_income) * 100).toFixed(1)}%</p>
                      </div>
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
                              {factor.negative ? '+' : '-'}{(factor.impact * (selectedApplication.adj_probability)).toFixed(1)}%
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

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-border">
                    <Button variant="outline" className="flex-1">
                      Add to Manual Review
                    </Button>
                    <Button variant="default" className="flex-1">
                      Override Decision
                    </Button>
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