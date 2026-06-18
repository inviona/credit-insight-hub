import sys
sys.path.insert(0, "python-api")

import pytest
from app import predict_single


EXPECTED_TIERS = [
    (0.01, "VERY LOW"),
    (0.04, "VERY LOW"),
    (0.0499, "VERY LOW"),
    (0.05, "LOW"),
    (0.10, "LOW"),
    (0.1499, "LOW"),
    (0.15, "MODERATE"),
    (0.20, "MODERATE"),
    (0.2499, "MODERATE"),
    (0.25, "ELEVATED"),
    (0.30, "ELEVATED"),
    (0.3999, "ELEVATED"),
    (0.40, "HIGH"),
    (0.50, "HIGH"),
    (0.99, "HIGH"),
]


class TestRiskTierMapping:
    @pytest.mark.parametrize("prob,expected_tier", EXPECTED_TIERS)
    def test_tier_mapping(self, prob, expected_tier):
        """Extracts tier from predict_single with a patched model to verify mapping."""
        from unittest.mock import patch, MagicMock
        import numpy as np
        import app as app_module

        original_predict = app_module.xgb_model.predict_proba

        def mock_predict_proba(X):
            n = X.shape[0]
            return np.column_stack([np.ones(n) * (1 - prob), np.ones(n) * prob])

        app_module.xgb_model.predict_proba = mock_predict_proba
        try:
            result = predict_single({
                "AMT_INCOME_TOTAL": 75000,
                "AMT_CREDIT": 200000,
                "AMT_ANNUITY": 1500,
            }, threshold=0.3, include_shap=False)
            assert result["risk_tier"] == expected_tier, f"prob={prob}: got {result['risk_tier']}, expected {expected_tier}"
        finally:
            app_module.xgb_model.predict_proba = original_predict


class TestThresholdDecision:
    @pytest.mark.parametrize("threshold,prob,expected_decision", [
        (0.3, 0.662, "DEFAULT"),
        (0.3, 0.50, "DEFAULT"),
        (0.3, 0.30, "DEFAULT"),
        (0.3, 0.29, "NO DEFAULT"),
        (0.5, 0.49, "NO DEFAULT"),
        (0.5, 0.50, "DEFAULT"),
        (0.0, 0.0, "DEFAULT"),
        (1.0, 0.99, "NO DEFAULT"),
    ])
    def test_decision_boundaries(self, threshold, prob, expected_decision):
        import numpy as np
        import app as app_module

        original_predict = app_module.xgb_model.predict_proba

        def mock_predict_proba(X):
            n = X.shape[0]
            return np.column_stack([np.ones(n) * (1 - prob), np.ones(n) * prob])

        app_module.xgb_model.predict_proba = mock_predict_proba
        try:
            result = predict_single({
                "AMT_INCOME_TOTAL": 75000,
                "AMT_CREDIT": 200000,
                "AMT_ANNUITY": 1500,
            }, threshold=threshold, include_shap=False)
            assert result["decision"] == expected_decision
        finally:
            app_module.xgb_model.predict_proba = original_predict


def test_shap_included_when_explainer_available():
    import numpy as np
    import app as app_module

    original_predict = app_module.xgb_model.predict_proba

    def mock_predict_proba(X):
        n = X.shape[0]
        return np.column_stack([np.ones(n) * 0.7, np.ones(n) * 0.3])

    app_module.xgb_model.predict_proba = mock_predict_proba
    try:
        result = predict_single({
            "AMT_INCOME_TOTAL": 75000,
            "AMT_CREDIT": 200000,
            "AMT_ANNUITY": 1500,
        }, include_shap=True)
        assert "shap_values" in result
        assert "top_risk_factors" in result["shap_values"]
        assert "top_protect_factors" in result["shap_values"]
    finally:
        app_module.xgb_model.predict_proba = original_predict
