"""
Locust load test for the Credit Default Risk Prediction API.

Usage:
    pip install locust
    locust -f locustfile.py --host http://localhost:8000
"""

import random
from locust import HttpUser, task, between


class PredictionUser(HttpUser):
    wait_time = between(0.5, 2.0)

    def on_start(self):
        """Health-check once before any workload."""
        self.client.get("/health", name="health")

    @task(3)
    def predict_single(self):
        payload = {
            "AMT_INCOME_TOTAL": round(random.uniform(30000, 200000), 2),
            "AMT_CREDIT": round(random.uniform(50000, 500000), 2),
            "AMT_ANNUITY": round(random.uniform(500, 5000), 2),
            "AMT_GOODS_PRICE": round(random.uniform(40000, 450000), 2),
            "DAYS_BIRTH": -round(random.uniform(7000, 20000)),
            "DAYS_EMPLOYED": -round(random.uniform(0, 12000)),
            "CODE_GENDER": random.choice(["M", "F"]),
            "CNT_CHILDREN": random.randint(0, 5),
            "CNT_FAM_MEMBERS": random.randint(1, 6),
            "EXT_SOURCE_1": round(random.uniform(0.1, 0.9), 4),
            "EXT_SOURCE_2": round(random.uniform(0.1, 0.9), 4),
            "EXT_SOURCE_3": round(random.uniform(0.1, 0.9), 4),
        }
        with self.client.post("/predict", json=payload, name="predict_single", catch_response=True) as resp:
            if resp.status_code != 200:
                resp.failure(f"Status {resp.status_code}")

    @task(1)
    def predict_batch(self):
        applicants = []
        for _ in range(random.randint(2, 10)):
            applicants.append({
                "AMT_INCOME_TOTAL": round(random.uniform(30000, 200000), 2),
                "AMT_CREDIT": round(random.uniform(50000, 500000), 2),
                "AMT_ANNUITY": round(random.uniform(500, 5000), 2),
            })
        with self.client.post("/predict/batch", json={"applicants": applicants}, name="predict_batch", catch_response=True) as resp:
            if resp.status_code != 200:
                resp.failure(f"Status {resp.status_code}")

    @task(1)
    def health_check(self):
        self.client.get("/health", name="health")
