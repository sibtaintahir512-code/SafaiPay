# SafaiPay REST API Documentation

## 1. Overview
The SafaiPay API is a high-performance RESTful API built on FastAPI. It adheres strictly to OpenAPI 3.1 standards with OAuth2 password and JWT bearer token authorization.

- **Base URL (Local):** `http://localhost:8000/api/v1`
- **Base URL (Production):** `https://api.safaipay.org/api/v1`
- **Interactive Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

## 2. Authentication Endpoints

### 2.1 Login
`POST /api/v1/auth/login`
- **Request:**
  ```json
  {
    "username": "+923001110001",
    "password": "SafaiPassword123!"
  }
  ```
- **Response:**
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "Bearer",
    "expires_in": 86400,
    "user": {
      "id": "usr-cust-001",
      "phone_number": "+923001110001",
      "full_name": "Household Partner",
      "role": "customer",
      "roles": ["customer"]
    }
  }
  ```

### 2.2 Get Current User Profile
`GET /api/v1/auth/me`
- **Headers:** `Authorization: Bearer <token>`
- **Response:** Current authenticated user object with role array.

## 3. Pickup Requests

### 3.1 Create Pickup (Customer)
`POST /api/v1/pickups`
- **Payload:**
  ```json
  {
    "material_code": "PET_PLASTIC",
    "estimated_quantity_kg": 15.0,
    "street_address": "Falcon Complex, PECHS Block 6",
    "city": "Karachi",
    "preferred_time": "Today 2:00 PM - 5:00 PM"
  }
  ```

### 3.2 List Pickups
- `GET /api/v1/pickups/my-requests`: Customer's booked pickups
- `GET /api/v1/pickups/available`: Unassigned pickups in collector radius
- `GET /api/v1/admin/pickups`: All pickups for admin oversight

### 3.3 Collector Job Acceptance & Verification
- `POST /api/v1/pickups/{id}/assign`: Assigns collector to pickup
- `POST /api/v1/pickups/{id}/accept`: Collector confirms acceptance
- `POST /api/v1/pickups/{id}/verify-weight`: Logs IoT scale reading, photo hash, and customer confirmation OTP

## 4. Benchmark Rates & Pricing
- `GET /api/v1/materials`: Active material rates and quality multipliers (Tier A/B/C)
- `POST /api/v1/pricing/calculate`: Calculates verified payout in PKR

## 5. System Health
- `GET /api/v1/health`: Returns system status `{"status": "healthy", "service": "SafaiPay Backend", "version": "1.0.0"}`
