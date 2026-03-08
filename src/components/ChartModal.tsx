import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ChartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  analysis: string;
  chart: React.ReactNode;
  trend?: "up" | "down" | "stable";
}

export function ChartModal({ open, onOpenChange, title, description, analysis, chart, trend }: ChartModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-[#1E222D] border border-[#2A2E39]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
              {title}
              {trend && (
                <Badge variant={trend === "up" ? "default" : trend === "down" ? "destructive" : "secondary"} className="text-xs">
                  {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trend}
                </Badge>
              )}
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Chart Container */}
          <div className="bg-[#131722] border border-[#2A2E39] rounded-lg p-6">
            {chart}
          </div>

          {/* AI Analysis Section */}
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-2 bg-primary/10 rounded-md">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  AI-Generated Analysis
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {analysis}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
