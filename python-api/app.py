"""
Credit Default Risk Prediction API
Deploy this FastAPI app alongside your trained XGBoost model artifacts.

Required files in the same directory:
  - xgb_model.pkl          (trained XGBoost model)
  - imputer.pkl            (fitted SimpleImputer)
  - te_maps.pkl            (target encoding maps)
  - feature_columns.json   (ordered list of feature column names)

Deploy to Railway, Render, or any Docker host.
"""

import json
import os
from typing import Optional

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ── Load model artifacts ──────────────────────────────────────────────────────
MODEL_DIR = os.environ.get("MODEL_DIR", ".")

xgb_model    = joblib.load(os.path.join(MODEL_DIR, "xgb_model.pkl"))
imputer      = joblib.load(os.path.join(MODEL_DIR, "imputer.pkl"))
te_maps      = joblib.load(os.path.join(MODEL_DIR, "te_maps.pkl"))

with open(os.path.join(MODEL_DIR, "feature_columns.json")) as f:
    feat_cols = json.load(f)

# Global mean default rate from training data (≈8.1% for Home Credit)
GLOBAL_MEAN = float(os.environ.get("GLOBAL_MEAN", "0.0807"))

# ── Helpers (mirrored from notebook) ──────────────────────────────────────────

def occupation_group(job):
    if pd.isna(job):
        return "N/A"
    if job in [
        "Laborers", "Low-skill Laborers", "Drivers", "Cleaning staff",
        "Cooking staff", "Waiters/barmen staff", "Security staff",
    ]:
        return "Low-Skill & Manual"
    if job in [
        "Core staff", "Sales staff", "Private service staff", "Secretaries",
        "HR staff", "Realty agents",
    ]:
        return "Mid-Skill & Office Support"
    if job in [
        "Accountants", "Managers", "Medicine staff", "High skill tech staff", "IT staff",
    ]:
        return "High-Skill & Professional"
    return "N/A"


def feature_engineering_single(row_dict: dict) -> pd.DataFrame:
    """Apply the same feature engineering as the notebook to a single applicant dict."""
    df = pd.DataFrame([row_dict])

    # Age
    if "DAYS_BIRTH" in df.columns:
        df["AGE_YEARS"] = (-df["DAYS_BIRTH"]) / 365.25
        df["AGE_BUCKET"] = pd.cut(
            df["AGE_YEARS"], bins=[0, 25, 30, 40, 50, 60, 100], labels=[0, 1, 2, 3, 4, 5]
        ).astype(float).fillna(2)
        df["IS_YOUNG"] = (df["AGE_YEARS"] < 30).astype(int)

    # Employment
    if "DAYS_EMPLOYED" in df.columns:
        df["YEARS_EMPLOYED"] = (-df["DAYS_EMPLOYED"].clip(upper=0)) / 365.25
        df["IS_UNEMPLOYED"] = df["DAYS_EMPLOYED"].isna().astype(int)
        if "AGE_YEARS" in df.columns:
            df["EMPLOYMENT_TO_AGE"] = df["YEARS_EMPLOYED"] / (df["AGE_YEARS"] + 1)
        if "DAYS_BIRTH" in df.columns:
            df["DAYS_EMPLOYED_PERC"] = df["DAYS_EMPLOYED"] / (df["DAYS_BIRTH"] + 1)

    # Financial ratios
    if "AMT_INCOME_TOTAL" in df.columns and "AMT_CREDIT" in df.columns:
        df["CREDIT_TO_INCOME"] = df["AMT_CREDIT"] / (df["AMT_INCOME_TOTAL"] + 1)
    if "AMT_ANNUITY" in df.columns and "AMT_INCOME_TOTAL" in df.columns:
        df["ANNUITY_TO_INCOME"] = df["AMT_ANNUITY"] / (df["AMT_INCOME_TOTAL"] + 1)
    if "AMT_CREDIT" in df.columns and "AMT_GOODS_PRICE" in df.columns:
        df["CREDIT_TO_GOODS"] = df["AMT_CREDIT"] / (df["AMT_GOODS_PRICE"] + 1)
    if "AMT_ANNUITY" in df.columns and "AMT_CREDIT" in df.columns:
        df["ANNUITY_TO_CREDIT"] = df["AMT_ANNUITY"] / (df["AMT_CREDIT"] + 1)
        df["CREDIT_TERM"] = df["AMT_CREDIT"] / (df["AMT_ANNUITY"] + 1)
        df["PAYMENT_RATE"] = df["AMT_ANNUITY"] / (df["AMT_CREDIT"] + 1)
    if "AMT_CREDIT" in df.columns and "AMT_GOODS_PRICE" in df.columns:
        df["GOODS_CREDIT_DIFF"] = df["AMT_CREDIT"] - df["AMT_GOODS_PRICE"]
    if "AMT_INCOME_TOTAL" in df.columns and "CNT_FAM_MEMBERS" in df.columns:
        df["INCOME_PER_PERSON"] = df["AMT_INCOME_TOTAL"] / df["CNT_FAM_MEMBERS"].clip(lower=1)
    if "CNT_CHILDREN" in df.columns and "CNT_FAM_MEMBERS" in df.columns:
        df["CHILDREN_RATIO"] = df["CNT_CHILDREN"] / (df["CNT_FAM_MEMBERS"] + 1)

    # Occupation group
    if "OCCUPATION_TYPE" in df.columns:
        df["OCCUPATION_GROUP"] = df["OCCUPATION_TYPE"].map(occupation_group)

    # EXT_SOURCE composites
    ext = [c for c in ["EXT_SOURCE_1", "EXT_SOURCE_2", "EXT_SOURCE_3"] if c in df.columns]
    if ext:
        df["EXT_MEAN"] = df[ext].mean(axis=1)
        df["EXT_MIN"] = df[ext].min(axis=1)
        df["EXT_MAX"] = df[ext].max(axis=1)
        df["EXT_STD"] = df[ext].std(axis=1)
        df["EXT_PROD"] = df[ext].prod(axis=1)
        weights = {"EXT_SOURCE_1": 1, "EXT_SOURCE_2": 3, "EXT_SOURCE_3": 2}
        total_w = sum(weights[c] for c in ext)
        df["EXT_WEIGHTED"] = sum(df[c] * weights[c] for c in ext) / total_w
        if "EXT_SOURCE_2" in df.columns:
            if "AMT_INCOME_TOTAL" in df.columns:
                df["EXT2_x_INCOME"] = df["EXT_SOURCE_2"] * df["AMT_INCOME_TOTAL"] / 1e5
            if "AMT_CREDIT" in df.columns:
                df["EXT2_x_CREDIT"] = df["EXT_SOURCE_2"] * df["AMT_CREDIT"] / 1e5
            if "AGE_YEARS" in df.columns:
                df["EXT2_x_AGE"] = df["EXT_SOURCE_2"] * df["AGE_YEARS"]

    # Credit bureau requests
    req_cols = [c for c in df.columns if "AMT_REQ_CREDIT_BUREAU" in c]
    if req_cols:
        df["TOTAL_CREDIT_REQS"] = df[req_cols].sum(axis=1)

    # Document count
    doc_cols = [c for c in df.columns if "FLAG_DOCUMENT" in c]
    if doc_cols:
        df["TOTAL_DOCS"] = df[doc_cols].sum(axis=1)

    return df


def predict_single(applicant: dict, threshold: float = 0.5) -> dict:
    """Predict credit default risk for a single applicant."""
    row = feature_engineering_single(applicant)

    # Target encoding
    for col, te_map in te_maps.items():
        if col in row.columns:
            row[col + "_TE"] = row[col].map(te_map).fillna(GLOBAL_MEAN)
            row.drop(columns=[col], inplace=True, errors="ignore")

    # Align to training feature set
    full = pd.DataFrame([{c: row[c].iloc[0] if c in row.columns else np.nan for c in feat_cols}])
    for col in full.select_dtypes("object").columns:
        full[col] = 0

    prob = float(xgb_model.predict_proba(imputer.transform(full[feat_cols]))[:, 1][0])
    decision = "DEFAULT" if prob >= threshold else "NO DEFAULT"

    if prob < 0.05:
        tier, policy = "VERY LOW", "Premium rates, higher loan limits."
    elif prob < 0.15:
        tier, policy = "LOW", "Standard approval, normal limits."
    elif prob < 0.25:
        tier, policy = "MODERATE", "Standard terms. Consider collateral."
    elif prob < 0.40:
        tier, policy = "ELEVATED", "Reduced limit or higher rate. Require docs."
    else:
        tier, policy = "HIGH", "Decline or require collateral + co-signer."

    return {
        "risk_probability": round(prob, 4),
        "risk_percentage": round(prob * 100, 2),
        "decision": decision,
        "risk_tier": tier,
        "policy": policy,
    }


# ── FastAPI app ───────────────────────────────────────────────────────────────

app = FastAPI(title="Credit Default Risk API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class Applicant(BaseModel):
    """Input fields — all optional except the core financial ones."""
    AMT_INCOME_TOTAL: float
    AMT_CREDIT: float
    AMT_ANNUITY: float
    AMT_GOODS_PRICE: Optional[float] = None
    DAYS_BIRTH: Optional[float] = None
    DAYS_EMPLOYED: Optional[float] = None
    AGE_YEARS: Optional[float] = None
    YEARS_EMPLOYED: Optional[float] = None
    EXT_SOURCE_1: Optional[float] = None
    EXT_SOURCE_2: Optional[float] = None
    EXT_SOURCE_3: Optional[float] = None
    CODE_GENDER: Optional[str] = None
    CNT_CHILDREN: Optional[int] = None
    CNT_FAM_MEMBERS: Optional[int] = None
    OCCUPATION_TYPE: Optional[str] = None
    NAME_EDUCATION_TYPE: Optional[str] = None
    NAME_INCOME_TYPE: Optional[str] = None
    ORGANIZATION_TYPE: Optional[str] = None
    REGION_RATING_CLIENT: Optional[int] = None


class BatchRequest(BaseModel):
    applicants: list[dict]
    threshold: float = 0.5


@app.get("/health")
def health():
    return {"status": "ok", "model": "xgboost", "features": len(feat_cols)}


@app.post("/predict")
def predict(applicant: Applicant, threshold: float = 0.5):
    try:
        data = applicant.model_dump(exclude_none=True)
        # Convert AGE_YEARS/YEARS_EMPLOYED to DAYS_BIRTH/DAYS_EMPLOYED if needed
        if "AGE_YEARS" in data and "DAYS_BIRTH" not in data:
            data["DAYS_BIRTH"] = -data["AGE_YEARS"] * 365.25
        if "YEARS_EMPLOYED" in data and "DAYS_EMPLOYED" not in data:
            data["DAYS_EMPLOYED"] = -data["YEARS_EMPLOYED"] * 365.25
        return predict_single(data, threshold)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict/batch")
def predict_batch(req: BatchRequest):
    try:
        results = []
        for applicant in req.applicants:
            # Convert AGE_YEARS/YEARS_EMPLOYED to DAYS format
            if "AGE_YEARS" in applicant and "DAYS_BIRTH" not in applicant:
                applicant["DAYS_BIRTH"] = -applicant["AGE_YEARS"] * 365.25
            if "YEARS_EMPLOYED" in applicant and "DAYS_EMPLOYED" not in applicant:
                applicant["DAYS_EMPLOYED"] = -applicant["YEARS_EMPLOYED"] * 365.25
            result = predict_single(applicant, req.threshold)
            result["id"] = applicant.get("ID") or applicant.get("id")
            results.append(result)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
