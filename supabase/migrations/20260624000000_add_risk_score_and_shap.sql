ALTER TABLE public.loan_applications ADD COLUMN IF NOT EXISTS risk_score numeric;
ALTER TABLE public.loan_applications ADD COLUMN IF NOT EXISTS shap_explanation jsonb;
