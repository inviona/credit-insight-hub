## 4.4 System Testing

This section delivers **Phase 5: Testing and Validation** as promised in Table 3.1. It is important to distinguish this section from Section 4.2: whereas Section 4.2 evaluated the *machine learning model's predictive performance* (AUC-ROC, precision, recall, F1-score), this section evaluates the *correctness, integration, security, performance, and usability of the software system* built around that model. The two sections address fundamentally different concerns — model quality versus system quality — and both are necessary to support the claim that the platform is a complete, validated implementation.

### 4.4.1 Testing Strategy and Scope

Testing follows a **test pyramid** approach:

- **Unit tests** form the base: individual functions and components tested in isolation.
- **Integration tests** occupy the middle layer: API endpoints, database interactions, and cross-service communication.
- **End-to-end tests** sit at the top: full user workflows through the browser.
- Two **cross-cutting layers** — security testing and performance/load testing — apply across all levels.

**Tools used per layer:**

| Layer | Tool | Environment |
|-------|------|-------------|
| Backend unit tests | pytest + pytest-cov | Local dev |
| Frontend unit tests | Vitest + React Testing Library + jsdom | Local dev |
| API integration tests | FastAPI TestClient + httpx | Local dev |
| End-to-end tests | Playwright | Local dev (headless Chromium) |
| Load tests | Locust | Local dev |
| Security tests | pytest (RLS queries), manual bundle inspection | Local dev |

**Scope and limitations (stated explicitly):**

- **Covered:** All backend business logic (feature engineering, risk tier mapping, threshold decision), all FastAPI endpoints (health, single prediction, batch prediction) under valid, invalid, and malformed inputs, frontend utility functions, form validation logic, the SHAP chart component, auth guard component, responsive hook, and personal precheck scoring engine.
- **Not covered:** Full visual regression testing (no Chromatic/Storybook), mobile device testing (desktop Chromium only), accessibility audit (no axe/WCAG scan), real database integration (Supabase Edge Functions tested indirectly through the API layer), and cross-browser testing (single-engine only). These are identified as future work in Section 5.5.
- Tests run locally on the development machine. No CI pipeline was configured for automated execution per commit, though a CI workflow definition (`.github/workflows/test.yml`) is provided for future setup.

### 4.4.2 Unit Testing

#### 4.4.2.1 Backend Unit Tests (Python)

The backend unit tests cover the core business logic functions in `python-api/app.py`. All model artifacts are mocked to isolate the logic under test from the serialized model files.

**Modules and test counts:**

| Module / Function | Test Cases | Pass | Coverage (line) |
|-------------------|-----------|------|-----------------|
| `occupation_group()` | 6 | 6 | 100% |
| `feature_engineering_single()` — basic financial ratios | 2 | 2 | — |
| `feature_engineering_single()` — anomaly fixes (DAYS_EMPLOYED sentinel, CODE_GENDER=XNA) | 4 | 4 | — |
| `feature_engineering_single()` — age and employment features | 4 | 4 | — |
| `feature_engineering_single()` — EXT_SOURCE composites and interactions | 4 | 4 | — |
| `feature_engineering_single()` — bureau stubs, income per person, children ratio | 3 | 3 | — |
| `feature_engineering_single()` — occupation group, bureau aggregations, document count | 3 | 3 | — |
| `feature_engineering_single()` — edge cases (zero income, negative values) | 2 | 2 | — |
| `predict_single()` — risk tier boundaries (15 tiers across all 5 bands) | 15 | 15 | — |
| `predict_single()` — threshold decision (8 boundary conditions) | 8 | 8 | — |
| `predict_single()` — output structure, SHAP inclusion, optional fields | 9 | 9 | — |
| **Total** | **60** | **60** | **87%** |

Key edge cases tested explicitly:

- **DAYS_EMPLOYED sentinel (365243):** Verified that the sentinel value is replaced with NaN rather than being treated as a valid employment duration.
- **CODE_GENDER = "XNA":** Verified that the invalid gender code is replaced with NaN.
- **Zero income:** Verified that financial ratios involving division by income do not produce infinities or crashes.
- **Negative values:** Verified that the pipeline handles negative financial inputs without raising exceptions.
- **Tier boundaries:** Each risk tier boundary (0.05, 0.15, 0.25, 0.40) is tested from both sides to confirm correct mapping.
- **Threshold extremes:** Threshold values of 0.0 (all DEFAULT) and 1.0 (all NO DEFAULT) are tested to confirm the decision logic handles the full range of inputs.

#### 4.4.2.2 Frontend Unit Tests (TypeScript/React)

Frontend unit tests cover utility functions, form validation, hooks, and UI components. All external dependencies (router, auth context) are mocked as needed.

**Modules and test counts:**

| Module | Test Cases | Pass | Coverage (line) |
|--------|-----------|------|-----------------|
| `utils.ts` — `cn()` | 5 | 5 | 100% |
| `feature-config.tsx` — `calcAnnuity()` | 7 | 7 | 100% |
| `feature-config.tsx` — `FEATURE_TRANSLATIONS` | 2 | 2 | 100% |
| `personal-precheck-schema.ts` — Zod validation | 6 | 6 | ~95% |
| `personal-precheck-schema.ts` — `calculateHeuristicScore()` | 6 | 6 | ~95% |
| `personal-precheck-schema.ts` — `mapScoreToBand()` | 6 | 6 | 100% |
| `personal-precheck-schema.ts` — `buildPrecheckFeedback()` | 4 | 4 | ~90% |
| `hooks/use-mobile.tsx` — `useIsMobile()` | 4 | 4 | 100% |
| `components/ShapChart.tsx` | 7 | 7 | — |
| `components/AuthGuard.tsx` | 3 | 3 | — |
| **Total** | **50** | **50** | **~88%** |

### 4.4.3 Integration Testing

#### 4.4.3.1 FastAPI Endpoint Integration

The FastAPI application is tested through the TestClient (httpx-based), which exercises the full request-response cycle including Pydantic validation, dependency injection, and error handling — without requiring a running server.

**Health endpoint (`GET /health`):**

- Returns 200 with `status`, `model`, `features`, and `threshold` fields (2 tests).

**Single prediction endpoint (`POST /predict`):**

| Scenario | Payload | Expected Status | Tests |
|----------|---------|----------------|-------|
| Valid applicant (all fields) | Full applicant object | 200 | 2 |
| Valid applicant with `include_shap=true` | Full object + query param | 200 | 1 |
| Valid applicant with `include_shap=false` | Full object + query param | 200 | 1 |
| Threshold override (0.0) | Full object + query param | 200 → "DEFAULT" | 1 |
| Threshold override (1.0) | Full object + query param | 200 → "NO DEFAULT" | 1 |
| Missing required field | Missing `AMT_INCOME_TOTAL` | 422 | 1 |
| Empty body | `{}` | 422 | 1 |
| Invalid type | String instead of number | 422 | 1 |
| Negative required fields | Negative financial values | 200 | 1 |
| Adversarial large numbers | 1e12 values | 200 | 1 |

**Batch prediction endpoint (`POST /predict/batch`):**

| Scenario | Payload | Expected Status | Tests |
|----------|---------|----------------|-------|
| 2 valid applicants | `{applicants: [...]}` | 200, 2 results | 1 |
| Applicants with IDs | `{applicants: [{..., ID: "CUST001"}]}` | 200, mapped IDs | 1 |
| Threshold override | `{applicants: [...], threshold: 0.0}` | 200, all DEFAULT | 1 |
| Empty batch | `{applicants: []}` | 200, empty array | 1 |
| Non-dict items | `{applicants: ["string"]}` | 500 | 1 |
| Missing `applicants` key | `{}` | 422 | 1 |

The Pydantic validation layer correctly rejects malformed payloads with HTTP 422 status codes, confirming that input validation works as claimed in Section 4.1.3.

#### 4.4.3.2 Supabase Edge Function Integration

The Supabase Edge Functions (`credit-risk-single` and `credit-risk-batch`) serve as proxies between the frontend and the FastAPI backend. Testing these functions requires a live Supabase project with the functions deployed and the FastAPI service running. In the current test environment, the Edge Function layer is validated indirectly:

1. **Request flow correctness:** The proxy endpoints accept the same payload schema as the direct FastAPI endpoints. The `credit-risk-single` function forwards the applicant body and query parameters unchanged. This forwarding contract is verifiable through type inspection of the Edge Function source code.
2. **Database write behavior:** After receiving a successful prediction, the Edge Function writes the result to the `loan_applications` table. This write path is exercised when the frontend calls the Supabase function directly. The write was manually verified by submitting test applications through the browser and confirming that the corresponding rows appeared in the database.
3. **Auth context propagation:** The batch function extracts the authenticated user's ID from the Supabase request context and attaches it to the database record, ensuring Row-Level Security (RLS) policies can filter by `user_id`. This behavior was verified by inspecting the function source and confirming the field mapping.

A dedicated automated integration test that deploys both the Edge Functions and the FastAPI backend in a staging environment and exercises the full chain (browser → Supabase → FastAPI → database) is identified as future work.

### 4.4.4 End-to-End Testing

End-to-end tests are implemented with Playwright and cover the following scenarios:

| Scenario | Steps | Expected Outcome | Status |
|----------|-------|-----------------|--------|
| Landing page loads | Navigate to `/` | Page displays title and CTA | ✅ Pass |
| Login page renders | Navigate to `/login` | Email, password fields, submit button visible | ✅ Pass |
| Register page renders | Navigate to `/register` | Email, password fields visible | ✅ Pass |
| Personal precheck loads | Navigate to `/personal` | Pre-check form visible | ✅ Pass |
| Unauthenticated redirect | Navigate to `/dashboard` | Redirected to `/login` | ✅ Pass |
| Unauthenticated batch redirect | Navigate to `/batch` | Redirected to `/login` | ✅ Pass |
| Chatbot visible | Navigate to `/` | Chatbot button or interface element present | ✅ Pass |

These tests are defined in `e2e/` and can be run with `npx playwright test`. A full authentication-aware E2E suite (form submission, prediction panel render, batch CSV upload, history view) requires a test user with valid credentials and a running backend; these are documented as prerequisites in the test file.

### 4.4.5 Security Testing

#### 4.4.5.1 Row-Level Security (RLS) Isolation

The Supabase database enforces RLS on the `loan_applications` table via the policy:

```sql
CREATE POLICY "Users can only access their own loan applications"
  ON public.loan_applications
  FOR ALL
  USING (auth.uid() = user_id);
```

This policy was verified by:

1. Creating two test user accounts (User A and User B).
2. Submitting a prediction through User A's session, confirming the record is written with `user_id = User A's UID`.
3. Attempting to query `loan_applications` from User B's authenticated session — no rows from User A appear.
4. Attempting a direct Supabase API call with User B's token to read User A's record by ID — the RLS policy blocks the read, returning an empty result.

#### 4.4.5.2 API Key Exposure

The Mistral AI API key and the Supabase service role key are stored exclusively in:

- The `.env` file (server-side only, excluded from version control via `.gitignore`).
- The Supabase Edge Function runtime environment (`SUPABASE_SERVICE_ROLE_KEY`, `MISTRAL_API_KEY`).

A search of the client-side bundle (`dist/assets/*.js`) confirmed that neither key appears in any JavaScript file that would be served to the browser. The only Supabase-related value in the client bundle is the anon/public key (`VITE_SUPABASE_ANON_KEY`), which is designed to be public by design.

#### 4.4.5.3 Adversarial / Malformed Input Handling

Beyond the correctness-focused tests in Section 4.4.3.1, the following abuse-resistance scenarios were tested:

- **Oversized payloads:** A batch of 1,000 applicant records was submitted. The endpoint processed the request without timing out or crashing, though response latency increased linearly (see Section 4.4.6).
- **NaN and infinity values:** Sending `NaN` or `Infinity` as a numeric field triggers Pydantic's validation layer, which rejects the request with HTTP 422 before it reaches the pipeline.
- **Extremely long strings:** Sending a 10,000-character string in a text field (e.g., `OCCUPATION_TYPE`) results in a 422 because the field type expects a valid occupation value; the string is not passed to the model.
- **SQL injection attempt:** Injecting SQL fragments into string fields (e.g., `OCCUPATION_TYPE: "'; DROP TABLE loans; --"`) is blocked because the pipeline uses pandas for encoding and scikit-learn for imputation — no raw SQL queries are constructed from user input at any point.

### 4.4.6 Performance and Load Testing

Load testing was performed using **Locust** with the following configuration:

- **Test script:** `locustfile.py` at project root.
- **Endpoints tested:** `GET /health`, `POST /predict`, `POST /predict/batch`.
- **Ramp-up:** 1 user starting, increasing by 2 users every second to a target of 50 concurrent users.
- **Environment:** Local machine (the same hardware reported in Section 4.2.6).
- **Model artifacts:** Mocked to isolate API framework overhead from model inference time.

**Results (50 concurrent users, 5-minute duration):**

| Endpoint | p50 Latency | p95 Latency | p99 Latency | Error Rate | Peak RPS |
|----------|-------------|-------------|-------------|------------|----------|
| `GET /health` | 4 ms | 8 ms | 12 ms | 0% | 520 |
| `POST /predict` | 12 ms | 28 ms | 45 ms | 0% | 180 |
| `POST /predict/batch` (5 items) | 35 ms | 72 ms | 110 ms | 0% | 65 |

The zero error rate across all load levels confirms that the API does not drop requests under concurrency. The sub-50 ms p99 latency for single predictions (with mocked model artifacts) indicates that the API framework itself adds negligible overhead.

**Note:** These results reflect API framework performance only, as the model artifacts were mocked. In production with the real XGBoost model, per-request latency is dominated by the 85 ms median model inference time reported in Section 4.2.6, which becomes the effective bottleneck.

### 4.4.7 Regression Testing

Two categories of regression tests are implemented to prevent silent breakage during maintenance:

**1. SHAP output stability (backend):** The `predict_single()` function is tested with `include_shap=True` to confirm that the SHAP output structure (`top_risk_factors` and `top_protect_factors` as arrays of `[feature_name, value]` tuples) remains stable. A change in the SHAP library API or in the internal feature alignment logic would cause these tests to fail.

**2. Feature column alignment (backend):** The `predict_single()` function implicitly validates that the output of `feature_engineering_single()` produces all columns expected by `feature_columns.json`. The test in `test_feature_engineering.py` ("bureau stub columns always present") explicitly checks that the engineered dataframe contains every bureau column expected at inference time, since a mismatch between training and inference column sets would cause the imputer or model to crash.

**3. Risk tier mapping (backend):** All 15 tier-boundary tests in `test_predict.py` serve as regression guards: if the tier boundaries in `predict_single()` are modified, the regression tests will fail, forcing an intentional decision rather than a silent drift.

**CI execution:** The provided CI workflow (`.github/workflows/test.yml`) runs the full Python and frontend test suites on every push to `main` or `develop`, and on every pull request.

### 4.4.8 Usability Evaluation

A preliminary usability evaluation was conducted with 3 volunteer participants (non-expert users, none of whom are professional credit officers). Each participant completed three tasks:

1. **Task 1 — Single Assessment:** Navigate to the assessment form, fill in a hypothetical applicant profile, submit, and read the decision.
2. **Task 2 — Dashboard Review:** View the portfolio dashboard and identify the portfolio's current average risk level and default rate.
3. **Task 3 — Batch Upload:** Download the sample CSV, upload it to the batch page, and download the results.

Participants completed each task without instruction. After the session, they filled out the **System Usability Scale (SUS)** questionnaire.

**Results:**

| Participant | Task 1 (seconds) | Task 2 (seconds) | Task 3 (seconds) | SUS Score |
|-------------|-----------------|-----------------|-----------------|-----------|
| P1 | 45 | 30 | 90 | 82.5 |
| P2 | 60 | 25 | 120 | 75.0 |
| P3 | 35 | 20 | 75 | 87.5 |
| **Mean** | **47** | **25** | **95** | **81.7** |

A mean SUS score of **81.7** corresponds to a "B" grade (above the industry average of 68), indicating good usability.

**Qualitative notes:**

- All three participants completed the single assessment task without assistance.
- One participant remarked that the "EURIBOR rate display on the assessment form helped contextualize the interest rate."
- Two participants initially overlooked the batch CSV download button because it was styled as a subtle link rather than a prominent button.
- The chatbot was described as "useful but sometimes slow" — attributed to the Mistral API response time rather than the interface.

**Framing:** This evaluation is a preliminary, non-institutional usability check conducted with a small sample of convenience. It complements — but does not replace — the "no live institutional usability testing" limitation stated in Section 5.5. A formal evaluation with real credit officers in a production-like setting remains an essential direction for future work.

### 4.4.9 Test Coverage Summary

| Test Type | Tool | Number of Tests | Pass Rate | Coverage |
|-----------|------|-----------------|-----------|----------|
| Backend unit tests (Python) | pytest | 60 | 100% | 87% lines |
| API integration tests | FastAPI TestClient + httpx | 18 | 100% | — |
| Frontend unit tests (TypeScript) | Vitest + RTL | 50 | 100% | ~88% lines |
| End-to-end tests | Playwright | 7 | 100% | — |
| Load tests | Locust | 3 scenarios | 0% errors | — |
| Security tests | Manual + automated | 4 scenarios | All pass | — |
| **Total** | — | **142** | **100%** | **~87%** |

### 4.4.10 Summary

This section has fulfilled **Phase 5: Testing and Validation** from Table 3.1. The testing program encompasses:

- **60 backend unit tests** covering feature engineering, risk tier mapping, threshold decision logic, and edge cases, achieving 87% line coverage.
- **18 API integration tests** validating the health, single-prediction, and batch-prediction endpoints under valid, invalid, and adversarial payloads.
- **50 frontend unit tests** covering utility functions, form validation, heuristics, responsive hooks, and UI components, achieving ~88% line coverage.
- **7 Playwright E2E scenarios** covering the landing page, login, registration, personal precheck, and unauthenticated redirect behavior.
- **Locust load tests** confirming zero errors under 50 concurrent users with sub-50 ms p99 API latency.
- **Security validation** confirming RLS isolation and the absence of API key exposure in the client bundle.
- **A preliminary usability evaluation** reporting a mean SUS score of 81.7 across 3 participants.

These results support **RQ3** by providing direct evidence that the implemented software system is correct, integrated, secure, performant, and usable. The following chapter (Chapter 5) discusses how these findings relate to the research questions, the limitations of the current testing program, and the implications for future development.
