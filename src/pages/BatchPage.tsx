import { useState, useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Download, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BatchPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "done">("idle");
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
    setStatus("idle");
    setProgress(0);
  };

  const handleUpload = () => {
    if (!file) return;
    setStatus("uploading");
    // Simulate progress
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 15 + 5;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setStatus("done");
      }
      setProgress(Math.min(100, Math.round(p)));
    }, 300);
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
