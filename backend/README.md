# ProofPay AI Backend

FastAPI backend for the ProofPay AI project.

## Setup

```powershell
python -m venv .venv
.\\.venv\\Scripts\\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

## Health Check

```text
GET /health
```
