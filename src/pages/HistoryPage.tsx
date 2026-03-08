import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Download, ChevronDown, Search } from "lucide-react";
import { generateMockHistory } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function HistoryPage() {
  const allHistory = useMemo(() => generateMockHistory(40), []);
  const [filter, setFilter] = useState<"all" | "APPROVED" | "REJECTED">("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let data = allHistory;
    if (filter !== "all") data = data.filter((h) => h.decision === filter);
    if (search) {
      const s = search.toLowerCase();
      data = data.filter((h) =>
        h.amt_income.toString().includes(s) ||
        h.amt_credit.toString().includes(s) ||
        h.risk_level.toLowerCase().includes(s)
      );
    }
    return data;
  }, [allHistory, filter, search]);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Assessment History</h1>
            <p className="text-sm text-muted-foreground">All past credit risk assessments</p>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by income, credit, risk level…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
            <SelectTrigger className="w-40 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Decisions</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Income</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead className="text-right">Annuity</TableHead>
                  <TableHead className="text-right">Age</TableHead>
                  <TableHead className="text-right">Risk Score</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Decision</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No assessments found
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((app) => (
                  <Collapsible key={app.id} open={expandedId === app.id} onOpenChange={(open) => setExpandedId(open ? app.id : null)} asChild>
                    <>
                      <CollapsibleTrigger asChild>
                        <TableRow className="cursor-pointer">
                          <TableCell>
                            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", expandedId === app.id && "rotate-180")} />
                          </TableCell>
                          <TableCell className="font-mono-numbers text-xs">{new Date(app.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right font-mono-numbers">${app.amt_income.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-mono-numbers">${app.amt_credit.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-mono-numbers">${app.amt_annuity.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-mono-numbers">{app.age_years}</TableCell>
                          <TableCell className="text-right font-mono-numbers">{(app.adj_probability * 100).toFixed(1)}%</TableCell>
                          <TableCell>
                            <span className={cn(
                              "text-xs font-medium",
                              app.risk_level === "Low" && "text-success",
                              app.risk_level === "Moderate" && "text-accent",
                              app.risk_level === "Elevated" && "text-warning",
                              app.risk_level === "High" && "text-destructive",
                            )}>{app.risk_level}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={app.decision === "APPROVED" ? "default" : "destructive"} className={cn(
                              "text-xs",
                              app.decision === "APPROVED" && "bg-success/15 text-success border-success/30 hover:bg-success/20"
                            )}>
                              {app.decision}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      </CollapsibleTrigger>
                      <CollapsibleContent asChild>
                        <TableRow>
                          <TableCell colSpan={9} className="bg-muted/20 px-8 py-4">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Business Rule Notes</p>
                            <div className="flex flex-wrap gap-2">
                              {app.business_notes.map((note, i) => (
                                <span key={i} className="text-xs px-2.5 py-1 rounded-md bg-muted/50 border border-border text-muted-foreground">
                                  {note}
                                </span>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      </CollapsibleContent>
                    </>
                  </Collapsible>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
