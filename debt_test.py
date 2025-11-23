#!/usr/bin/env python3
import requests
import json
from datetime import datetime, timedelta
import uuid

BASE_URL = "https://agent-on-go.preview.emergentagent.com/api"

# Create unique user
unique_email = f"test_{uuid.uuid4().hex[:8]}@test.com"
user_data = {
    "name": "Test User",
    "email": unique_email,
    "password": "test123"
}

print(f"Registering user: {unique_email}")
response = requests.post(f"{BASE_URL}/auth/register", json=user_data)
if response.status_code != 200:
    print(f"Registration failed: {response.text}")
    exit(1)

token = response.json()["token"]
print("✅ User registered successfully")

# Create debt
debt_data = {
    "valor": 1000.0,
    "credor": "Test Creditor",
    "vencimento": (datetime.now() + timedelta(days=30)).isoformat(),
    "cultura": "Soja",
    "status": "pendente"
}

headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
response = requests.post(f"{BASE_URL}/debts", json=debt_data, headers=headers)
if response.status_code != 200:
    print(f"Debt creation failed: {response.text}")
    exit(1)

debt_id = response.json()["id"]
print(f"✅ Debt created with ID: {debt_id}")

# Update debt status
print("Testing debt status update...")
response = requests.patch(f"{BASE_URL}/debts/{debt_id}/status?status=pago", headers=headers)
print(f"Status code: {response.status_code}")
print(f"Response: {response.text}")

if response.status_code == 200:
    print("✅ Debt status update successful")
else:
    print("❌ Debt status update failed")