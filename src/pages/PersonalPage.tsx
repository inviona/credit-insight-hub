import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { runPersonalPrecheck } from "@/lib/api";
import { personalPrecheckSchema, type PersonalPrecheckResult } from "@/lib/personal-precheck-schema";
import { PersonalEligibilityResult } from "@/components/PersonalEligibilityResult";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, CheckCircle2, ShieldCheck, Lightbulb, ArrowLeft } from "lucide-react";

type PersonalPrecheckFormInput = z.input<typeof personalPrecheckSchema>;

function makePersonalRecordId(): string {
  return `PR-${Date.now().toString(36).toUpperCase()}`;
}

export default function PersonalPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PersonalPrecheckResult | null>(null);

  const {
    register,
    setValue,
    watch,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PersonalPrecheckFormInput>({
    resolver: zodResolver(personalPrecheckSchema),
    defaultValues: {
      employmentStatus: "full_time",
      priorDefaults: "no",
      consentAccepted: false,
    },
  });

  const onSubmit = async (rawValues: PersonalPrecheckFormInput) => {
    setLoading(true);
    try {
      const { parsedInput, result: nextResult } = await runPersonalPrecheck(rawValues);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const dbStatus = nextResult.band === "Unlikely" ? "rejected" : "approved";

        const { error: insertError } = await supabase.from("loan_applications").insert({
          customer_id: makePersonalRecordId(),
          user_id: user.id,
          full_name: parsedInput.fullName,
          email: parsedInput.email,
          person_age: parsedInput.age,
          person_income: parsedInput.monthlyIncome * 12,
          monthly_expenses: parsedInput.monthlyLivingExpenses,
          existing_debt: parsedInput.monthlyDebtPayments,
          loan_amount: parsedInput.loanAmount,
          loan_term: parsedInput.loanTermMonths,
          person_emp_length: parsedInput.yearsEmployed,
          employment_status: parsedInput.employmentStatus,
          cb_person_default_on_file: parsedInput.priorDefaults === "yes" ? "Y" : "N",
          loan_purpose: "PERSONAL_PRECHECK",
          status: dbStatus,
        });

        if (insertError) {
          console.error("Insert error:", insertError);
          throw new Error(`Database error: ${insertError.message}${insertError.details ? ` (${insertError.details})` : ""}`);
        }
      }

      setResult(nextResult);
      reset({
        employmentStatus: "full_time",
        priorDefaults: "no",
        consentAccepted: false,
      });
      toast({
        title: "Pre-check completed",
        description: user ? "Your result and recommendations are now available below." : "Trial result shown below. Log in to save your results.",
      });
    } catch (error) {
      toast({
        title: "Pre-check failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-6">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 mt-1 shrink-0" onClick={() => navigate(-1)} title="Go back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Personal Loan Pre-Check</h1>
            <p className="text-muted-foreground">Estimate your loan readiness before applying. This is educational guidance only, not a final lending decision.</p>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid md:grid-cols-3 gap-3">
          <Card>
            <CardContent className="pt-5 space-y-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <p className="text-sm font-medium">Private by default</p>
              <p className="text-xs text-muted-foreground">Results are visible only to you.</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 space-y-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              <p className="text-sm font-medium">Actionable guidance</p>
              <p className="text-xs text-muted-foreground">Get tips to improve your chances.</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 space-y-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <p className="text-sm font-medium">Fast and simple</p>
              <p className="text-xs text-muted-foreground">Get an instant pre-check result.</p>
            </CardContent>
          </Card>
        </div>

        {/* Pre-check form */}
        <Card>
          <CardHeader>
            <CardTitle>Tell us about your profile</CardTitle>
            <CardDescription>We use this information to estimate your loan readiness and provide tips.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" {...register("fullName")} />
                {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register("email")} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="age">Age</Label>
                <Input id="age" type="number" {...register("age", { valueAsNumber: true })} />
                {errors.age && <p className="text-xs text-destructive">{errors.age.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="monthlyIncome">Monthly income</Label>
                <Input id="monthlyIncome" type="number" step="0.01" {...register("monthlyIncome", { valueAsNumber: true })} />
                {errors.monthlyIncome && <p className="text-xs text-destructive">{errors.monthlyIncome.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="monthlyDebtPayments">Monthly debt payments</Label>
                <Input id="monthlyDebtPayments" type="number" step="0.01" {...register("monthlyDebtPayments", { valueAsNumber: true })} />
                {errors.monthlyDebtPayments && <p className="text-xs text-destructive">{errors.monthlyDebtPayments.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="monthlyLivingExpenses">Monthly living expenses</Label>
                <Input id="monthlyLivingExpenses" type="number" step="0.01" {...register("monthlyLivingExpenses", { valueAsNumber: true })} />
                {errors.monthlyLivingExpenses && <p className="text-xs text-destructive">{errors.monthlyLivingExpenses.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="loanAmount">Requested loan amount</Label>
                <Input id="loanAmount" type="number" step="0.01" {...register("loanAmount", { valueAsNumber: true })} />
                {errors.loanAmount && <p className="text-xs text-destructive">{errors.loanAmount.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="loanTermMonths">Loan term (months)</Label>
                <Input id="loanTermMonths" type="number" {...register("loanTermMonths", { valueAsNumber: true })} />
                {errors.loanTermMonths && <p className="text-xs text-destructive">{errors.loanTermMonths.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="yearsEmployed">Years employed</Label>
                <Input id="yearsEmployed" type="number" step="0.1" {...register("yearsEmployed", { valueAsNumber: true })} />
                {errors.yearsEmployed && <p className="text-xs text-destructive">{errors.yearsEmployed.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Employment status</Label>
                <Select
                  value={watch("employmentStatus")}
                  onValueChange={(value) =>
                    setValue("employmentStatus", value as PersonalPrecheckFormInput["employmentStatus"], { shouldValidate: true })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employment status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full-time</SelectItem>
                    <SelectItem value="part_time">Part-time</SelectItem>
                    <SelectItem value="self_employed">Self-employed</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                    <SelectItem value="unemployed">Unemployed</SelectItem>
                  </SelectContent>
                </Select>
                {errors.employmentStatus && <p className="text-xs text-destructive">{errors.employmentStatus.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Any prior defaults?</Label>
                <Select
                  value={watch("priorDefaults")}
                  onValueChange={(value) =>
                    setValue("priorDefaults", value as PersonalPrecheckFormInput["priorDefaults"], { shouldValidate: true })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                  </SelectContent>
                </Select>
                {errors.priorDefaults && <p className="text-xs text-destructive">{errors.priorDefaults.message}</p>}
              </div>

              <div className="sm:col-span-2 rounded-md border p-3 bg-muted/20">
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="consentAccepted"
                    checked={watch("consentAccepted")}
                    onCheckedChange={(checked) => setValue("consentAccepted", checked === true, { shouldValidate: true })}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="consentAccepted" className="text-sm font-medium">
                      I consent to my data being processed for this pre-check.
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      This tool provides preliminary guidance and does not guarantee loan approval.
                    </p>
                    {errors.consentAccepted && <p className="text-xs text-destructive">{errors.consentAccepted.message}</p>}
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2">
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Running pre-check...
                    </>
                  ) : (
                    "Run Personal Pre-Check"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Result */}
        {result && <PersonalEligibilityResult result={result} />}

        {/* Business link */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Need a full credit assessment for your business?{" "}
            <Link to="/dashboard" className="text-primary underline">Go to Business Dashboard</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
