-- Add customer_id column to applications table
ALTER TABLE public.applications ADD COLUMN customer_id TEXT UNIQUE;

-- Add index for faster lookups
CREATE INDEX idx_applications_customer_id ON public.applications(customer_id);

-- Add RLS policies for applications table
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own applications
CREATE POLICY "Users can view own applications"
ON public.applications
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own applications
CREATE POLICY "Users can insert own applications"
ON public.applications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own applications
CREATE POLICY "Users can update own applications"
ON public.applications
FOR UPDATE
USING (auth.uid() = user_id);
