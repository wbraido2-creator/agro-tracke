#!/usr/bin/env python3
"""
Comprehensive Backend Test Suite for Agro Track API
Tests all endpoints with realistic agricultural data
"""

import requests
import json
from datetime import datetime, timedelta
import sys
import os
import uuid

# Get backend URL from frontend .env
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('EXPO_PUBLIC_BACKEND_URL='):
                    return line.split('=')[1].strip()
    except:
        pass
    return "https://agent-on-go.preview.emergentagent.com"

BASE_URL = get_backend_url() + "/api"
print(f"Testing backend at: {BASE_URL}")

class AgroTrackTester:
    def __init__(self):
        self.session = requests.Session()
        self.user1_token = None
        self.user2_token = None
        self.user1_data = None
        self.user2_data = None
        self.test_results = []
        
    def log_test(self, test_name, success, message="", data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        self.test_results.append({
            "test": test_name,
            "success": success,
            "message": message,
            "data": data
        })
        
    def make_request(self, method, endpoint, data=None, token=None, expect_status=200):
        """Make HTTP request with proper error handling"""
        url = f"{BASE_URL}{endpoint}"
        headers = {"Content-Type": "application/json"}
        
        if token:
            headers["Authorization"] = f"Bearer {token}"
            
        try:
            if method == "GET":
                response = self.session.get(url, headers=headers)
            elif method == "POST":
                response = self.session.post(url, json=data, headers=headers)
            elif method == "DELETE":
                response = self.session.delete(url, headers=headers)
            elif method == "PATCH":
                if data:
                    response = self.session.patch(url, json=data, headers=headers)
                else:
                    response = self.session.patch(url, headers=headers)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            if response.status_code != expect_status:
                print(f"❌ Unexpected status {response.status_code} for {method} {endpoint}")
                print(f"Response: {response.text}")
                return None, response.status_code
                
            return response.json() if response.text else {}, response.status_code
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Request failed for {method} {endpoint}: {str(e)}")
            return None, 0
        except json.JSONDecodeError as e:
            print(f"❌ JSON decode error for {method} {endpoint}: {str(e)}")
            return None, response.status_code if 'response' in locals() else 0

    def test_auth_register(self):
        """Test user registration with 14-day trial"""
        print("\n=== Testing Authentication - Register ===")
        
        # Test User 1 - João Silva (Soja farmer)
        unique_id = uuid.uuid4().hex[:8]
        user1_data = {
            "name": "João Silva",
            "email": f"joao.silva.{unique_id}@fazenda.com",
            "password": "senha123",
            "phone": "+55 11 99999-1234"
        }
        
        response, status = self.make_request("POST", "/auth/register", user1_data)
        
        if response and "token" in response:
            self.user1_token = response["token"]
            self.user1_data = response["user"]
            
            # Verify trial period
            trial_end = datetime.fromisoformat(response["user"]["trial_end_date"].replace('Z', '+00:00'))
            days_diff = (trial_end - datetime.now().replace(tzinfo=trial_end.tzinfo)).days
            
            trial_ok = 13 <= days_diff <= 14  # Allow some margin for execution time
            
            self.log_test("User Registration", True, 
                         f"User {response['user']['name']} registered with {days_diff} days trial")
            self.log_test("Trial Period Setup", trial_ok, 
                         f"Trial period: {days_diff} days (expected ~14)")
        else:
            self.log_test("User Registration", False, "Failed to register user")
            
        # Test User 2 - Maria Santos (Milho farmer) 
        unique_id2 = uuid.uuid4().hex[:8]
        user2_data = {
            "name": "Maria Santos",
            "email": f"maria.santos.{unique_id2}@agro.com", 
            "password": "senha456"
        }
        
        response, status = self.make_request("POST", "/auth/register", user2_data)
        
        if response and "token" in response:
            self.user2_token = response["token"]
            self.user2_data = response["user"]
            self.log_test("Second User Registration", True, 
                         f"User {response['user']['name']} registered")
        else:
            self.log_test("Second User Registration", False, "Failed to register second user")
            
        # Test duplicate email
        response, status = self.make_request("POST", "/auth/register", user1_data, expect_status=400)
        self.log_test("Duplicate Email Prevention", status == 400, 
                     "Correctly rejected duplicate email")

    def test_auth_login(self):
        """Test user login"""
        print("\n=== Testing Authentication - Login ===")
        
        login_data = {
            "email": self.user1_data["email"] if self.user1_data else "joao.silva@fazenda.com",
            "password": "senha123"
        }
        
        response, status = self.make_request("POST", "/auth/login", login_data)
        
        if response and "token" in response:
            # Update token (should be same but good practice)
            self.user1_token = response["token"]
            self.log_test("User Login", True, f"Login successful for {response['user']['name']}")
        else:
            self.log_test("User Login", False, "Login failed")
            
        # Test invalid credentials
        invalid_login = {
            "email": self.user1_data["email"] if self.user1_data else "joao.silva@fazenda.com", 
            "password": "senhaerrada"
        }
        
        response, status = self.make_request("POST", "/auth/login", invalid_login, expect_status=401)
        self.log_test("Invalid Credentials", status == 401, "Correctly rejected invalid password")

    def test_auth_me(self):
        """Test get current user info"""
        print("\n=== Testing Authentication - Get Me ===")
        
        if not self.user1_token:
            self.log_test("Get User Info", False, "No token available")
            return
            
        response, status = self.make_request("GET", "/auth/me", token=self.user1_token)
        
        if response and "id" in response:
            self.log_test("Get User Info", True, f"Retrieved info for {response['name']}")
        else:
            self.log_test("Get User Info", False, "Failed to get user info")
            
        # Test invalid token
        response, status = self.make_request("GET", "/auth/me", token="invalid_token", expect_status=401)
        self.log_test("Invalid Token Rejection", status == 401, "Correctly rejected invalid token")

    def test_expenses_crud(self):
        """Test expenses CRUD operations"""
        print("\n=== Testing Expenses CRUD ===")
        
        if not self.user1_token:
            self.log_test("Expenses Test", False, "No authentication token")
            return
            
        # Create expense
        expense_data = {
            "valor": 2500.00,
            "categoria": "Fertilizantes",
            "cultura": "Soja",
            "tipo": "Insumos",
            "data": datetime.now().isoformat(),
            "descricao": "Fertilizante NPK para plantio de soja"
        }
        
        response, status = self.make_request("POST", "/expenses", expense_data, token=self.user1_token)
        
        expense_id = None
        if response and "id" in response:
            expense_id = response["id"]
            self.log_test("Create Expense", True, f"Created expense: R$ {response['valor']}")
        else:
            self.log_test("Create Expense", False, "Failed to create expense")
            
        # Get expenses
        response, status = self.make_request("GET", "/expenses", token=self.user1_token)
        
        if response and isinstance(response, list) and len(response) > 0:
            self.log_test("Get Expenses", True, f"Retrieved {len(response)} expenses")
        else:
            self.log_test("Get Expenses", False, "Failed to get expenses")
            
        # Delete expense
        if expense_id:
            response, status = self.make_request("DELETE", f"/expenses/{expense_id}", token=self.user1_token)
            self.log_test("Delete Expense", status == 200, "Expense deleted successfully")

    def test_revenues_crud(self):
        """Test revenues CRUD operations"""
        print("\n=== Testing Revenues CRUD ===")
        
        if not self.user1_token:
            self.log_test("Revenues Test", False, "No authentication token")
            return
            
        # Create revenue
        revenue_data = {
            "valor": 15000.00,
            "cultura": "Soja",
            "tipo": "Venda",
            "data": datetime.now().isoformat(),
            "descricao": "Venda de 100 sacas de soja"
        }
        
        response, status = self.make_request("POST", "/revenues", revenue_data, token=self.user1_token)
        
        revenue_id = None
        if response and "id" in response:
            revenue_id = response["id"]
            self.log_test("Create Revenue", True, f"Created revenue: R$ {response['valor']}")
        else:
            self.log_test("Create Revenue", False, "Failed to create revenue")
            
        # Get revenues
        response, status = self.make_request("GET", "/revenues", token=self.user1_token)
        
        if response and isinstance(response, list) and len(response) > 0:
            self.log_test("Get Revenues", True, f"Retrieved {len(response)} revenues")
        else:
            self.log_test("Get Revenues", False, "Failed to get revenues")
            
        # Delete revenue
        if revenue_id:
            response, status = self.make_request("DELETE", f"/revenues/{revenue_id}", token=self.user1_token)
            self.log_test("Delete Revenue", status == 200, "Revenue deleted successfully")

    def test_debts_crud(self):
        """Test debts CRUD operations including status update"""
        print("\n=== Testing Debts CRUD ===")
        
        if not self.user1_token:
            self.log_test("Debts Test", False, "No authentication token")
            return
            
        # Create debt
        debt_data = {
            "valor": 8000.00,
            "credor": "Banco do Agricultor",
            "vencimento": (datetime.now() + timedelta(days=30)).isoformat(),
            "cultura": "Soja",
            "status": "pendente",
            "descricao": "Financiamento para compra de sementes"
        }
        
        response, status = self.make_request("POST", "/debts", debt_data, token=self.user1_token)
        
        debt_id = None
        if response and "id" in response:
            debt_id = response["id"]
            self.log_test("Create Debt", True, f"Created debt: R$ {response['valor']}")
        else:
            self.log_test("Create Debt", False, "Failed to create debt")
            
        # Get debts
        response, status = self.make_request("GET", "/debts", token=self.user1_token)
        
        if response and isinstance(response, list) and len(response) > 0:
            self.log_test("Get Debts", True, f"Retrieved {len(response)} debts")
        else:
            self.log_test("Get Debts", False, "Failed to get debts")
            
        # Update debt status
        if debt_id:
            response, status = self.make_request("PATCH", f"/debts/{debt_id}/status?status=pago", 
                                               token=self.user1_token)
            self.log_test("Update Debt Status", status == 200, "Debt status updated to 'pago'")
            
            # Delete debt
            response, status = self.make_request("DELETE", f"/debts/{debt_id}", token=self.user1_token)
            self.log_test("Delete Debt", status == 200, "Debt deleted successfully")

    def test_fields_crud(self):
        """Test fields (talhões) CRUD operations"""
        print("\n=== Testing Fields CRUD ===")
        
        if not self.user1_token:
            self.log_test("Fields Test", False, "No authentication token")
            return
            
        # Create field
        field_data = {
            "nome": "Talhão Norte",
            "area_ha": 25.5,
            "cultura": "Soja",
            "localizacao": "Fazenda Santa Rita - Setor Norte"
        }
        
        response, status = self.make_request("POST", "/fields", field_data, token=self.user1_token)
        
        field_id = None
        if response and "id" in response:
            field_id = response["id"]
            self.log_test("Create Field", True, f"Created field: {response['nome']} ({response['area_ha']} ha)")
        else:
            self.log_test("Create Field", False, "Failed to create field")
            
        # Get fields
        response, status = self.make_request("GET", "/fields", token=self.user1_token)
        
        if response and isinstance(response, list) and len(response) > 0:
            self.log_test("Get Fields", True, f"Retrieved {len(response)} fields")
        else:
            self.log_test("Get Fields", False, "Failed to get fields")
            
        # Return field_id for harvest testing
        return field_id

    def test_harvests_crud(self, field_id):
        """Test harvests CRUD operations with productivity calculation"""
        print("\n=== Testing Harvests CRUD ===")
        
        if not self.user1_token:
            self.log_test("Harvests Test", False, "No authentication token")
            return
            
        if not field_id:
            self.log_test("Harvests Test", False, "No field ID available")
            return
            
        # Create harvest
        harvest_data = {
            "field_id": field_id,
            "cultura": "Soja",
            "quantidade_sacas": 153.0,  # 153 sacas in 25.5 ha = 6 sacas/ha
            "data_colheita": datetime.now().isoformat(),
            "observacoes": "Colheita realizada em condições ideais"
        }
        
        response, status = self.make_request("POST", "/harvests", harvest_data, token=self.user1_token)
        
        harvest_id = None
        if response and "id" in response:
            harvest_id = response["id"]
            expected_productivity = 153.0 / 25.5  # Should be 6.0 sacas/ha
            actual_productivity = response.get("produtividade", 0)
            
            productivity_ok = abs(actual_productivity - expected_productivity) < 0.1
            
            self.log_test("Create Harvest", True, 
                         f"Created harvest: {response['quantidade_sacas']} sacas")
            self.log_test("Productivity Calculation", productivity_ok,
                         f"Productivity: {actual_productivity} sacas/ha (expected: {expected_productivity:.1f})")
        else:
            self.log_test("Create Harvest", False, "Failed to create harvest")
            
        # Get harvests
        response, status = self.make_request("GET", "/harvests", token=self.user1_token)
        
        if response and isinstance(response, list) and len(response) > 0:
            self.log_test("Get Harvests", True, f"Retrieved {len(response)} harvests")
        else:
            self.log_test("Get Harvests", False, "Failed to get harvests")
            
        # Delete harvest
        if harvest_id:
            response, status = self.make_request("DELETE", f"/harvests/{harvest_id}", token=self.user1_token)
            self.log_test("Delete Harvest", status == 200, "Harvest deleted successfully")
            
        # Delete field (cleanup)
        if field_id:
            response, status = self.make_request("DELETE", f"/fields/{field_id}", token=self.user1_token)
            self.log_test("Delete Field", status == 200, "Field deleted successfully")

    def test_dashboard_summary(self):
        """Test dashboard summary calculations"""
        print("\n=== Testing Dashboard Summary ===")
        
        if not self.user1_token:
            self.log_test("Dashboard Test", False, "No authentication token")
            return
            
        # Create test data for calculations
        test_revenue = {
            "valor": 10000.00,
            "cultura": "Soja",
            "tipo": "Venda",
            "data": datetime.now().isoformat()
        }
        
        test_expense = {
            "valor": 3000.00,
            "categoria": "Fertilizantes",
            "cultura": "Soja", 
            "tipo": "Insumos",
            "data": datetime.now().isoformat()
        }
        
        test_debt = {
            "valor": 5000.00,
            "credor": "Fornecedor",
            "vencimento": (datetime.now() + timedelta(days=30)).isoformat(),
            "cultura": "Soja",
            "status": "pendente"
        }
        
        # Create test data
        revenue_resp, _ = self.make_request("POST", "/revenues", test_revenue, token=self.user1_token)
        expense_resp, _ = self.make_request("POST", "/expenses", test_expense, token=self.user1_token)
        debt_resp, _ = self.make_request("POST", "/debts", test_debt, token=self.user1_token)
        
        # Get dashboard summary
        response, status = self.make_request("GET", "/dashboard/summary", token=self.user1_token)
        
        if response:
            expected_profit = 10000.00 - 3000.00  # 7000.00
            actual_profit = response.get("lucro", 0)
            
            profit_ok = abs(actual_profit - expected_profit) < 0.01
            
            self.log_test("Dashboard Summary", True, "Dashboard data retrieved")
            self.log_test("Profit Calculation", profit_ok,
                         f"Profit: R$ {actual_profit} (expected: R$ {expected_profit})")
            self.log_test("Revenue Grouping", "receitas_por_cultura" in response,
                         "Revenue grouped by culture")
            self.log_test("Expense Grouping", "despesas_por_cultura" in response,
                         "Expenses grouped by culture")
            
            # Cleanup test data
            if revenue_resp and "id" in revenue_resp:
                self.make_request("DELETE", f"/revenues/{revenue_resp['id']}", token=self.user1_token)
            if expense_resp and "id" in expense_resp:
                self.make_request("DELETE", f"/expenses/{expense_resp['id']}", token=self.user1_token)
            if debt_resp and "id" in debt_resp:
                self.make_request("DELETE", f"/debts/{debt_resp['id']}", token=self.user1_token)
        else:
            self.log_test("Dashboard Summary", False, "Failed to get dashboard summary")

    def test_quotations_b3(self):
        """Test B3 quotations (mock data)"""
        print("\n=== Testing B3 Quotations ===")
        
        response, status = self.make_request("GET", "/quotations/b3")
        
        if response and isinstance(response, list) and len(response) > 0:
            # Check if we have expected products
            products = [q.get("produto") for q in response]
            expected_products = ["Soja", "Milho", "Trigo", "Algodão", "Aveia"]
            
            has_expected = all(prod in products for prod in expected_products)
            
            self.log_test("B3 Quotations", True, f"Retrieved {len(response)} quotations")
            self.log_test("Expected Products", has_expected, 
                         f"Has all expected products: {', '.join(expected_products)}")
            
            # Check data structure
            first_quote = response[0]
            required_fields = ["produto", "preco", "variacao", "unidade", "data"]
            has_fields = all(field in first_quote for field in required_fields)
            
            self.log_test("Quotation Data Structure", has_fields,
                         "All required fields present")
        else:
            self.log_test("B3 Quotations", False, "Failed to get quotations")

    def test_authorization(self):
        """Test that users can only access their own data"""
        print("\n=== Testing Authorization ===")
        
        if not self.user1_token or not self.user2_token:
            self.log_test("Authorization Test", False, "Need both user tokens")
            return
            
        # User 1 creates an expense
        expense_data = {
            "valor": 1000.00,
            "categoria": "Teste",
            "cultura": "Soja",
            "tipo": "Teste",
            "data": datetime.now().isoformat()
        }
        
        response, status = self.make_request("POST", "/expenses", expense_data, token=self.user1_token)
        
        if not response or "id" not in response:
            self.log_test("Authorization Setup", False, "Failed to create test expense")
            return
            
        expense_id = response["id"]
        
        # User 2 tries to access User 1's expenses
        response, status = self.make_request("GET", "/expenses", token=self.user2_token)
        
        if response and isinstance(response, list):
            user2_can_see_user1_data = any(e.get("id") == expense_id for e in response)
            self.log_test("Data Isolation", not user2_can_see_user1_data,
                         "User 2 cannot see User 1's expenses")
        else:
            self.log_test("Data Isolation", False, "Failed to test data isolation")
            
        # User 2 tries to delete User 1's expense
        response, status = self.make_request("DELETE", f"/expenses/{expense_id}", 
                                           token=self.user2_token, expect_status=404)
        
        self.log_test("Delete Authorization", status == 404,
                     "User 2 cannot delete User 1's expense")
        
        # Cleanup
        self.make_request("DELETE", f"/expenses/{expense_id}", token=self.user1_token)

    def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting Agro Track Backend Tests")
        print(f"Backend URL: {BASE_URL}")
        print("=" * 60)
        
        try:
            # Authentication tests
            self.test_auth_register()
            self.test_auth_login()
            self.test_auth_me()
            
            # CRUD tests
            self.test_expenses_crud()
            self.test_revenues_crud()
            self.test_debts_crud()
            
            # Fields and harvests (linked)
            field_id = self.test_fields_crud()
            if field_id:
                self.test_harvests_crud(field_id)
            
            # Dashboard and quotations
            self.test_dashboard_summary()
            self.test_quotations_b3()
            
            # Authorization
            self.test_authorization()
            
        except Exception as e:
            print(f"❌ Test suite failed with error: {str(e)}")
            self.log_test("Test Suite", False, f"Exception: {str(e)}")
        
        # Summary
        self.print_summary()
        
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for t in self.test_results if t["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n🔍 FAILED TESTS:")
            for test in self.test_results:
                if not test["success"]:
                    print(f"  ❌ {test['test']}: {test['message']}")
        
        print("\n" + "=" * 60)
        
        return failed_tests == 0

if __name__ == "__main__":
    tester = AgroTrackTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)