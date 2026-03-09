import { useState, useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Download, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { submitBatch } from "@/lib/api";
import Papa from "papaparse";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";

type PredictionResult = {
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
};

export default function BatchPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "processing" | "done" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [results, setResults] = useState<PredictionResult[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
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
        throw new Error("Prediction failed");
      }

      // Step 2: Parse the response - expecting JSON array of predictions
      const predictions = await response.json();
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
      const applicationsToInsert = predictions.map((pred: any) => ({
        user_id: user.id,
        batch_id: batchId,
        is_batch_upload: true,
        applicant_name: pred.applicant_name || null,
        amt_income_total: parseFloat(pred.amt_income_total),
        amt_credit: parseFloat(pred.amt_credit),
        amt_annuity: parseFloat(pred.amt_annuity),
        age_years: pred.age_years ? parseFloat(pred.age_years) : null,
        years_employed: pred.years_employed ? parseFloat(pred.years_employed) : null,
        code_gender: pred.code_gender || null,
        ext_source_1: pred.ext_source_1 ? parseFloat(pred.ext_source_1) : null,
        ext_source_2: pred.ext_source_2 ? parseFloat(pred.ext_source_2) : null,
        ext_source_3: pred.ext_source_3 ? parseFloat(pred.ext_source_3) : null,
        default_risk_score: parseFloat(pred.default_risk_score),
        prediction_result: pred.prediction_result,
        confidence_level: pred.confidence_level ? parseFloat(pred.confidence_level) : null,
      }));

      const { error: insertError } = await supabase
        .from('applications')
        .insert(applicationsToInsert);

      if (insertError) {
        console.error("Database insert error:", insertError);
        throw new Error("Failed to save predictions to database");
      }

      setProgress(100);
      setResults(predictions);
      setStatus("done");
      
      toast({ 
        title: "Batch processed successfully", 
        description: `${predictions.length} applications processed and saved` 
      });

    } catch (error: any) {
      console.error("Batch processing error:", error);
      setStatus("error");
      setErrorMsg(error.message || "Failed to process batch upload");
      toast({ 
        title: "Processing failed", 
        description: error.message || "An error occurred", 
        variant: "destructive" 
      });
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

            {status === "uploading" && (
              <div className="mt-4 space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">{progress}% — Processing predictions…</p>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <Button onClick={handleUpload} disabled={!file || status === "uploading"} className="flex-1">
                {status === "uploading" ? "Processing…" : "Upload & Predict"}
              </Button>
              {status === "done" && (
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" /> Download Results
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sample format */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Expected CSV Format</CardTitle>
            <CardDescription>Your CSV should include these columns (at minimum):</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-xs font-mono-numbers bg-muted/50 p-3 rounded-lg overflow-x-auto text-muted-foreground">
{`AMT_INCOME_TOTAL,AMT_CREDIT,AMT_ANNUITY,AGE_YEARS,YEARS_EMPLOYED,CODE_GENDER,EXT_SOURCE_1,EXT_SOURCE_2,EXT_SOURCE_3
75000,250000,1500,35,8,M,720,680,72
45000,180000,1200,28,3,F,650,620,58`}
            </pre>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
