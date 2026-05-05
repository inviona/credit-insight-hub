import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { type PersonalPrecheckResult } from "@/lib/personal-precheck-schema";

function bandStyles(band: PersonalPrecheckResult["band"]) {
  if (band === "Likely Approved") {
    return {
      badgeClass: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
    };
  }
  if (band === "Borderline") {
    return {
      badgeClass: "bg-amber-500/15 text-amber-600 border-amber-500/30",
      icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
    };
  }
  return {
    badgeClass: "bg-rose-500/15 text-rose-600 border-rose-500/30",
    icon: <XCircle className="h-5 w-5 text-rose-500" />,
  };
}

export function PersonalEligibilityResult({ result }: { result: PersonalPrecheckResult }) {
  const style = bandStyles(result.band);

  return (
    <Card>
      <CardHeader className="space-y-3">
        <CardTitle className="flex items-center gap-2 text-xl">Your Pre-Check Result</CardTitle>
        <div className="flex items-center gap-3">
          {style.icon}
          <Badge variant="outline" className={style.badgeClass}>
            {result.band}
          </Badge>
          <span className="text-sm text-muted-foreground">Score: {result.score}/100</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <h3 className="font-medium mb-2">What influenced this result</h3>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            {result.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-medium mb-2">How to improve approval chance</h3>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            {result.recommendations.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
