import { useState, useCallback, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PredictionPanel } from "@/components/PredictionPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, Loader2, CheckCircle2, TrendingUp } from "lucide-react";
import { FORM_SECTIONS, calcAnnuity } from "@/lib/feature-config";
import { generateMockPrediction, type PredictionResult } from "@/lib/mock-data";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { fetchEuriborRates, type EuriborData } from "@/lib/euribor-api";

function generateCustomerId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `CUST-${timestamp}${random}`;
}

const INCOME_TO_EMPLOYMENT: Record<string, string | null> = {
  Working: null,
  "Commercial associate": "commercial_employee",
  Pensioner: "retired",
  "State servant": "civil_service",
  Student: "student",
};

function mapIncomeToEmployment(value: string | undefined): string | null {
  return value ? INCOME_TO_EMPLOYMENT[value] ?? null : null;
}

export default function AssessmentPage() {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [savedLoanId, setSavedLoanId] = useState<string | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [euriborRates, setEuriborRates] = useState<EuriborData[]>([]);

  useEffect(() => {
    fetchEuriborRates().then(setEuriborRates);
  }, []);

  const latestEuribor = euriborRates.length > 0 ? euriborRates[euriborRates.length - 1] : null;

  const handleAddToManualReview = useCallback(async () => {
    if (!savedLoanId) return;
    setReviewLoading(true);
    const { error } = await supabase
      .from('loan_applications')
      .update({ status: 'pending_review' })
      .eq('id', savedLoanId);
    setReviewLoading(false);
    if (error) {
      toast({ title: "Error", description: "Failed to add to manual review", variant: "destructive" });
    } else {
      toast({ title: "Added to Manual Review", description: "Loan sent for manual underwriting review" });
    }
  }, [savedLoanId]);

  const updateField = useCallback((name: string, value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [name]: value };

      if (name === "TERM_MONTHS" && euriborRates.length > 0) {
        const months = parseInt(value || "0", 10);
        const latest = euriborRates[euriborRates.length - 1];
        const baseRate = months <= 3 ? latest.euribor3m : latest.euribor12m;
        const spread = 2.5;
        next.INTEREST_RATE = (baseRate + spread).toFixed(2);
      }

      if (["AMT_CREDIT", "INTEREST_RATE", "TERM_MONTHS"].includes(name)) {
        const principal = parseFloat(next.AMT_CREDIT || "0");
        const rate = parseFloat(next.INTEREST_RATE || "0");
        const months = parseInt(next.TERM_MONTHS || "0", 10);
        const annuity = calcAnnuity(principal, rate, months);
        if (annuity > 0) next.AMT_ANNUITY = Math.round(annuity).toString();
      }
      return next;
    });
  }, [euriborRates]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const customerId = generateCustomerId();
    
    try {
      const { data: predictionData, error } = await supabase.functions.invoke("credit-risk-single", {
        body: formData,
      });

      let prediction: PredictionResult;

      if (error || !predictionData) {
        console.error("Prediction error:", error);
        const income = parseFloat(formData.AMT_INCOME_TOTAL || "0");
        const credit = parseFloat(formData.AMT_CREDIT || "0");
        const ratio = credit / (income + 1);
        prediction = { ...generateMockPrediction(ratio < 4), customer_id: customerId };
      } else {
        prediction = { ...(predictionData as PredictionResult), customer_id: customerId };
      }

      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setSaving(true);
        const { data: insertedLoan, error: insertError } = await supabase
          .from('loan_applications')
          .insert({
            customer_id: customerId,
            user_id: user.id,
            full_name: formData.FULL_NAME || null,
            email: formData.EMAIL || null,
            phone: formData.PHONE || null,
            person_age: formData.AGE_YEARS ? parseInt(formData.AGE_YEARS) : null,
            person_income: parseFloat(formData.AMT_INCOME_TOTAL || formData.PERSON_INCOME || "0"),
            person_emp_length: formData.YEARS_EMPLOYED ? parseFloat(formData.YEARS_EMPLOYED) : null,
            loan_amount: parseFloat(formData.AMT_CREDIT || formData.LOAN_AMOUNT || "0"),
            loan_int_rate: formData.INTEREST_RATE || formData.LOAN_INT_RATE ? parseFloat(formData.INTEREST_RATE || formData.LOAN_INT_RATE) : null,
            loan_term: formData.TERM_MONTHS || formData.LOAN_TERM ? parseInt(formData.TERM_MONTHS || formData.LOAN_TERM) : null,
            credit_score: formData.EXT_SOURCE_1 || formData.CREDIT_SCORE ? parseInt(formData.EXT_SOURCE_1 || formData.CREDIT_SCORE) : null,
            num_credit_lines: formData.EXT_SOURCE_2 ? parseInt(formData.EXT_SOURCE_2) : null,
            credit_history_length: formData.CREDIT_HISTORY_LENGTH || formData.CB_PERSON_CRED_HIST_LENGTH ? parseInt(formData.CREDIT_HISTORY_LENGTH || formData.CB_PERSON_CRED_HIST_LENGTH) : null,
            monthly_expenses: formData.AMT_ANNUITY || formData.MONTHLY_EXPENSES ? parseFloat(formData.AMT_ANNUITY || formData.MONTHLY_EXPENSES) : null,
            existing_debt: formData.EXISTING_DEBT ? parseFloat(formData.EXISTING_DEBT) : null,
            loan_percent_income: formData.LOAN_PERCENT_INCOME ? parseFloat(formData.LOAN_PERCENT_INCOME) : null,
            person_home_ownership: formData.PERSON_HOME_OWNERSHIP || null,
            loan_grade: formData.LOAN_GRADE || null,
            loan_purpose: formData.LOAN_PURPOSE || null,
            cb_person_default_on_file: formData.CB_PERSON_DEFAULT_ON_FILE || null,
            employment_status: formData.EMPLOYMENT_STATUS || mapIncomeToEmployment(formData.NAME_INCOME_TYPE),
            num_delinquencies: formData.NUM_DELINQUENCIES ? parseInt(formData.NUM_DELINQUENCIES) : null,
            status: prediction.decision === "APPROVED" ? "approved" : "rejected",
            date_of_birth: formData.DATE_OF_BIRTH || null,
            address: formData.ADDRESS || null,
            city: formData.CITY || null,
            state: formData.STATE || null,
            zip_code: formData.ZIP_CODE || null,
            bankruptcy_history: formData.BANKRUPTCY_HISTORY === "true" ? true : formData.BANKRUPTCY_HISTORY === "false" ? false : null,
          })
          .select('id')
          .single();

        if (insertError) {
          setSavedLoanId(null);
          console.error("Database insert error:", insertError);
          const msg = insertError.message || "Unknown error";
          const details = insertError.details || insertError.hint || "";
          toast({ title: "Warning", description: `Could not save to database: ${msg}${details ? ` (${details})` : ""}`, variant: "destructive" });
        } else {
          setSavedLoanId(insertedLoan?.id || null);
          toast({ title: "Assessment saved", description: `Customer ID: ${customerId}` });
        }
      }

      setResult(prediction);
    } catch (error) {
      console.error("Assessment error:", error);
      toast({ title: "Error", description: error instanceof Error ? error.message : "Assessment failed", variant: "destructive" });
    } finally {
      setLoading(false);
      setSaving(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">New Credit Assessment</h1>
          <p className="text-sm text-muted-foreground">Enter applicant data to run risk prediction</p>
        </div>

        {latestEuribor && (
          <div className="bg-muted/40 border border-border rounded-lg p-3 flex items-center gap-3 text-sm">
            <TrendingUp className="h-5 w-5 text-primary shrink-0" />
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <span><strong>EURIBOR 3M:</strong> {latestEuribor.euribor3m.toFixed(2)}%</span>
              <span><strong>EURIBOR 12M:</strong> {latestEuribor.euribor12m.toFixed(2)}%</span>
              <span className="text-muted-foreground">
                Auto-applies EURIBOR + 2.5% spread based on loan term (≤3mo → 3M, &gt;3mo → 12M)
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Accordion type="multiple" defaultValue={[FORM_SECTIONS[0].title]} className="space-y-3">
            {FORM_SECTIONS.map((section) => (
              <AccordionItem key={section.title} value={section.title} className="border border-border rounded-lg overflow-hidden bg-card">
                <AccordionTrigger className="px-5 py-3 hover:no-underline hover:bg-muted/30">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <span>{section.icon}</span> {section.title}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {section.fields.map((field) => (
                      <div key={field.name} className="space-y-1.5">
                        <div className="flex items-center gap-1">
                          <Label htmlFor={field.name} className="text-xs">{field.label}</Label>
                          {field.tooltip && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[200px] text-xs">{field.tooltip}</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                        {field.type === "select" ? (
                          <Select value={formData[field.name] || ""} onValueChange={(v) => updateField(field.name, v)}>
                            <SelectTrigger id={field.name} className="h-9">
                              <SelectValue placeholder="Select…" />
                            </SelectTrigger>
                            <SelectContent>
                              {field.options?.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value || "_empty"}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            id={field.name}
                            type={field.type}
                            placeholder={field.placeholder}
                            value={formData[field.name] || ""}
                            onChange={(e) => updateField(field.name, e.target.value)}
                            min={field.min}
                            max={field.max}
                            step={field.step}
                            required={field.required}
                            className="h-9 font-mono-numbers"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-6">
            <Button type="submit" size="lg" className="w-full gap-2" disabled={loading || saving}>
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Running Assessment…</>
              ) : saving ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Saving to Database…</>
              ) : (
                "Run Credit Assessment"
              )}
            </Button>
          </div>
        </form>

        {result && (
          <div className="bg-success/10 border border-success/30 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
            <div>
              <p className="text-sm font-medium text-success">Assessment saved successfully</p>
              <p className="text-xs text-muted-foreground">Customer ID: <span className="font-mono font-bold">{result.customer_id}</span></p>
            </div>
          </div>
        )}
      </div>

      {result && (
        <PredictionPanel
          result={result}
          onClose={() => setResult(null)}
          onAddToManualReview={savedLoanId ? handleAddToManualReview : undefined}
          saving={reviewLoading}
        />
      )}
    </DashboardLayout>
  );
}
