import { useState, useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Download, CheckCircle2, AlertCircle, Info, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { submitBatch } from "@/lib/api";
import Papa from "papaparse";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ShapChart } from "@/components/ShapChart";

type ShapInfo = {
  top_risk_factors: [string, number][];
  top_protect_factors: [string, number][];
};

type PredictionResult = {
  id?: number;
  _db_id?: string | null;
  applicant_name?: string;
  amt_income_total: number;
  amt_credit: number;
  amt_annuity: number;
  age_years?: number;
  years_employed?: number;
  code_gender?: string;
  ext_source_1?: number;
  ext_source_2?: number;
  ext_source_3?: number;
  default_risk_score: number;
  prediction_result: string;
  confidence_level?: number;
  shap_info?: ShapInfo;
};

export default function BatchPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "processing" | "done" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [results, setResults] = useState<PredictionResult[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedResult, setSelectedResult] = useState<PredictionResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (!f.name.endsWith('.csv')) {
      toast({ title: "Invalid file", description: "Please upload a CSV file", variant: "destructive" });
      return;
    }
    setFile(f);
    setStatus("idle");
    setProgress(0);
    setResults([]);
    setErrorMsg("");
  };

  const handleProcess = async () => {
    if (!file) return;
    
    setStatus("processing");
    setProgress(10);
    setErrorMsg("");

    try {
      // Step 1: Send to Flask backend for prediction (30% progress)
      const response = await submitBatch(file);
      setProgress(40);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend response:", errorText);
        throw new Error(`Backend error: ${errorText || response.statusText}`);
      }

      // Step 2: Parse the response - expecting JSON array of predictions
      const responseText = await response.text();
      console.log("Backend response:", responseText);
      
      let predictions;
      try {
        predictions = JSON.parse(responseText);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        throw new Error("Invalid response format from prediction service");
      }
      
      setProgress(60);

      if (!Array.isArray(predictions) || predictions.length === 0) {
        throw new Error("No predictions returned from model");
      }

      // Step 3: Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("You must be logged in to save batch predictions");
      }

      // Step 4: Generate batch ID
      const batchId = crypto.randomUUID();
      setProgress(70);

      // Step 5: Save all predictions to database
      const applicationsToInsert = predictions.map((pred: Record<string, unknown>) => ({
        user_id: user.id,
        full_name: pred.id ? `Applicant ${pred.id}` : (pred.applicant_name || pred.full_name || null),
        person_income: parseFloat(pred.amt_income_total || pred.AMT_INCOME_TOTAL || pred.person_income || pred.PERSON_INCOME || "0"),
        person_age: pred.age_years || pred.AGE_YEARS || pred.person_age || pred.PERSON_AGE ? parseInt(pred.age_years || pred.AGE_YEARS || pred.person_age || pred.PERSON_AGE) : null,
        person_emp_length: pred.years_employed || pred.YEARS_EMPLOYED || pred.person_emp_length || pred.PERSON_EMP_LENGTH ? parseFloat(pred.years_employed || pred.YEARS_EMPLOYED || pred.person_emp_length || pred.PERSON_EMP_LENGTH) : null,
        loan_amount: parseFloat(pred.amt_credit || pred.AMT_CREDIT || pred.loan_amount || pred.LOAN_AMOUNT || "0"),
        loan_int_rate: pred.loan_int_rate || pred.LOAN_INT_RATE ? parseFloat(pred.loan_int_rate || pred.LOAN_INT_RATE) : null,
        loan_term: pred.loan_term || pred.LOAN_TERM ? parseInt(pred.loan_term || pred.LOAN_TERM) : null,
        credit_score: pred.ext_source_1 || pred.EXT_SOURCE_1 || pred.credit_score || pred.CREDIT_SCORE ? parseInt(pred.ext_source_1 || pred.EXT_SOURCE_1 || pred.credit_score || pred.CREDIT_SCORE) : null,
        num_credit_lines: pred.ext_source_2 || pred.EXT_SOURCE_2 || pred.num_credit_lines || pred.NUM_CREDIT_LINES ? parseInt(pred.ext_source_2 || pred.EXT_SOURCE_2 || pred.num_credit_lines || pred.NUM_CREDIT_LINES) : null,
        cb_person_cred_hist_length: pred.ext_source_3 || pred.EXT_SOURCE_3 || pred.cb_person_cred_hist_length || pred.CB_PERSON_CRED_HIST_LENGTH ? parseInt(pred.ext_source_3 || pred.EXT_SOURCE_3 || pred.cb_person_cred_hist_length || pred.CB_PERSON_CRED_HIST_LENGTH) : null,
        monthly_expenses: pred.amt_annuity || pred.AMT_ANNUITY || pred.monthly_expenses || pred.MONTHLY_EXPENSES ? parseFloat(pred.amt_annuity || pred.AMT_ANNUITY || pred.monthly_expenses || pred.MONTHLY_EXPENSES) : null,
        status: pred.prediction_result || pred.prediction || pred.status ? (pred.prediction_result || pred.prediction || pred.status).toLowerCase() : "pending",
        risk_score: pred.default_risk_score != null ? parseFloat(pred.default_risk_score as string) : null,
        shap_explanation: pred.shap_info || null,
      }));

      const { data: insertedRows, error: insertError } = await supabase
        .from('loan_applications')
        .insert(applicationsToInsert)
        .select('id');

      if (insertError) {
        console.error("Database insert error:", insertError);
        throw new Error(`Failed to save predictions: ${insertError.message}`);
      }

      // Attach DB IDs to results so we can send to manual review
      const resultsWithIds = predictions.map((pred: PredictionResult, idx: number) => ({
        ...pred,
        _db_id: insertedRows?.[idx]?.id || null,
      }));

      setProgress(100);
      setResults(resultsWithIds);
      setStatus("done");
      
      toast({ 
        title: "Batch processed successfully", 
        description: `${predictions.length} applications processed and saved` 
      });

    } catch (error) {
      console.error("Batch processing error:", error);
      setStatus("error");
      setErrorMsg(error instanceof Error ? error.message : "Failed to process batch upload");
      toast({ 
        title: "Processing failed", 
        description: error.message || "An error occurred", 
        variant: "destructive" 
      });
    }
  };

  const handleSendToManualReview = async (result: PredictionResult) => {
    if (!result._db_id) {
      toast({ title: "Not saved yet", description: "This application hasn't been saved to the database", variant: "destructive" });
      return;
    }
    const { error } = await supabase
      .from("loan_applications")
      .update({ status: "pending_review" })
      .eq("id", result._db_id);
    if (error) {
      toast({ title: "Error", description: "Failed to send to manual review", variant: "destructive" });
    } else {
      toast({ title: "Sent to Manual Review", description: "Application will be reviewed by a human" });
    }
  };

  const downloadResults = () => {
    if (results.length === 0) return;
    
    const csv = Papa.unparse(results);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `predictions_${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Batch Upload</h1>
          <p className="text-sm text-muted-foreground">Upload a CSV file to run predictions on multiple applicants</p>
        </div>

        <Card>
          <CardContent className="p-6">
            {/* Drop zone */}
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors",
                dragOver ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50"
              )}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              onClick={() => inputRef.current?.click()}
            >
              <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-foreground font-medium">Drop CSV file here or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">Maximum file size: 10MB</p>
            </div>

            {file && (
              <div className="mt-4 flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                <FileText className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                {status === "done" && <CheckCircle2 className="h-5 w-5 text-success shrink-0" />}
              </div>
            )}

            {status === "processing" && (
              <div className="mt-4 space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">{progress}% — Processing predictions…</p>
              </div>
            )}

            {status === "error" && errorMsg && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            )}

            <div className="mt-6 flex gap-3">
              <Button 
                onClick={handleProcess} 
                disabled={!file || status === "processing"} 
                className="flex-1"
              >
                {status === "processing" ? "Processing…" : "Process & Predict"}
              </Button>
              {status === "done" && results.length > 0 && (
                <Button variant="outline" className="gap-2" onClick={downloadResults}>
                  <Download className="h-4 w-4" /> Download Results
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results table */}
        {status === "done" && results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Prediction Results</CardTitle>
              <CardDescription>{results.length} applications processed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Applicant</TableHead>
                      <TableHead>Income</TableHead>
                      <TableHead>Credit</TableHead>
                      <TableHead>Risk Score</TableHead>
                      <TableHead>Decision</TableHead>
                      <TableHead>Confidence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((result, idx) => (
                      <TableRow
                        key={idx}
                        className="cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => setSelectedResult(result)}
                      >
                        <TableCell className="font-medium">
                          {result.applicant_name || `Applicant ${idx + 1}`}
                        </TableCell>
                        <TableCell>${result.amt_income_total.toLocaleString()}</TableCell>
                        <TableCell>${result.amt_credit.toLocaleString()}</TableCell>
                        <TableCell className="font-mono font-medium">{result.default_risk_score.toFixed(2)}%</TableCell>
                        <TableCell>
                          <span className={cn(
                            "inline-flex px-2 py-1 rounded-full text-xs font-medium",
                            result.prediction_result.toLowerCase() === "approved" 
                              ? "bg-success/10 text-success" 
                              : "bg-destructive/10 text-destructive"
                          )}>
                            {result.prediction_result}
                          </span>
                        </TableCell>
                        <TableCell>
                          {result.confidence_level ? `${result.confidence_level.toFixed(1)}%` : "N/A"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sample format */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Expected CSV Format</CardTitle>
            <CardDescription>Your CSV should include these columns (at minimum):</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-xs font-mono-numbers bg-muted/50 p-3 rounded-lg overflow-x-auto text-muted-foreground">
{`ID,AMT_INCOME_TOTAL,AMT_CREDIT,AMT_ANNUITY,AGE_YEARS,YEARS_EMPLOYED,CODE_GENDER,EXT_SOURCE_1,EXT_SOURCE_2,EXT_SOURCE_3
1,95646,452075,3607,54,10,M,678,738,88
2,47171,134338,3717,24,4,F,655,656,57
3,31072,493065,4203,38,13,F,601,611,48`}
            </pre>
          </CardContent>
        </Card>
      </div>

      {/* SHAP Explanation Detail Panel */}
      <Sheet open={!!selectedResult} onOpenChange={(open) => !open && setSelectedResult(null)}>
        <SheetContent className="w-[40%] min-w-[500px] bg-card border-l-border p-0">
          {selectedResult && (
            <>
              <SheetHeader className="space-y-4 px-6 pt-6 pb-4 border-b border-border">
                <div className="space-y-2">
                  <SheetTitle className="text-lg font-semibold">
                    {selectedResult.applicant_name || `Applicant ID: ${selectedResult.id || "N/A"}`}
                  </SheetTitle>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={selectedResult.prediction_result.toLowerCase() === "approved" ? "default" : "destructive"}
                      className={cn(
                        "font-medium px-3 py-1",
                        selectedResult.prediction_result.toLowerCase() === "approved"
                          ? "bg-success/15 text-success border-success/30"
                          : "bg-destructive/15 text-destructive border-destructive/30"
                      )}
                    >
                      {selectedResult.prediction_result}
                    </Badge>
                    <span className="text-sm font-mono text-muted-foreground">
                      Risk Score: {selectedResult.default_risk_score.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </SheetHeader>

              <ScrollArea className="h-[calc(100vh-8rem)] px-6 pb-6">
                <div className="space-y-6 pt-6">
                  {/* Financial Details */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => handleSendToManualReview(selectedResult)}
                  >
                    <ClipboardList className="h-4 w-4" />
                    Send to Manual Review
                  </Button>

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                      Application Details
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Annual Income</p>
                        <p className="font-mono font-medium">${selectedResult.amt_income_total.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Loan Amount</p>
                        <p className="font-mono font-medium">${selectedResult.amt_credit.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Monthly Payment</p>
                        <p className="font-mono font-medium">${selectedResult.amt_annuity.toLocaleString()}</p>
                      </div>
                      {selectedResult.age_years != null && (
                        <div>
                          <p className="text-muted-foreground text-xs">Age</p>
                          <p className="font-mono font-medium">{selectedResult.age_years} years</p>
                        </div>
                      )}
                      {selectedResult.years_employed != null && (
                        <div>
                          <p className="text-muted-foreground text-xs">Employment</p>
                          <p className="font-mono font-medium">{selectedResult.years_employed} years</p>
                        </div>
                      )}
                      {selectedResult.code_gender && (
                        <div>
                          <p className="text-muted-foreground text-xs">Gender</p>
                          <p className="font-medium">{selectedResult.code_gender}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SHAP Explanation */}
                  {selectedResult.shap_info && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                        Model Explanation (SHAP)
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        SHAP values show how each factor influenced the XGBoost model's decision.
                        Red bars <span className="text-destructive font-medium">increase</span> risk,
                        green bars <span className="text-success font-medium">decrease</span> risk.
                      </p>
                      <ShapChart
                        riskFactors={selectedResult.shap_info.top_risk_factors}
                        protectFactors={selectedResult.shap_info.top_protect_factors}
                        maxItems={8}
                      />
                    </div>
                  )}

                  {(!selectedResult.shap_info || (
                    selectedResult.shap_info.top_risk_factors.length === 0 &&
                    selectedResult.shap_info.top_protect_factors.length === 0
                  )) && (
                    <div className="text-sm text-muted-foreground text-center py-8">
                      No SHAP explanation data available for this prediction.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}
