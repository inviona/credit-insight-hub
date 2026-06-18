import sys
sys.path.insert(0, "python-api")

import pytest
from app import predict_single


class TestPredictSingle:
    def test_returns_all_keys(self):
        result = predict_single({
            "AMT_INCOME_TOTAL": 75000,
            "AMT_CREDIT": 200000,
            "AMT_ANNUITY": 1500,
        }, include_shap=False)
        assert "risk_probability" in result
        assert "risk_percentage" in result
        assert "decision" in result
        assert "risk_tier" in result
        assert "policy" in result

    def test_risk_percentage_match(self):
        result = predict_single({
            "AMT_INCOME_TOTAL": 75000,
            "AMT_CREDIT": 200000,
            "AMT_ANNUITY": 1500,
        }, include_shap=False)
        assert abs(result["risk_percentage"] - result["risk_probability"] * 100) < 0.01

    def test_excludes_shap_when_not_requested(self):
        result = predict_single({
            "AMT_INCOME_TOTAL": 75000,
            "AMT_CREDIT": 200000,
            "AMT_ANNUITY": 1500,
        }, include_shap=False)
        assert "shap_values" not in result

    def test_with_all_optional_fields(self):
        result = predict_single({
            "AMT_INCOME_TOTAL": 120000,
            "AMT_CREDIT": 300000,
            "AMT_ANNUITY": 2200,
            "AMT_GOODS_PRICE": 280000,
            "DAYS_BIRTH": -15000,
            "DAYS_EMPLOYED": -8000,
            "EXT_SOURCE_1": 0.7,
            "EXT_SOURCE_2": 0.6,
            "EXT_SOURCE_3": 0.8,
            "CODE_GENDER": "F",
            "CNT_CHILDREN": 1,
            "CNT_FAM_MEMBERS": 3,
            "OCCUPATION_TYPE": "Managers",
            "NAME_EDUCATION_TYPE": "Higher education",
            "NAME_INCOME_TYPE": "Working",
            "ORGANIZATION_TYPE": "Business",
        }, include_shap=False)
        assert 0 <= result["risk_probability"] <= 1
        assert result["decision"] in ("DEFAULT", "NO DEFAULT")

    def test_threshold_override_affects_decision(self):
        result_low = predict_single({
            "AMT_INCOME_TOTAL": 75000,
            "AMT_CREDIT": 200000,
            "AMT_ANNUITY": 1500,
        }, threshold=0.0, include_shap=False)
        assert result_low["decision"] == "DEFAULT"

        result_high = predict_single({
            "AMT_INCOME_TOTAL": 75000,
            "AMT_CREDIT": 200000,
            "AMT_ANNUITY": 1500,
        }, threshold=1.0, include_shap=False)
        assert result_high["decision"] == "NO DEFAULT"

    def test_missing_fields_still_produces_result(self):
        result = predict_single({
            "AMT_INCOME_TOTAL": 50000,
            "AMT_CREDIT": 100000,
        }, include_shap=False)
        assert "risk_probability" in result

    def test_output_types(self):
        result = predict_single({
            "AMT_INCOME_TOTAL": 75000,
            "AMT_CREDIT": 200000,
            "AMT_ANNUITY": 1500,
        }, include_shap=False)
        assert isinstance(result["risk_probability"], float)
        assert isinstance(result["risk_percentage"], float)
        assert isinstance(result["decision"], str)
        assert isinstance(result["risk_tier"], str)
        assert isinstance(result["policy"], str)
