import sys
sys.path.insert(0, "python-api")

from unittest.mock import MagicMock, patch
import numpy as np
import pytest

MOCK_FEATURE_COLS = [
    "AMT_INCOME_TOTAL", "AMT_CREDIT", "AMT_ANNUITY", "AMT_GOODS_PRICE",
    "DAYS_BIRTH", "DAYS_EMPLOYED", "AGE_YEARS", "YEARS_EMPLOYED",
    "EXT_SOURCE_1", "EXT_SOURCE_2", "EXT_SOURCE_3",
    "CODE_GENDER", "CNT_CHILDREN", "CNT_FAM_MEMBERS",
    "OCCUPATION_TYPE", "NAME_EDUCATION_TYPE",
    "CREDIT_TO_INCOME", "ANNUITY_TO_INCOME", "CREDIT_TO_GOODS",
    "GOODS_CREDIT_DIFF", "ANNUITY_TO_CREDIT", "CREDIT_TERM",
    "PAYMENT_RATE", "INCOME_PER_PERSON", "CHILDREN_RATIO",
    "OCCUPATION_GROUP", "EXT_MEAN", "EXT_MIN", "EXT_MAX", "EXT_STD",
    "EXT_PROD", "EXT_WEIGHTED", "EXT2_x_INCOME", "EXT2_x_CREDIT",
    "EXT2_x_AGE", "IS_YOUNG", "IS_UNEMPLOYED", "AGE_BUCKET",
    "EMPLOYMENT_TO_AGE", "DAYS_EMPLOYED_PERC",
    "BUREAU_LOAN_COUNT", "BUREAU_ACTIVE_LOANS", "BUREAU_CLOSED_LOANS",
    "BUREAU_AMT_CREDIT_SUM", "BUREAU_AMT_ANNUITY_SUM", "BUREAU_MAX_OVERDUE",
    "BUREAU_DAYS_CREDIT_MAX", "BUREAU_ACTIVE_RATIO", "TOTAL_ANNUITY", "DTI",
    "TOTAL_CREDIT_REQS", "TOTAL_DOCS",
]


def _make_mock_model():
    model = MagicMock()
    def predict_proba(X):
        n = X.shape[0]
        return np.column_stack([np.ones(n) * 0.7, np.ones(n) * 0.3])
    model.predict_proba = predict_proba
    model.get_booster = MagicMock(return_value=MagicMock())
    model.feature_names = MOCK_FEATURE_COLS
    return model


def _make_mock_imputer():
    imputer = MagicMock()
    def transform(X):
        return X.fillna(0).values
    imputer.transform = transform
    return imputer


_mock_model = _make_mock_model()
_mock_imputer = _make_mock_imputer()
_mock_te_maps = {"OCCUPATION_TYPE": {"Laborers": 0.12, "Core staff": 0.08}}

_jl_patcher = patch("joblib.load", side_effect=lambda path: {
    "xgb_model" in str(path): _mock_model,
    "imputer" in str(path): _mock_imputer,
    "te_maps" in str(path): _mock_te_maps,
}.get(True, MagicMock()))
_jl_patcher.start()

import builtins
_orig_open = builtins.open

def _patched_open(filename, *args, **kwargs):
    str_fname = str(filename)
    if "feature_columns" in str_fname:
        import json, io
        return io.StringIO(json.dumps(MOCK_FEATURE_COLS))
    if "thresholds" in str_fname:
        import json, io
        return io.StringIO(json.dumps({"XGBoost": 0.662}))
    return _orig_open(filename, *args, **kwargs)

_open_patcher = patch("builtins.open", _patched_open)
_open_patcher.start()

# Patch shap.TreeExplainer to return a mock so SHAP tests work
from unittest.mock import MagicMock as _Mock
_shap_patcher = patch("shap.TreeExplainer", return_value=_Mock())
_shap_patcher.start()


@pytest.fixture
def valid_applicant():
    return {
        "AMT_INCOME_TOTAL": 75000.0,
        "AMT_CREDIT": 250000.0,
        "AMT_ANNUITY": 1800.0,
        "AMT_GOODS_PRICE": 220000.0,
        "DAYS_BIRTH": -12784.0,
        "DAYS_EMPLOYED": -3650.0,
        "EXT_SOURCE_1": 0.5,
        "EXT_SOURCE_2": 0.4,
        "EXT_SOURCE_3": 0.6,
        "CODE_GENDER": "M",
        "CNT_CHILDREN": 2,
        "CNT_FAM_MEMBERS": 4,
        "OCCUPATION_TYPE": "Core staff",
        "NAME_EDUCATION_TYPE": "Higher education",
    }
