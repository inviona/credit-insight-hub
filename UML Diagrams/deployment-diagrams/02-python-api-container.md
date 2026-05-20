```mermaid
%% Deployment Diagram: Python API Container
%% Shows the Docker container structure and model artifacts

graph TB
    subgraph "Docker Container: credit-risk-api"
        direction TB
        API[FastAPI Server<br/>port 8080]
        
        subgraph "Model Artifacts"
            XGB[xgb_model.pkl<br/>XGBoost Classifier]
            IMP[imputer.pkl<br/>SimpleImputer]
            TEM[te_maps.pkl<br/>Target Encoding Maps]
            FC[feature_columns.json<br/>Feature List]
            TH[thresholds.json<br/>Optimal Threshold]
        end
        
        subgraph "Routes"
            H[/health GET]
            P[/predict POST]
            PB[/predict/batch POST]
        end
        
        API --> XGB
        API --> IMP
        API --> TEM
        API --> FC
        API --> TH
    end

    H --> API
    P --> API
    PB --> API
```
