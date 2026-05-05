-- Fix loan_applications status constraint to accept all needed values
-- Drop existing check constraint if it exists
ALTER TABLE public.loan_applications DROP CONSTRAINT IF EXISTS loan_applications_status_check;

-- Add new constraint accepting all status values
ALTER TABLE public.loan_applications ADD CONSTRAINT loan_applications_status_check
  CHECK (status IN ('approved', 'rejected', 'pending', 'pending_review', 'accepted', 'denied', 'borderline', 'likely_approved', 'unlikely'));

-- Fix employment_status constraint - first clean up invalid values, then add constraint
UPDATE public.loan_applications SET employment_status = NULL WHERE employment_status IS NOT NULL AND employment_status NOT IN ('full_time', 'part_time', 'self_employed', 'unemployed', 'student', 'retired', 'businessman', 'official', 'servant', 'military', 'civil_service', 'commercial_employee', 'maternity_leave', 'secret_job');

ALTER TABLE public.loan_applications DROP CONSTRAINT IF EXISTS loan_applications_employment_status_check;
ALTER TABLE public.loan_applications ADD CONSTRAINT loan_applications_employment_status_check
  CHECK (employment_status IS NULL OR employment_status IN ('full_time', 'part_time', 'self_employed', 'unemployed', 'student', 'retired', 'businessman', 'official', 'servant', 'military', 'civil_service', 'commercial_employee', 'maternity_leave', 'secret_job', 'other'));

-- Fix cb_person_default_on_file constraint - clean up invalid values first
UPDATE public.loan_applications SET cb_person_default_on_file = NULL WHERE cb_person_default_on_file IS NOT NULL AND cb_person_default_on_file NOT IN ('Y', 'N');

ALTER TABLE public.loan_applications DROP CONSTRAINT IF EXISTS loan_applications_cb_person_default_on_file_check;
ALTER TABLE public.loan_applications ADD CONSTRAINT loan_applications_cb_person_default_on_file_check
  CHECK (cb_person_default_on_file IS NULL OR cb_person_default_on_file IN ('Y', 'N'));

-- Fix loan_purpose constraint - clean up invalid values first
UPDATE public.loan_applications SET loan_purpose = 'UNKNOWN' WHERE loan_purpose IS NOT NULL AND loan_purpose NOT IN ('EDUCATION', 'MEDICAL', 'VENTURE', 'DEBT_CNSL', 'HOME', 'CAR', 'REAL_ESTATE', 'PERSONAL_PRECHECK', 'UNKNOWN');

ALTER TABLE public.loan_applications DROP CONSTRAINT IF EXISTS loan_applications_loan_purpose_check;
ALTER TABLE public.loan_applications ADD CONSTRAINT loan_applications_loan_purpose_check
  CHECK (loan_purpose IS NULL OR loan_purpose IN ('EDUCATION', 'MEDICAL', 'VENTURE', 'DEBT_CNSL', 'HOME', 'CAR', 'REAL_ESTATE', 'PERSONAL_PRECHECK', 'UNKNOWN'));
