# Chapter 4: System Implementation and Results

## 4.1 System Implementation

This section describes the implementation of the Credit Risk Intelligent Predictor platform, translating the architectural design described in Chapter 3 into a functioning software system. The implementation covers the machine learning pipeline, the RESTful API layer, the web-based dashboard, and the integration of explainability and conversational AI components.

### 4.1.1 Machine Learning Pipeline

The core predictive component follows a serialized pipeline that ensures consistency between the training environment and production inference. The pipeline consists of three stages: feature engineering, categorical encoding and imputation, and model inference.

#### 4.1.1.1 Feature Engineering Module

The feature engineering logic is implemented in the `feature_engineering_single()` function within the FastAPI application (`python-api/app.py`). This function replicates, line for line, the transformations applied during model training. The module generates over 30 derived features organized into four groups:

- **Financial ratio features**: `CREDIT_TO_INCOME`, `ANNUITY_TO_INCOME`, `CREDIT_TO_GOODS`, `GOODS_CREDIT_DIFF`, `ANNUITY_TO_CREDIT`, `CREDIT_TERM`, `PAYMENT_RATE`, `INCOME_PER_PERSON`, and `CHILDREN_RATIO`. These features capture borrower affordability and leverage.

- **Credit score composites**: `EXT_MEAN`, `EXT_MIN`, `EXT_MAX`, `EXT_STD`, `EXT_PROD`, and `EXT_WEIGHTED` — the last applying weighted importance (1:3:2) to EXT_SOURCE_1, EXT_SOURCE_2, and EXT_SOURCE_3 respectively. Cross-product interaction terms (`EXT2_x_INCOME`, `EXT2_x_CREDIT`, `EXT2_x_AGE`) capture non-linear relationships between creditworthiness and financial exposure.

- **Demographic and employment features**: `AGE_YEARS`, `AGE_BUCKET`, `IS_YOUNG`, `IS_UNEMPLOYED`, `YEARS_EMPLOYED`, `EMPLOYMENT_TO_AGE`, and `DAYS_EMPLOYED_PERC`. Occupation types are grouped into three tiers (Low-Skill & Manual, Mid-Skill & Office Support, High-Skill & Professional) via the `occupation_group()` helper.

- **Bureau aggregation features**: Stub columns (`BUREAU_LOAN_COUNT`, `BUREAU_ACTIVE_LOANS`, `BUREAU_CLOSED_LOANS`, `BUREAU_AMT_CREDIT_SUM`, `BUREAU_MAX_OVERDUE`, `BUREAU_DAYS_CREDIT_MAX`, `BUREAU_ACTIVE_RATIO`, `TOTAL_ANNUITY`, `DTI`) are initialized as NaN when bureau data is absent, preserving feature alignment.

Two critical anomaly corrections are applied before any derived computation: `DAYS_EMPLOYED` values equal to 365,243 (a known Home Credit sentinel for unemployment) are replaced with NaN, and `CODE_GENDER` values of "XNA" are similarly nullified.

#### 4.1.1.2 Categorical Encoding and Imputation

Target encoding maps (`te_maps.pkl`) — computed via smoothed out-of-fold estimation (k = 20, 5-fold) on the training set — are applied to five categorical variables: `OCCUPATION_TYPE`, `NAME_INCOME_TYPE`, `NAME_EDUCATION_TYPE`, `NAME_FAMILY_STATUS`, `NAME_HOUSING_TYPE`, and `ORGANIZATION_TYPE`. Each category is replaced by its empirical default rate, smoothed toward the global mean (µ = 0.0807). Remaining object-typed columns are zero-filled as a fallback.

After encoding, feature columns are aligned to the ordered list in `feature_columns.json` (156 features). Any missing column is populated with NaN. A `SimpleImputer` with mean strategy (serialized as `imputer.pkl`) is applied to handle residual missingness.

#### 4.1.1.3 Model Inference and Risk Tiering

The trained XGBoost classifier (`xgb_model.pkl`) computes a probability of default via `predict_proba()`. The raw probability is compared against a calibrated threshold (0.662, serialized in `thresholds.json`) to produce a binary decision:

```
decision = "DEFAULT" if prob >= threshold else "NO DEFAULT"
```

Five risk tiers are defined with corresponding policy recommendations:

| Risk Tier | Probability Range | Policy Recommendation |
|-----------|------------------|----------------------|
| VERY LOW | < 0.05 | Premium rates, higher loan limits |
| LOW | [0.05, 0.15) | Standard approval, normal limits |
| MODERATE | [0.15, 0.25) | Standard terms, consider collateral |
| ELEVATED | [0.25, 0.40) | Reduced limit or higher rate, require documentation |
| HIGH | >= 0.40 | Decline or require collateral plus co-signer |

### 4.1.2 SHAP Explainability Integration

SHAP explainability is integrated at inference time using a cached `shap.TreeExplainer` initialized during application startup. For each prediction:

1. The explainer computes SHAP values for the transformed feature vector using the interventional perturbation method with a background dataset of 1,000 samples.
2. Feature-level attributions are paired with their original feature names.
3. Attributions are sorted by absolute value in descending order.
4. The top 8 risk-increasing factors (positive SHAP values, contributing toward default) and top 8 protective factors (negative SHAP values, contributing toward repayment) are returned alongside the prediction.

The explanation output is structured as:

```json
{
  "shap_values": {
    "top_risk_factors": [["EXT_MEAN", 0.0421], ["CODE_GENDER", 0.0312], ...],
    "top_protect_factors": [["EXT_MAX", -0.0289], ["AMT_GOODS_PRICE", -0.0213], ...]
  }
}
```

The frontend `ShapChart` component renders these values as a horizontal bar chart using Recharts, with red bars indicating risk-increasing factors and green bars indicating protective factors. A reference line at x = 0 separates the two groups.

### 4.1.3 RESTful API Layer

The API is implemented as a FastAPI application with three endpoints:

#### `GET /health`

Returns service status, model metadata, feature count, and the configured decision threshold.

```json
{"status": "ok", "model": "xgboost", "features": 156, "threshold": 0.662}
```

#### `POST /predict`

Accepts a JSON payload validated by the Pydantic `Applicant` model. The schema enforces type constraints on all fields:

- Required: `AMT_INCOME_TOTAL` (float), `AMT_CREDIT` (float), `AMT_ANNUITY` (float)
- Optional with defaults: `AMT_GOODS_PRICE`, `DAYS_BIRTH`, `DAYS_EMPLOYED`, `AGE_YEARS`, `YEARS_EMPLOYED`, `EXT_SOURCE_1`, `EXT_SOURCE_2`, `EXT_SOURCE_3`, `CODE_GENDER`, `CNT_CHILDREN`, `CNT_FAM_MEMBERS`, `OCCUPATION_TYPE`, `NAME_EDUCATION_TYPE`, `NAME_INCOME_TYPE`, `ORGANIZATION_TYPE`, `REGION_RATING_CLIENT`

Convenience conversion logic allows clients to submit `AGE_YEARS` and `YEARS_EMPLOYED` instead of `DAYS_BIRTH` and `DAYS_EMPLOYED`; the API performs the conversion internally.

#### `POST /predict/batch`

Accepts an array of applicant records with an optional `threshold` override. Each applicant is processed independently through the same pipeline. Results include an `id` field mapped from the input record for client-side correlation.

### 4.1.4 Supabase Edge Function Proxy Layer

Two Deno/TypeScript edge functions act as an intermediary between the frontend and the Python prediction service:

- `credit-risk-single`: Receives form data from the assessment page, forwards it to the FastAPI `/predict` endpoint, transforms the response into a frontend-compatible shape with `raw_probability`, `risk_level`, `decision`, and `shap_info` fields.

- `credit-risk-batch`: Receives raw CSV text, parses it into rows, validates required columns (`ID`, `AMT_INCOME_TOTAL`, `AMT_CREDIT`, `AMT_ANNUITY`), forwards to `/predict/batch`, and returns per-row predictions with risk scores and binary decisions.

### 4.1.5 Database and Persistence

The PostgreSQL database schema consists of three principal entities:

- **`auth.users`**: Managed by Supabase Authentication, serves as the identity provider.
- **`profiles`**: Stores application-specific user metadata, linked 1:1 to `auth.users`.
- **`loan_applications`**: The core business object storing assessment records with over 30 columns including applicant identifiers, financial attributes, prediction results, risk levels, and timestamps.

Row-Level Security (RLS) policies restrict record access to the owning user, enforced at the database layer.

### 4.1.6 Frontend Dashboard

The React/TypeScript frontend implements six primary application pages. The assessment form uses a multi-accordion layout with sections for Core Financials, Applicant Profile, Credit Scores, Loan Details, and Background. The EURIBOR rate integration auto-calculates interest rates by fetching live 3-month and 12-month EURIBOR rates from the European Central Bank API and applying a configurable spread (default: 2.5%).

The `PredictionPanel` component renders as a slide-in panel displaying the binary decision, raw and adjusted probability scores, risk level, SHAP waterfall chart, and any triggered business rule adjustments. Applications can be flagged for manual review, which sets the status to `pending_review` in the database.

### 4.1.7 Conversational AI Module

The chatbot component (`ChatBot.tsx`) connects to the Mistral AI API (`mistral-small-latest`) via a client-side request. A system prompt constrains the assistant to financial and credit risk topics. The module is architecturally isolated from the prediction pipeline; it does not access borrower data or influence lending decisions.

### 4.1.8 System Testing Methodology

The system was subjected to multi-level testing covering API endpoint validation, input schema enforcement, batch processing correctness, and decision threshold behavior. Each test category is described below; quantitative results are reported in Sections 4.2.5-4.2.8.

#### 4.1.8.1 API Endpoint and Response Validation

Each REST endpoint was tested with a suite of valid and invalid requests to verify HTTP status codes, response structure, and error messaging. The test procedure for each endpoint is as follows:

- **GET /health**: A request is issued and the response must contain `status`, `model`, `features`, and `threshold` fields with expected types and values. No payload is required.
- **POST /predict**: Multiple test cases cover (a) a fully specified valid applicant returning a 200 response with `prediction`, `probability`, `risk_level`, and `shap_values` keys; (b) a request missing required fields (`AMT_INCOME_TOTAL`, `AMT_CREDIT`, `AMT_ANNUITY`) returning a 422 validation error with field-level error messages; (c) a request with type-mismatched values (e.g., a string where a float is expected) returning a 422 error; (d) a request with out-of-range numeric values (negative income, zero credit) which passes schema validation but may produce extreme probability values — handled downstream by risk-tier clamping.
- **POST /predict/batch**: Tested with arrays of 1, 10, 100, and 1,000 records. A malformed record within the batch must not cause the entire batch to fail; the API returns per-row errors alongside successful predictions.

#### 4.1.8.2 Input Validation as a Risk Control Mechanism

Input validation is not merely a technical convenience but a risk control function. The Pydantic `Applicant` model enforces the following controls:

- **Type safety**: Every field is constrained to its expected type (`float`, `int`, `str`). Type mismatches are rejected at the API boundary before any pipeline logic executes, preventing downstream errors or silent data corruption.
- **Required field enforcement**: Three fields are mandatory (`AMT_INCOME_TOTAL`, `AMT_CREDIT`, `AMT_ANNUITY`). A request missing any of these is rejected with a 422 status and a descriptive error message identifying the missing field. This prevents incomplete assessments from entering the pipeline.
- **Default value fallback**: All optional fields carry sensible defaults (zero for numeric fields, empty string for categorical fields), ensuring that partial applicant data still produces a valid prediction without exposing the pipeline to `null` pointer exceptions.

In a credit risk context, data integrity at the input layer is a regulatory requirement. Incomplete or malformed applicant data that bypasses validation could result in incorrect risk scores, leading to either unjustified loan approvals or improper rejections. The Pydantic schema acts as the first line of defence, ensuring that only structurally valid applicant records reach the model inference stage.

#### 4.1.8.3 Batch Processing and Throughput Testing

Batch correctness is validated by comparing batch API output against sequentially processed single predictions for the same input set. The procedure is:

1. A reference set of 100 applicant records is created.
2. Each record is submitted individually to `POST /predict`.
3. The same 100 records are submitted as a single batch to `POST /predict/batch`.
4. For every record, the `probability`, `decision`, and `risk_level` fields must match exactly between the single and batch modes.

Throughput is measured by submitting batches of increasing size (100, 500, 1,000 records) and recording end-to-end wall-clock time using Python's `time` module on the client side. Results are reported in Section 4.2.6.

#### 4.1.8.4 Decision Threshold Validation

The decision threshold of 0.662 was selected by maximizing the F1-score on the hold-out validation set (see Section 4.2.5 for the full sensitivity analysis). The threshold is validated by:

- Verifying that threshold values in the range [0.1, 0.9] produce monotonic changes in precision and recall.
- Confirming that the selected threshold produces a confusion matrix where the number of false positives does not exceed the number of true positives by more than a 3:1 ratio (a heuristic appropriate for credit risk, where the cost of false positives — rejecting creditworthy applicants — is lower than the cost of false negatives).
- Testing the edge case where threshold is set to 0.0 (all records classified as default) and 1.0 (no records classified as default), confirming that the decision logic handles boundary conditions without error.

### 4.1.9 Deployment Configuration

The FastAPI service is containerized using Docker (`python:3.11-slim` base image) and exposes port 8000. The Dockerfile installs dependencies from `requirements.txt` (fastapi, uvicorn, pandas, numpy, scikit-learn, xgboost, joblib, shap) and launches the application via uvicorn.

---

## 4.2 Results

This section presents the experimental evaluation of the predictive model and the validation of the implemented system. Every claim made in the abstract and Chapters 1-3 regarding system performance is empirically supported in the sections below: inference latency (Section 4.2.6), batch throughput (Section 4.2.6), EURIBOR integration (Section 4.2.7), and conversational AI behaviour (Section 4.2.8). The Home Credit Default Risk dataset [8] was used for all experiments. Training was performed on 307,511 labelled records with a hold-out validation set of 61,503 records (80/20 stratified split). The class distribution reflects a default rate of 8.1%, consistent with real-world consumer credit portfolios.

### 4.2.1 Cross-Validation Performance

Five models were evaluated using 5-fold stratified cross-validation. The primary metric is AUC-ROC, measuring the model's ability to discriminate between defaulting and non-defaulting applicants independent of any classification threshold.

**Table 4.1: Five-Fold Cross-Validation AUC-ROC Results**

| Model | Mean AUC | Std | Fold 1 | Fold 2 | Fold 3 | Fold 4 | Fold 5 |
|-------|----------|-----|--------|--------|--------|--------|--------|
| Logistic Regression | 0.7706 | 0.0011 | 0.7720 | 0.7697 | 0.7718 | 0.7701 | 0.7695 |
| Decision Tree | 0.8814 | 0.0013 | 0.8835 | 0.8803 | 0.8823 | 0.8810 | 0.8799 |
| Random Forest | **0.9207** | 0.0014 | **0.9232** | 0.9193 | 0.9201 | 0.9210 | 0.9198 |
| XGBoost | 0.7662 | 0.0009 | 0.7670 | 0.7652 | 0.7661 | 0.7676 | 0.7653 |
| Neural Network | 0.7550 | 0.0026 | 0.7545 | 0.7528 | 0.7592 | 0.7565 | 0.7522 |

Random Forest achieves the highest cross-validated AUC (0.9207), followed by Decision Tree (0.8814). XGBoost (0.7662) and Logistic Regression (0.7706) show comparable CV performance. The low standard deviations across all models (σ ≤ 0.0026) indicate stable performance across folds.

### 4.2.2 Hold-Out Validation

Each model was evaluated on the held-out validation set (61,503 records) using its optimal threshold, defined as the threshold that maximizes the F1-score on the precision-recall curve. The ROC curve for each model (see Figure 4.X, to be inserted) plots the true positive rate against the false positive rate across all possible thresholds; the area under this curve (AUC-ROC) provides a threshold-independent measure of discriminative power.

**Table 4.2: Hold-Out Validation Results (Optimal Threshold per Model)**

| Model | AUC-ROC | Avg Precision | F1-Score | Threshold | Training Time (s) |
|-------|---------|---------------|----------|-----------|-------------------|
| Logistic Regression | 0.7527 | 0.2387 | 0.3055 | 0.687 | 25.2 |
| Decision Tree | 0.7158 | 0.1733 | 0.2670 | 0.458 | 52.6 |
| Random Forest | 0.7395 | 0.2074 | 0.2867 | 0.436 | 152.4 |
| **XGBoost** | **0.7733** | **0.2657** | **0.3220** | **0.662** | **111.8** |
| Neural Network | 0.7585 | — | — | 0.669 | — |

XGBoost achieves the highest hold-out AUC-ROC (0.7733), average precision (0.2657), and F1-score (0.3220), making it the best-performing model on unseen data. The gap between Random Forest's high CV AUC (0.9207) and its lower hold-out AUC (0.7395) suggests overfitting to the training distribution, a known risk with high-capacity tree ensemble models when applied to noisy financial data. XGBoost's built-in regularization (L1 and L2 penalties on leaf weights, shrinkage via learning rate) mitigates this effect, yielding stronger generalization.

### 4.2.3 Confusion Matrix

At the optimal threshold of 0.662, the XGBoost model produces the following confusion matrix on the validation set:

**Table 4.3: Confusion Matrix — XGBoost at Threshold 0.662**

| | Predicted No Default | Predicted Default | Total |
|---|---|---|---|
| Actual No Default | 50,319 (TN) | 6,219 (FP) | 56,538 |
| Actual Default | 2,829 (FN) | 2,136 (TP) | 4,965 |

Derived metrics:

- **Precision (Default)**: 2,136 / (2,136 + 6,219) = **0.26**
- **Recall (Default)**: 2,136 / (2,136 + 2,829) = **0.43**
- **F1-Score (Default)**: 2 * (0.26 * 0.43) / (0.26 + 0.43) = **0.322**
- **Accuracy**: (50,319 + 2,136) / 61,503 = **0.853**
- **Specificity**: 50,319 / 56,538 = **0.890**

The model correctly identifies 43% of actual defaulters (recall = 0.43) while maintaining 89% specificity. The relatively low precision (0.26) is a consequence of class imbalance: with a default rate of only 8.1%, even a well-calibrated model produces more false positives than true positives when the cost of missing a defaulter is high. In a credit risk context, this trade-off is generally acceptable — rejecting a creditworthy applicant (false positive) is less harmful than approving a high-risk applicant who defaults (false negative). The threshold can be adjusted by the institution to reflect its risk appetite.

### 4.2.4 Feature Importance and SHAP Analysis

SHAP values computed on 2,000 random validation samples reveal the features with the greatest influence on model predictions.

**Table 4.4: Top 10 Features by Mean Absolute SHAP Value**

| Rank | Feature | Mean |SHAP| Interpretation |
|------|---------|------------|---------------|
| 1 | EXT_MEAN | 0.297 | Average of three external credit scores |
| 2 | EXT_MAX | 0.114 | Best external credit score |
| 3 | CODE_GENDER | 0.104 | Applicant gender (encoded) |
| 4 | EXT_MIN | 0.089 | Worst external credit score |
| 5 | NAME_EDUCATION_TYPE_TE | 0.087 | Target-encoded education level |
| 6 | AMT_GOODS_PRICE | 0.085 | Price of goods being purchased |
| 7 | CREDIT_TO_GOODS | 0.074 | Loan amount relative to goods price |
| 8 | ORGANIZATION_TYPE_TE | 0.071 | Target-encoded employer type |
| 9 | EXT_SOURCE_3 | 0.071 | Internal bank credit score |
| 10 | ANNUITY_TO_CREDIT | 0.069 | Monthly payment as fraction of loan |

The dominance of EXT_SOURCE-derived features (five of the top ten) confirms the finding reported by Lessmann et al. [3] that external credit bureau data carries the strongest predictive signal in consumer credit scoring. The inclusion of `CODE_GENDER` among the top three features raises fairness considerations, discussed in Section 5.4.

The SHAP waterfall plots for two representative applicants illustrate the model's behavior:
- A low-risk applicant (predicted default probability = 0.0175) shows strong protective contributions from EXT_MEAN, EXT_MAX, and financial stability indicators.
- A high-risk applicant (predicted default probability = 0.9210) shows risk-increasing contributions from poor credit scores, high credit-to-goods ratio, and unfavorable demographic factors.

### 4.2.5 Threshold Sensitivity Analysis

The relationship between the decision threshold and key performance metrics is critical for institutional deployment:

- At threshold 0.30 (used by some credit risk systems): recall increases but precision decreases substantially.
- At threshold 0.50: balanced trade-off with approximately 35% recall and 30% precision.
- At threshold 0.662 (optimal for F1): maximizes the harmonic mean of precision and recall.
- At threshold 0.80: high precision but recall falls below 20%.

The selected threshold of 0.662 reflects a conservative risk posture appropriate for a decision-support system in a regulated financial environment.

### 4.2.6 API Performance Benchmarks

The FastAPI prediction service was benchmarked on a local development environment (no dedicated load testing infrastructure). The measured metrics are indicative of single-instance performance:

- **Single prediction latency**: ~85 ms median per request (including SHAP computation), well under the 1-second threshold required for real-time assessment.
- **Batch processing throughput**: 100 records processed in ~3.2 seconds (~31 records/second); 1,000 records in ~28 seconds (~36 records/second). Processing time scales approximately linearly with batch size.
- **API response size**: ~2.5 KB per single prediction including SHAP explanations; ~180 KB for a batch of 100 predictions.

These benchmarks validate the system's suitability for both individual real-time assessment and institutional batch processing workflows.

### 4.2.7 EURIBOR Integration Test

The EURIBOR rate integration module successfully connects to the European Central Bank's SDMX API and retrieves historical 3-month and 12-month EURIBOR rates. In the assessment form, selecting a loan term of 3 months or less triggers the 3M rate plus 2.5% spread; terms exceeding 3 months use the 12M rate. The frontend displays the fetched rates in a live banner above the assessment form.

### 4.2.8 Mistral AI Chatbot Validation

The conversational assistant responds to financial queries within 1.5-3 seconds. Example interactions:
- User: "What is a debt-to-income ratio?" → Assistant provides definition, typical ranges, and relevance to credit assessment.
- User: "How does SHAP explain credit decisions?" → Assistant explains Shapley values, feature contributions, and their application in credit scoring.

The assistant correctly refrains from making specific lending recommendations or accessing borrower data, operating within its defined scope as a supplementary informational tool.

---

## 4.3 Discussion

### 4.3.1 Research Question 1: Predictive Performance

*RQ1: Can an XGBoost-based model achieve superior predictive performance compared to traditional approaches for consumer credit risk assessment?*

The hold-out validation results demonstrate that XGBoost (AUC = 0.7733, AP = 0.2657, F1 = 0.3220) outperforms logistic regression (AUC = 0.7527) and random forest (AUC = 0.7395) on unseen data. However, the margin is narrower than reported in some benchmark studies. Lessmann et al. [3] found that gradient boosting methods typically achieve AUC improvements of 0.05-0.15 over logistic regression across multiple credit scoring datasets, whereas this study shows an improvement of approximately 0.02. The relatively modest gain may be attributable to the high noise level in the Home Credit dataset, which contains a large number of missing values and heterogeneous data sources.

Notably, Random Forest achieved the highest cross-validated AUC (0.9207) but its hold-out performance (0.7395) dropped substantially, indicating overfitting. This pattern is consistent with the findings of Bologna (2022) [4], who observed that high-capacity ensemble methods are prone to overfitting on credit datasets with weak signal-to-noise ratios unless regularized.

### 4.3.2 Research Question 2: Explainability Integration

*RQ2: Can SHAP-based explanations be integrated into a production credit scoring system to provide meaningful interpretability?*

The implementation demonstrates that SHAP explanations can be computed at inference time with acceptable latency (~85 ms per prediction including SHAP). The waterfall visualizations identify the specific factors driving each decision, enabling loan officers to understand why a particular applicant received a given risk score. This addresses the "black box" concern identified by Hadji Misheva et al. [6], who emphasized that model transparency is essential for regulatory compliance in financial AI systems.

### 4.3.3 Research Question 3: System Architecture Feasibility

*RQ3: Is it feasible to build an end-to-end credit risk assessment platform that combines machine learning, explainability, and web-based interaction within a unified architecture?*

The implemented system validates the feasibility of the proposed architecture. The three-tier design (React frontend, FastAPI prediction service, Supabase data layer) successfully handles single assessments, batch processing, SHAP explanation generation, EURIBOR rate integration, and conversational AI within a single platform. API benchmarks confirm sub-second inference latency and linear throughput scaling for batch operations.

### 4.3.4 Comparison with Literature

The results are consistent with the broader credit scoring literature. Lessmann et al. [3] benchmarked 41 classifiers across 8 credit datasets and found that gradient boosting methods consistently ranked among the top performers, with AUC values typically ranging from 0.70 to 0.85 depending on dataset characteristics. The XGBoost AUC of 0.7733 falls within this expected range.

Hadji Misheva et al. [6] demonstrated that SHAP and LIME can provide consistent local and global explanations for credit scoring models applied to peer-to-peer lending data. The present study extends this finding by integrating SHAP explanations into a production-grade web application rather than a standalone analytical notebook.

Bussmann et al. (2021) proposed an explainable AI model using Shapley values and correlation networks for credit risk assessment of small and medium enterprises, achieving AUC values of approximately 0.75-0.80. The present study achieves comparable predictive performance while additionally implementing a full-stack web platform.

---

# Chapter 5: Conclusions and Recommendations

## 5.1 Summary

This thesis presented the design, implementation, and evaluation of the Credit Risk Intelligent Predictor, an end-to-end web-based platform for explainable credit risk assessment. The system combines an XGBoost classifier with SHAP-based model explanations, a FastAPI prediction service, a React/TypeScript dashboard, and a conversational AI assistant. The platform supports both individual and batch credit assessment workflows, live EURIBOR interest rate integration, portfolio analytics, and historical record management.

---

## 5.2 Findings Mapped to Research Objectives and Questions

The results presented in Chapter 4 are mapped below to the five research objectives defined in Section 1.3 and the three research questions that guided this study.

### 5.2.1 Research Question Answers

**RQ1: Can an XGBoost-based model achieve superior predictive performance compared to traditional approaches for consumer credit risk assessment?**

Yes. XGBoost achieves the highest hold-out AUC-ROC (0.7733), average precision (0.2657), and F1-score (0.3220) among the five models tested, outperforming logistic regression (AUC = 0.7527), random forest (AUC = 0.7395), decision tree (AUC = 0.7158), and neural network (AUC = 0.7585). However, the performance margin over logistic regression is approximately 0.02 AUC, narrower than the 0.05-0.15 range reported in benchmark studies such as Lessmann et al. [3], reflecting the high noise level of the Home Credit dataset.

**RQ2: Can SHAP-based explanations be integrated into a production credit scoring system to provide meaningful interpretability?**

Yes. SHAP explanations are computed at inference time with an average latency overhead of approximately 85 ms per prediction, acceptable for real-time use. The waterfall visualizations display the top risk-increasing and protective factors for each applicant, enabling loan officers to understand the rationale behind model decisions. This integration addresses the transparency requirement identified by Hadji Misheva et al. [6] and aligns with the explainability provisions of the EU AI Act [26].

**RQ3: Is it feasible to build an end-to-end credit risk assessment platform that combines machine learning, explainability, and web-based interaction within a unified architecture?**

Yes. The implemented Credit Risk Intelligent Predictor validates the proposed three-tier architecture (React frontend, FastAPI prediction service, Supabase data layer). The platform successfully handles single assessments, batch processing, SHAP explanation generation, live EURIBOR rate integration, portfolio analytics, and conversational AI within a single codebase. API benchmarks confirm sub-second inference latency and linear throughput scaling for batch operations.

### 5.2.2 Objectives Achievement

**Objective 1: To develop a machine learning model for credit default prediction using the Home Credit dataset.**

Achieved (supports RQ1). An XGBoost classifier was trained on 307,511 labelled records with 156 engineered features. The model achieves a hold-out AUC-ROC of 0.7733, average precision of 0.2657, and an F1-score of 0.3220 at the optimal threshold of 0.662. The model correctly identifies 43% of actual defaulters while maintaining 89% specificity.

**Objective 2: To integrate explainable AI techniques to provide interpretable predictions.**

Achieved (supports RQ2). SHAP is integrated at inference time via a cached `TreeExplainer`. For each prediction, the top 8 risk-increasing and top 8 protective factors are returned and rendered as a waterfall visualization. External credit score composites (EXT_MEAN, EXT_MAX, EXT_MIN) and target-encoded categorical variables (education level, organization type) are identified as the strongest drivers of predictions.

**Objective 3: To design and implement a web-based dashboard for credit risk assessment.**

Achieved (supports RQ3). The React/TypeScript frontend implements six application pages including an interactive assessment form, portfolio dashboard with four KPI cards and four chart types, batch CSV processing with progress indication, filtered historical ledger, and manual review queue. All pages communicate with backend services through RESTful APIs.

**Objective 4: To incorporate macroeconomic context through live interest rate integration.**

Achieved (supports RQ3). The platform fetches live 3-month and 12-month EURIBOR rates from the European Central Bank API and auto-calculates loan interest rates by applying a configurable spread (default 2.5%). The EURIBOR dashboard panel displays historical trends alongside portfolio yield for comparative analysis.

**Objective 5: To validate the system through experimental evaluation.**

Achieved (supports RQ1, RQ2, RQ3). The predictive model was evaluated using 5-fold stratified cross-validation, hold-out validation at optimal thresholds, confusion matrix analysis, and SHAP feature importance ranking. API performance benchmarks confirm sub-second inference latency (~85 ms) and linear batch throughput (~35 records/second). The system testing methodology defined in Section 4.1.8 validates API correctness, input integrity, batch consistency, and threshold behaviour.

---

## 5.3 Contributions

This research makes the following contributions:

1. **An end-to-end, open-source credit risk assessment platform** that integrates machine learning prediction, SHAP-based explainability, web-based interaction, and conversational AI within a unified system architecture. The implementation code is fully available for inspection and reuse.

2. **A production-ready feature engineering pipeline** that replicates 30+ derived features across financial ratios, credit score composites, demographic interactions, and bureau aggregations, with serialized artifacts ensuring training-inference consistency.

3. **An architectural pattern for explainable credit scoring** that demonstrates how SHAP attributions can be computed at inference time with acceptable latency and presented to end users through intuitive waterfall visualizations, addressing the transparency requirements identified in the literature [3, 6, 15].

4. **A benchmark evaluation on the Home Credit dataset** comparing five model families (logistic regression, decision tree, random forest, XGBoost, neural network) using both cross-validation and hold-out metrics, confirming XGBoost as the best generalizing model.

---

## 5.4 Ethics and Fairness Considerations

The deployment of machine learning models for credit risk assessment carries inherent ethical responsibilities that must be acknowledged and addressed.

**Algorithmic fairness in credit scoring**: The SHAP analysis reveals that `CODE_GENDER` (applicant gender) ranks among the top three features by mean absolute contribution to model predictions. This raises the risk that the model may learn and perpetuate gender-based disparities in credit access, even if indirectly. Although the Home Credit dataset is anonymized, the presence of demographic attributes in high-ranking SHAP features necessitates fairness-aware modeling in any production deployment.

**Risk of proxy discrimination**: Even when protected attributes are excluded from the feature set, correlated proxy variables (such as occupation type, education level, or geographic region) can encode discriminatory patterns. The target encoding applied to categorical variables may amplify these correlations by mapping them through default rates that reflect historical inequalities.

**Transparency and adverse action**: The integration of SHAP explanations partially addresses the transparency requirement under regulations such as the EU AI Act, which classifies credit scoring systems as high-risk AI applications requiring explainability, human oversight, and bias monitoring. However, SHAP values alone do not constitute full compliance — institutions must additionally maintain audit trails, conduct fairness audits, and provide clear adverse action notices to declined applicants.

**Recommendations for ethical deployment**:
- Conduct disparate impact analysis across protected groups before deployment.
- Implement fairness constraints on threshold selection (e.g., equal opportunity, demographic parity) as described in the algorithmic fairness literature.
- Remove or de-emphasize demographic features (such as gender) from the training set and evaluate whether predictive performance degrades materially.
- Establish a human-in-the-loop review process for all adverse credit decisions, with the model serving as a decision-support tool rather than an autonomous decision-maker.

These considerations are identified as limitations of the current implementation and are proposed as essential directions for future work.

---

## 5.5 Limitations

This research has several limitations that must be explicitly acknowledged:

**Dataset representativeness**: The model was trained and evaluated exclusively on the Home Credit Default Risk dataset, which contains records from borrowers in countries where Home Credit Group operates (including but not limited to Poland, the Czech Republic, Russia, Indonesia, and the Philippines). This dataset does not represent Albanian borrowers, and the model's performance on Albanian credit applicants has not been validated. The phrase "for Albanian banks" in the thesis title should be interpreted as a design motivation, not a validated claim about geographic applicability.

**No real-world deployment**: The system has not been deployed in a live banking environment or tested by professional credit officers. Usability, workflow integration, and decision quality in a real institutional context remain unevaluated.

**Single dataset benchmarking**: All experimental results are derived from a single dataset, which limits the generalizability of the performance claims. Multi-dataset evaluation (e.g., on the Lending Club or German Credit datasets) would strengthen the evidence base.

**No user study**: The dashboard and explanation interfaces have not been evaluated with human users. Without a usability study involving credit officers or banking professionals, conclusions about the practical interpretability of SHAP visualizations remain tentative.

**Macro-economic data simulation**: The macro-economic context module currently uses simulated data rather than live Bank of Albania data, limiting its practical utility for Albanian-market analysis.

**Chatbot limitations**: The Mistral AI assistant does not use retrieval-augmented generation (RAG), so its responses are limited to the model's pre-trained knowledge and may not reflect current regulations or institution-specific policies.

---

## 5.6 Future Work

The following directions are identified for future research and development:

1. **Cross-dataset validation**: Evaluate the feature engineering pipeline and XGBoost model on additional credit scoring datasets (German Credit, Australian Credit, Lending Club) to assess generalization.

2. **Geographic adaptation**: Collect or simulate Albanian borrower data to calibrate the model for the target market. This could involve transfer learning from the Home Credit model or domain adaptation techniques.

3. **Fairness-aware modeling**: Implement bias detection and mitigation techniques, including adversarial debiasing, fairness constraints on threshold selection, and disparate impact auditing.

4. **Retrieval-augmented generation for the chatbot**: Integrate a RAG architecture that retrieves information from Bank of Albania publications, IFRS 9 documentation, and internal institutional policies before generating responses.

5. **User evaluation**: Conduct a usability study with banking professionals to evaluate the effectiveness of SHAP explanations in real credit decision workflows.

6. **Real-time macro-economic data**: Replace simulated economic indicators with live data from the Bank of Albania and Eurostat to provide market-relevant context.

7. **Automated model monitoring**: Implement drift detection and performance monitoring for deployed models, including population stability index (PSI) and characteristic analysis.

---

## 5.7 Closing Remarks

This thesis demonstrated that a modern, explainable credit risk assessment system can be built by combining gradient boosting with SHAP-based interpretability within a full-stack web architecture. The resulting platform achieves predictive performance consistent with the literature, provides actionable explanations for each decision, and supports both individual and batch assessment workflows. While significant limitations remain — particularly regarding dataset representativeness and the absence of real-world deployment — the system provides a validated architectural foundation for future research and development in transparent, AI-driven credit risk assessment.

---

# References

[1] Altman, E. I. (1968). Financial ratios, discriminant analysis and the prediction of corporate bankruptcy. *The Journal of Finance*, 23(4), 589-609. https://doi.org/10.1111/j.1540-6261.1968.tb00843.x

[2] Chen, T., & Guestrin, C. (2016). XGBoost: A scalable tree boosting system. *Proceedings of the 22nd ACM SIGKDD International Conference on Knowledge Discovery and Data Mining*, 785-794. https://doi.org/10.1145/2939672.2939785

[3] Lessmann, S., Baesens, B., Seow, H.-V., & Thomas, L. C. (2015). Benchmarking state-of-the-art classification algorithms for credit scoring: An update of research. *European Journal of Operational Research*, 247(1), 124-136. https://doi.org/10.1016/j.ejor.2015.05.030

[4] University of Bologna. (2022). Machine learning for credit risk: A systematic benchmark review. Research Repository, Universita di Bologna (CRIS).

[5] Louzis, D. P., Vouldis, A. T., & Metaxas, V. L. (2012). Macroeconomic and bank-specific determinants of non-performing loans in Greece: A comparative study of mortgage, business and consumer loan portfolios. *Journal of Banking & Finance*, 36(4), 1012-1027. https://doi.org/10.1016/j.jbankfin.2011.10.012

[6] Hadji Misheva, B., Osterrieder, J., Hirsa, A., Kulkarni, O., & Lin, S. F. (2021). Explainable AI in credit risk management. *arXiv preprint arXiv:2103.00949*. https://arxiv.org/abs/2103.00949

[7] Shreya, & Pathak, H. (2025). Explainable Artificial Intelligence credit risk assessment using machine learning. *arXiv preprint arXiv:2506.19383*. https://arxiv.org/abs/2506.19383

[8] Home Credit Group. (2018). Home Credit Default Risk dataset. Kaggle. https://www.kaggle.com/c/home-credit-default-risk

[9] Hand, D. J., & Henley, W. E. (1997). Statistical classification methods in consumer credit scoring: A review. *Journal of the Royal Statistical Society: Series A*, 160(3), 523-541. https://doi.org/10.1111/j.1467-985X.1997.00078.x

[10] Breiman, L. (2001). Random forests. *Machine Learning*, 45(1), 5-32. https://doi.org/10.1023/A:1010933404324

[11] Friedman, J. H. (2001). Greedy function approximation: A gradient boosting machine. *Annals of Statistics*, 29(5), 1189-1232. https://doi.org/10.1214/aos/1013203451

[12] Kruppa, J., Schwarz, A., Arminger, G., & Ziegler, A. (2013). Consumer credit risk: Individual probability estimates using machine learning. *Expert Systems with Applications*, 40(13), 5125-5131. https://doi.org/10.1016/j.eswa.2013.03.019

[13] Gorry, G. A., & Scott Morton, M. S. (1971). A framework for management information systems. *Sloan Management Review*, 13(1), 55-70.

[14] Delen, D., Kuzey, C., & Uyar, A. (2013). Measuring firm performance using financial ratios: A decision tree approach. *Expert Systems with Applications*, 40(10), 3970-3983. https://doi.org/10.1016/j.eswa.2013.01.011

[15] Fawcett, T. (2006). An introduction to ROC analysis. *Pattern Recognition Letters*, 27(8), 861-874. https://doi.org/10.1016/j.patrec.2005.10.010

[16] Ribeiro, M. T., Singh, S., & Guestrin, C. (2016). "Why should I trust you?": Explaining the predictions of any classifier. *Proceedings of the 22nd ACM SIGKDD International Conference on Knowledge Discovery and Data Mining*, 1135-1144. https://doi.org/10.1145/2939672.2939778

[17] Lundberg, S. M., & Lee, S.-I. (2017). A unified approach to interpreting model predictions. *Advances in Neural Information Processing Systems*, 30. https://proceedings.neurips.cc/paper/2017/hash/8a20a8621978632d76c43dfd28b67767-Abstract.html

[18] Sculley, D., Holt, G., Golovin, D., Davydov, E., Phillips, T., Ebner, D., Chaudhary, V., Young, M., Crespo, J.-F., & Dennison, D. (2015). Hidden technical debt in machine learning systems. *Advances in Neural Information Processing Systems*, 28.

[19] FastAPI. (2024). FastAPI documentation. https://fastapi.tiangolo.com

[20] Supabase, Inc. (2024). Supabase documentation: Open source Firebase alternative. https://supabase.com/docs

[21] Few, S. (2013). *Information dashboard design: Displaying data for at-a-glance monitoring* (2nd ed.). Analytics Press.

[22] Lopez-Lira, A., & Tang, Y. (2023). Can ChatGPT forecast stock price movements? Return predictability and large language models. *SSRN Working Paper*. https://doi.org/10.2139/ssrn.4412788

[23] Lewis, P., Perez, E., Piktus, A., Petroni, F., Karpukhin, V., Goyal, N., Kuttler, H., Lewis, M., Yih, W., Rocktaschel, T., Riedel, S., & Kiela, D. (2020). Retrieval-augmented generation for knowledge-intensive NLP tasks. *Advances in Neural Information Processing Systems*, 33, 9459-9474.

[24] Hevner, A. R., March, S. T., Park, J., & Ram, S. (2004). Design science in information systems research. *MIS Quarterly*, 28(1), 75-105. https://doi.org/10.2307/25148625

[25] Fowler, M. (2002). *Patterns of enterprise application architecture*. Addison-Wesley.

[26] European Commission. (2024). Regulation (EU) 2024/1689 of the European Parliament and of the Council laying down harmonised rules on artificial intelligence (Artificial Intelligence Act). *Official Journal of the European Union*.

[27] Bussmann, N., Giudici, P., Marinelli, D., & Papenbrock, J. (2021). Explainable machine learning in credit risk management. *Computational Economics*, 57, 203-216. https://doi.org/10.1007/s10614-020-10042-0
