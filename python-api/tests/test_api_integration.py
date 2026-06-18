import sys
sys.path.insert(0, "python-api")

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    from app import app as fastapi_app
    with TestClient(fastapi_app) as c:
        yield c


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


class TestHealthEndpoint:
    def test_health_returns_ok(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert data["model"] == "xgboost"
        assert isinstance(data["features"], int)
        assert isinstance(data["threshold"], float)

    def test_health_has_required_fields(self, client):
        resp = client.get("/health")
        data = resp.json()
        assert set(data.keys()) == {"status", "model", "features", "threshold"}


class TestPredictEndpoint:
    def test_valid_prediction(self, client, valid_applicant):
        resp = client.post("/predict", json=valid_applicant)
        assert resp.status_code == 200
        data = resp.json()
        assert "risk_probability" in data
        assert "risk_percentage" in data
        assert "decision" in data
        assert "risk_tier" in data
        assert "policy" in data

    def test_prediction_with_includeshap(self, client, valid_applicant):
        resp = client.post("/predict", json=valid_applicant, params={"include_shap": True})
        assert resp.status_code == 200
        data = resp.json()
        assert "shap_values" in data

    def test_prediction_without_shap(self, client, valid_applicant):
        resp = client.post("/predict", json=valid_applicant, params={"include_shap": False})
        assert resp.status_code == 200
        data = resp.json()
        assert "shap_values" not in data

    def test_threshold_override(self, client, valid_applicant):
        resp = client.post("/predict", json=valid_applicant, params={"threshold": 0.0})
        assert resp.status_code == 200
        assert resp.json()["decision"] == "DEFAULT"

        resp = client.post("/predict", json=valid_applicant, params={"threshold": 1.0})
        assert resp.status_code == 200
        assert resp.json()["decision"] == "NO DEFAULT"

    def test_missing_required_field_returns_422(self, client):
        payload = {"AMT_CREDIT": 200000}
        resp = client.post("/predict", json=payload)
        assert resp.status_code == 422

    def test_empty_body_returns_422(self, client):
        resp = client.post("/predict", json={})
        assert resp.status_code == 422

    def test_invalid_type_returns_422(self, client):
        resp = client.post("/predict", json={
            "AMT_INCOME_TOTAL": "not-a-number",
            "AMT_CREDIT": 200000,
            "AMT_ANNUITY": 1500,
        })
        assert resp.status_code == 422

    def test_negative_required_fields_are_accepted(self, client):
        resp = client.post("/predict", json={
            "AMT_INCOME_TOTAL": -1000,
            "AMT_CREDIT": 50000,
            "AMT_ANNUITY": 2000,
        })
        assert resp.status_code == 200

    def test_adversarial_large_numbers(self, client):
        resp = client.post("/predict", json={
            "AMT_INCOME_TOTAL": 1e12,
            "AMT_CREDIT": 1e12,
            "AMT_ANNUITY": 1e12,
        })
        assert resp.status_code == 200
        assert "risk_probability" in resp.json()


class TestBatchEndpoint:
    def test_valid_batch(self, client, valid_applicant):
        payload = {"applicants": [valid_applicant, valid_applicant]}
        resp = client.post("/predict/batch", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2
        for item in data:
            assert "risk_probability" in item
            assert "decision" in item

    def test_batch_with_ids(self, client, valid_applicant):
        a1 = {**valid_applicant, "ID": "CUST001"}
        a2 = {**valid_applicant, "ID": "CUST002"}
        resp = client.post("/predict/batch", json={"applicants": [a1, a2]})
        data = resp.json()
        assert data[0]["id"] == "CUST001"
        assert data[1]["id"] == "CUST002"

    def test_batch_threshold_override(self, client, valid_applicant):
        resp = client.post("/predict/batch", json={
            "applicants": [valid_applicant],
            "threshold": 0.0,
        })
        assert resp.status_code == 200
        assert resp.json()[0]["decision"] == "DEFAULT"

    def test_empty_batch_is_error(self, client):
        resp = client.post("/predict/batch", json={"applicants": []})
        assert resp.status_code == 200
        assert resp.json() == []

    def test_batch_rejects_non_dict_items(self, client):
        resp = client.post("/predict/batch", json={"applicants": ["not-a-dict"]})
        assert resp.status_code == 422

    def test_batch_missing_applicants_key(self, client):
        resp = client.post("/predict/batch", json={})
        assert resp.status_code == 422
