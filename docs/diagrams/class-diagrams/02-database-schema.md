```mermaid
%% Class Diagram: Database Schema
%% Shows the main PostgreSQL tables and their relationships

classDiagram
    class loan_applications {
        +UUID id PK
        +UUID user_id FK
        +string customer_id
        +string full_name
        +string email
        +string phone
        +string city
        +string employment_status
        +number annual_income
        +number monthly_expenses
        +number existing_debt
        +number loan_amount
        +string loan_purpose
        +number loan_term
        +number loan_int_rate
        +string loan_grade
        +number credit_score
        +number num_credit_lines
        +number num_delinquencies
        +boolean bankruptcy_history
        +string cb_person_default_on_file
        +string person_home_ownership
        +enum status
        +timestamp created_at
        +timestamp updated_at
    }

    class profiles {
        +UUID id PK
        +UUID user_id FK
        +string username
        +string display_name
        +string avatar_url
        +timestamp created_at
        +timestamp updated_at
    }

    class auth_users {
        +UUID id PK
        +string email
        +string encrypted_password
        +timestamp created_at
    }

    auth_users ||--o{ loan_applications : "has many"
    auth_users ||--|| profiles : "has one"
    loan_applications --> "user_id" auth_users : "references"
    profiles --> "user_id" auth_users : "references"
```
