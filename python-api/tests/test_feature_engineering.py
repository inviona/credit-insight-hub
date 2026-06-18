import sys
sys.path.insert(0, "python-api")

import numpy as np
import pandas as pd
import pytest
from app import feature_engineering_single, occupation_group


class TestOccupationGroup:
    def test_returns_na_for_nan(self):
        assert occupation_group(np.nan) == "N/A"

    def test_low_skill_mapping(self):
        for job in ["Laborers", "Drivers", "Cleaning staff", "Cooking staff",
                     "Waiters/barmen staff", "Security staff", "Low-skill Laborers"]:
            assert occupation_group(job) == "Low-Skill & Manual", f"Failed for {job}"

    def test_mid_skill_mapping(self):
        for job in ["Core staff", "Sales staff", "Private service staff",
                     "Secretaries", "HR staff", "Realty agents"]:
            assert occupation_group(job) == "Mid-Skill & Office Support", f"Failed for {job}"

    def test_high_skill_mapping(self):
        for job in ["Accountants", "Managers", "Medicine staff",
                     "High skill tech staff", "IT staff"]:
            assert occupation_group(job) == "High-Skill & Professional", f"Failed for {job}"

    def test_unknown_job_returns_na(self):
        assert occupation_group("Unknown Job") == "N/A"


class TestFeatureEngineeringSingle:
    def test_basic_financial_ratios(self):
        result = feature_engineering_single({
            "AMT_INCOME_TOTAL": 100000,
            "AMT_CREDIT": 200000,
            "AMT_ANNUITY": 12000,
            "AMT_GOODS_PRICE": 180000,
        })
        assert "CREDIT_TO_INCOME" in result.columns
        assert abs(result["CREDIT_TO_INCOME"].iloc[0] - 2.0) < 0.01
        assert "ANNUITY_TO_INCOME" in result.columns
        assert abs(result["ANNUITY_TO_INCOME"].iloc[0] - 0.12) < 0.01
        assert "CREDIT_TO_GOODS" in result.columns

    def test_days_employed_sentinel_replaced(self):
        result = feature_engineering_single({"DAYS_EMPLOYED": 365243})
        assert pd.isna(result["DAYS_EMPLOYED"].iloc[0])

    def test_days_employed_normal_unchanged(self):
        result = feature_engineering_single({"DAYS_EMPLOYED": -5000})
        assert result["DAYS_EMPLOYED"].iloc[0] == -5000

    def test_code_gender_xna_replaced(self):
        result = feature_engineering_single({"CODE_GENDER": "XNA"})
        assert pd.isna(result["CODE_GENDER"].iloc[0])

    def test_code_gender_valid_unchanged(self):
        result = feature_engineering_single({"CODE_GENDER": "M"})
        assert result["CODE_GENDER"].iloc[0] == "M"

    def test_age_years_computed(self):
        result = feature_engineering_single({"DAYS_BIRTH": -12784})
        expected_age = 12784 / 365.25
        assert abs(result["AGE_YEARS"].iloc[0] - expected_age) < 0.1
        assert "IS_YOUNG" in result.columns

    def test_age_bucket_young(self):
        result = feature_engineering_single({"DAYS_BIRTH": -8000})
        assert result["AGE_YEARS"].iloc[0] < 30
        assert result["IS_YOUNG"].iloc[0] == 1

    def test_employment_features(self):
        result = feature_engineering_single({
            "DAYS_EMPLOYED": -3650,
            "DAYS_BIRTH": -12784,
        })
        assert "YEARS_EMPLOYED" in result.columns
        assert abs(result["YEARS_EMPLOYED"].iloc[0] - 10.0) < 0.1
        assert result["IS_UNEMPLOYED"].iloc[0] == 0
        assert "EMPLOYMENT_TO_AGE" in result.columns

    def test_is_unemployed_flag(self):
        result = feature_engineering_single({"DAYS_EMPLOYED": 365243})
        assert result["IS_UNEMPLOYED"].iloc[0] == 1

    def test_ext_source_composites(self):
        result = feature_engineering_single({
            "EXT_SOURCE_1": 0.5,
            "EXT_SOURCE_2": 0.3,
            "EXT_SOURCE_3": 0.7,
        })
        assert abs(result["EXT_MEAN"].iloc[0] - 0.5) < 0.01
        assert abs(result["EXT_MIN"].iloc[0] - 0.3) < 0.01
        assert abs(result["EXT_MAX"].iloc[0] - 0.7) < 0.01
        assert abs(result["EXT_PROD"].iloc[0] - 0.105) < 0.01

    def test_ext_weighted(self):
        result = feature_engineering_single({
            "EXT_SOURCE_1": 0.5,
            "EXT_SOURCE_2": 0.3,
            "EXT_SOURCE_3": 0.7,
        })
        weighted = (0.5 * 1 + 0.3 * 3 + 0.7 * 2) / 6
        assert abs(result["EXT_WEIGHTED"].iloc[0] - weighted) < 0.01

    def test_ext_interaction_terms(self):
        result = feature_engineering_single({
            "EXT_SOURCE_2": 0.5,
            "AMT_INCOME_TOTAL": 100000,
            "AMT_CREDIT": 200000,
            "DAYS_BIRTH": -12784,
        })
        assert abs(result["EXT2_x_INCOME"].iloc[0] - 0.5 * 100000 / 1e5) < 0.01
        assert abs(result["EXT2_x_CREDIT"].iloc[0] - 0.5 * 200000 / 1e5) < 0.01
        assert "EXT2_x_AGE" in result.columns

    def test_bureau_stubs_always_present(self):
        result = feature_engineering_single({"AMT_INCOME_TOTAL": 50000})
        for col in ["BUREAU_LOAN_COUNT", "BUREAU_ACTIVE_LOANS", "BUREAU_CLOSED_LOANS",
                     "BUREAU_AMT_CREDIT_SUM", "BUREAU_AMT_ANNUITY_SUM", "BUREAU_MAX_OVERDUE",
                     "BUREAU_DAYS_CREDIT_MAX", "BUREAU_ACTIVE_RATIO", "TOTAL_ANNUITY", "DTI"]:
            assert col in result.columns, f"Missing bureau stub: {col}"
            assert pd.isna(result[col].iloc[0])

    def test_income_per_person(self):
        result = feature_engineering_single({
            "AMT_INCOME_TOTAL": 80000,
            "CNT_FAM_MEMBERS": 4,
        })
        assert abs(result["INCOME_PER_PERSON"].iloc[0] - 20000) < 0.01

    def test_children_ratio(self):
        result = feature_engineering_single({
            "CNT_CHILDREN": 2,
            "CNT_FAM_MEMBERS": 4,
        })
        assert abs(result["CHILDREN_RATIO"].iloc[0] - 0.4) < 0.01

    def test_occupation_group_in_output(self):
        result = feature_engineering_single({"OCCUPATION_TYPE": "Managers"})
        assert result["OCCUPATION_GROUP"].iloc[0] == "High-Skill & Professional"

    def test_credit_bureau_req_aggregation(self):
        result = feature_engineering_single({
            "AMT_REQ_CREDIT_BUREAU_Q1": 2,
            "AMT_REQ_CREDIT_BUREAU_Q2": 1,
            "AMT_REQ_CREDIT_BUREAU_Q3": 0,
            "AMT_REQ_CREDIT_BUREAU_Q4": 3,
        })
        assert result["TOTAL_CREDIT_REQS"].iloc[0] == 6

    def test_document_count(self):
        result = feature_engineering_single({
            "FLAG_DOCUMENT_2": 1,
            "FLAG_DOCUMENT_3": 0,
            "FLAG_DOCUMENT_5": 1,
        })
        assert result["TOTAL_DOCS"].iloc[0] == 2

    def test_edge_case_zero_income(self):
        result = feature_engineering_single({
            "AMT_INCOME_TOTAL": 0,
            "AMT_CREDIT": 100000,
            "AMT_ANNUITY": 5000,
        })
        assert np.isfinite(result["CREDIT_TO_INCOME"].iloc[0])
        assert np.isfinite(result["ANNUITY_TO_INCOME"].iloc[0])

    def test_edge_case_negative_values(self):
        result = feature_engineering_single({
            "AMT_INCOME_TOTAL": -1000,
            "AMT_CREDIT": 50000,
            "AMT_ANNUITY": 2000,
        })
        assert not result.empty
