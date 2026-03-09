

## Current State Analysis

**No, the XGBoost model is NOT used for single assessments.**

Looking at the code:

**AssessmentPage.tsx (lines 35-46)**:
- Uses a simple client-side heuristic: `ratio = credit / (income + 1)`
- Calls `generateMockPrediction()` with a hardcoded boolean
- Returns completely mocked data with fake SHAP values

**api.ts (line 40-46)**:
- Has a `submitPrediction()` function that calls the Flask backend `/api/predict`
- This is never actually used in AssessmentPage
- Would return HTML (not JSON) from the old Flask server

**Current Flow**:
```text
User fills form → handleSubmit
  ↓
setTimeout (1200ms fake delay)
  ↓
Simple ratio check: credit/(income+1) < 4
  ↓
generateMockPrediction(isApproved: boolean)
  ↓
Returns hardcoded mock with fake notes/SHAP
```

**What's Actually Connected**:
- ✅ Batch uploads → Supabase Edge Function → Python API (XGBoost)
- ❌ Single assessments → Client-side mock data (no model)

---

## Proposed Solution

Create a new Supabase Edge Function `credit-risk-single` that:

1. **Accepts single applicant data** (form fields as JSON)
2. **Transforms to the same format** used in batch processing
3. **Calls your Python XGBoost API** `/predict` endpoint
4. **Returns prediction results** with real SHAP values

**Technical Approach**:

1. **New Edge Function**: `supabase/functions/credit-risk-single/index.ts`
   - Similar structure to batch function
   - Takes single applicant object instead of CSV
   - Calls `PREDICTION_API_URL/predict`
   - Returns JSON response

2. **Update AssessmentPage.tsx**:
   - Replace mock logic with actual API call
   - Call edge function via `supabase.functions.invoke()`
   - Display real prediction results

3. **Python API Enhancement**:
   - Ensure `/predict` endpoint accepts single applicant JSON
   - Return SHAP values alongside prediction
   - Match response format expected by frontend

**Data Flow After Changes**:
```text
User fills form → handleSubmit
  ↓
supabase.functions.invoke('credit-risk-single', formData)
  ↓
Edge Function formats + calls Python API
  ↓
XGBoost model prediction + SHAP calculation
  ↓
Return real results to frontend
  ↓
Display in PredictionPanel
```

**Files to Modify**:
- Create `supabase/functions/credit-risk-single/index.ts`
- Update `src/pages/AssessmentPage.tsx` (replace mock with real call)
- Update `python-api/app.py` (ensure `/predict` returns SHAP values)

**Benefits**:
- Consistency: Both single and batch use same XGBoost model
- Real predictions: Actual risk scores instead of fake data
- SHAP interpretability: Real feature importance values
- Unified backend: All predictions flow through your trained model

