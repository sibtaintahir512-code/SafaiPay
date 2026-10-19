# SafaiPay AI/ML Microservice

Autonomous microservice for:
1. **Waste Image Classification:** Identifying PET Plastic bottles and Corrugated Cardboard from smartphone camera captures.
2. **Roman Urdu & English NLP Request Parsing:** Extracting waste types, weight estimates, and temporal pickup intents from unstructured mixed-language text.

## Core Rule
**AI predictions are strictly advisory estimates.** Final verification is performed on-site by verified waste collectors with calibrated digital scales.

## Running Locally
```bash
cd ml-service
pip install -r requirements.txt
uvicorn app.main:app --port 8001 --reload
```
API Documentation available at: [http://localhost:8001/docs](http://localhost:8001/docs)
