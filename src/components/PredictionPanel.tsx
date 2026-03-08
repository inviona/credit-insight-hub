import { X, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { ShapChart } from "./ShapChart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PredictionResult } from "@/lib/mock-data";

interface PredictionPanelProps {
  result: PredictionResult;
  onClose: () => void;
}

export function PredictionPanel({ result, onClose }: PredictionPanelProps) {
  const isApproved = result.decision === "APPROVED";

  const riskColor = {
    Low: "text-success",
    Moderate: "text-accent",
    Elevated: "text-warning",
    High: "text-destructive",
  }[result.risk_level] ?? "text-muted-foreground";

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-card border-l border-border shadow-2xl overflow-y-auto animate-slide-in-right">
      <div className="sticky top-0 z-10 flex items-center justify-between bg-card/95 backdrop-blur p-4 border-b border-border">
        <h2 className="text-lg font-semibold">Assessment Result</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="p-6 space-y-8">
        {/* Decision Badge */}
        <div className="text-center space-y-4">
          <div className={cn(
            "inline-flex items-center gap-3 px-6 py-4 rounded-xl text-2xl font-bold",
            isApproved ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
          )}>
            {isApproved ? <CheckCircle2 className="h-8 w-8" /> : <XCircle className="h-8 w-8" />}
            {result.decision}
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Raw Model</p>
              <p className="text-xl font-mono-numbers font-bold">{(result.raw_probability * 100).toFixed(1)}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Adjusted</p>
              <p className="text-xl font-mono-numbers font-bold">{(result.adjusted_probability * 100).toFixed(1)}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Risk Level</p>
              <p className={cn("text-xl font-bold", riskColor)}>{result.risk_level}</p>
            </div>
          </div>
        </div>

        {/* SHAP Explanation */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Key Risk Drivers — AI Explanation
          </h3>
          <ShapChart
            riskFactors={result.shap_info.top_risk_factors}
            protectFactors={result.shap_info.top_protect_factors}
          />
        </div>

        {/* Business Rules */}
        {result.notes.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Business Rule Adjustments
            </h3>
            <div className="flex flex-wrap gap-2">
              {result.notes.map((note, i) => (
                <Badge key={i} variant="outline" className="text-xs py-1.5 px-3 border-border bg-muted/30 text-foreground font-normal max-w-full">
                  <AlertTriangle className="h-3 w-3 mr-1.5 text-warning shrink-0" />
                  <span className="truncate">{note}</span>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Prepayment Warning */}
        {result.prepayment_risk && (
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
            <p className="text-sm text-warning font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Prepayment / Refinancing Risk Detected
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Loan rate significantly exceeds current market rate — borrower may refinance early.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
