from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime, timedelta
import bcrypt
import jwt
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30

# Security
security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ==================== MODELS ====================

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = None
    plan: str = "trial"
    trial_end_date: datetime
    created_at: datetime

class ExpenseCreate(BaseModel):
    valor: float
    categoria: str
    cultura: str
    tipo: str
    data: datetime
    descricao: Optional[str] = None

class Expense(BaseModel):
    id: str
    user_id: str
    valor: float
    categoria: str
    cultura: str
    tipo: str
    data: datetime
    descricao: Optional[str] = None
    created_at: datetime

class RevenueCreate(BaseModel):
    valor: float
    cultura: str
    tipo: str
    data: datetime
    descricao: Optional[str] = None

class Revenue(BaseModel):
    id: str
    user_id: str
    valor: float
    cultura: str
    tipo: str
    data: datetime
    descricao: Optional[str] = None
    created_at: datetime

class DebtCreate(BaseModel):
    valor: float
    credor: str
    vencimento: datetime
    cultura: str
    status: str = "pendente"
    descricao: Optional[str] = None

class Debt(BaseModel):
    id: str
    user_id: str
    valor: float
    credor: str
    vencimento: datetime
    cultura: str
    status: str
    descricao: Optional[str] = None
    created_at: datetime

class FieldCreate(BaseModel):
    nome: str
    area_ha: float
    cultura: str
    localizacao: Optional[str] = None

class Field(BaseModel):
    id: str
    user_id: str
    nome: str
    area_ha: float
    cultura: str
    localizacao: Optional[str] = None
    created_at: datetime

class HarvestCreate(BaseModel):
    field_id: str
    cultura: str
    quantidade_sacas: float
    data_colheita: datetime
    observacoes: Optional[str] = None

class Harvest(BaseModel):
    id: str
    user_id: str
    field_id: str
    field_name: str
    area_ha: float
    cultura: str
    quantidade_sacas: float
    produtividade: float  # sacas/ha
    data_colheita: datetime
    observacoes: Optional[str] = None
    created_at: datetime


# ==================== AUTH HELPERS ====================

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user


# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    trial_end = datetime.utcnow() + timedelta(days=14)
    hashed_pw = hash_password(user_data.password)
    
    user_doc = {
        "name": user_data.name,
        "email": user_data.email,
        "password": hashed_pw,
        "phone": user_data.phone,
        "plan": "trial",
        "trial_end_date": trial_end,
        "created_at": datetime.utcnow()
    }
    
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    # Create token
    token = create_access_token({"sub": user_id})
    
    return {
        "token": token,
        "user": {
            "id": user_id,
            "name": user_data.name,
            "email": user_data.email,
            "phone": user_data.phone,
            "plan": "trial",
            "trial_end_date": trial_end.isoformat()
        }
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_id = str(user["_id"])
    token = create_access_token({"sub": user_id})
    
    return {
        "token": token,
        "user": {
            "id": user_id,
            "name": user["name"],
            "email": user["email"],
            "phone": user.get("phone"),
            "plan": user.get("plan", "trial"),
            "trial_end_date": user.get("trial_end_date").isoformat() if user.get("trial_end_date") else None
        }
    }

@api_router.get("/auth/me")
async def get_me(current_user = Depends(get_current_user)):
    return {
        "id": str(current_user["_id"]),
        "name": current_user["name"],
        "email": current_user["email"],
        "phone": current_user.get("phone"),
        "plan": current_user.get("plan", "trial"),
        "trial_end_date": current_user.get("trial_end_date").isoformat() if current_user.get("trial_end_date") else None
    }


# ==================== EXPENSES ====================

@api_router.post("/expenses")
async def create_expense(expense: ExpenseCreate, current_user = Depends(get_current_user)):
    expense_doc = {
        "user_id": str(current_user["_id"]),
        "valor": expense.valor,
        "categoria": expense.categoria,
        "cultura": expense.cultura,
        "tipo": expense.tipo,
        "data": expense.data,
        "descricao": expense.descricao,
        "created_at": datetime.utcnow()
    }
    result = await db.expenses.insert_one(expense_doc)
    expense_doc["id"] = str(result.inserted_id)
    expense_doc["_id"] = str(result.inserted_id)
    return expense_doc

@api_router.get("/expenses")
async def get_expenses(current_user = Depends(get_current_user)):
    expenses = await db.expenses.find({"user_id": str(current_user["_id"])}).to_list(1000)
    return [{"id": str(e["_id"]), **{k: v for k, v in e.items() if k != "_id"}} for e in expenses]

@api_router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str, current_user = Depends(get_current_user)):
    result = await db.expenses.delete_one({"_id": ObjectId(expense_id), "user_id": str(current_user["_id"])})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"message": "Expense deleted"}


# ==================== REVENUES ====================

@api_router.post("/revenues")
async def create_revenue(revenue: RevenueCreate, current_user = Depends(get_current_user)):
    revenue_doc = {
        "user_id": str(current_user["_id"]),
        "valor": revenue.valor,
        "cultura": revenue.cultura,
        "tipo": revenue.tipo,
        "data": revenue.data,
        "descricao": revenue.descricao,
        "created_at": datetime.utcnow()
    }
    result = await db.revenues.insert_one(revenue_doc)
    revenue_doc["id"] = str(result.inserted_id)
    revenue_doc["_id"] = str(result.inserted_id)
    return revenue_doc

@api_router.get("/revenues")
async def get_revenues(current_user = Depends(get_current_user)):
    revenues = await db.revenues.find({"user_id": str(current_user["_id"])}).to_list(1000)
    return [{"id": str(r["_id"]), **{k: v for k, v in r.items() if k != "_id"}} for r in revenues]

@api_router.delete("/revenues/{revenue_id}")
async def delete_revenue(revenue_id: str, current_user = Depends(get_current_user)):
    result = await db.revenues.delete_one({"_id": ObjectId(revenue_id), "user_id": str(current_user["_id"])})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Revenue not found")
    return {"message": "Revenue deleted"}


# ==================== DEBTS ====================

@api_router.post("/debts")
async def create_debt(debt: DebtCreate, current_user = Depends(get_current_user)):
    debt_doc = {
        "user_id": str(current_user["_id"]),
        "valor": debt.valor,
        "credor": debt.credor,
        "vencimento": debt.vencimento,
        "cultura": debt.cultura,
        "status": debt.status,
        "descricao": debt.descricao,
        "created_at": datetime.utcnow()
    }
    result = await db.debts.insert_one(debt_doc)
    debt_doc["id"] = str(result.inserted_id)
    debt_doc["_id"] = str(result.inserted_id)
    return debt_doc

@api_router.get("/debts")
async def get_debts(current_user = Depends(get_current_user)):
    debts = await db.debts.find({"user_id": str(current_user["_id"])}).to_list(1000)
    return [{"id": str(d["_id"]), **{k: v for k, v in d.items() if k != "_id"}} for d in debts]

@api_router.delete("/debts/{debt_id}")
async def delete_debt(debt_id: str, current_user = Depends(get_current_user)):
    result = await db.debts.delete_one({"_id": ObjectId(debt_id), "user_id": str(current_user["_id"])})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Debt not found")
    return {"message": "Debt deleted"}

@api_router.patch("/debts/{debt_id}/status")
async def update_debt_status(debt_id: str, status: str, current_user = Depends(get_current_user)):
    result = await db.debts.update_one(
        {"_id": ObjectId(debt_id), "user_id": str(current_user["_id"])},
        {"$set": {"status": status}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Debt not found")
    return {"message": "Status updated"}


# ==================== FIELDS ====================

@api_router.post("/fields")
async def create_field(field: FieldCreate, current_user = Depends(get_current_user)):
    field_doc = {
        "user_id": str(current_user["_id"]),
        "nome": field.nome,
        "area_ha": field.area_ha,
        "cultura": field.cultura,
        "localizacao": field.localizacao,
        "created_at": datetime.utcnow()
    }
    result = await db.fields.insert_one(field_doc)
    field_doc["id"] = str(result.inserted_id)
    field_doc["_id"] = str(result.inserted_id)
    return field_doc

@api_router.get("/fields")
async def get_fields(current_user = Depends(get_current_user)):
    fields = await db.fields.find({"user_id": str(current_user["_id"])}).to_list(1000)
    return [{"id": str(f["_id"]), **{k: v for k, v in f.items() if k != "_id"}} for f in fields]

@api_router.delete("/fields/{field_id}")
async def delete_field(field_id: str, current_user = Depends(get_current_user)):
    result = await db.fields.delete_one({"_id": ObjectId(field_id), "user_id": str(current_user["_id"])})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Field not found")
    return {"message": "Field deleted"}


# ==================== HARVESTS ====================

@api_router.post("/harvests")
async def create_harvest(harvest: HarvestCreate, current_user = Depends(get_current_user)):
    # Get field info
    field = await db.fields.find_one({"_id": ObjectId(harvest.field_id), "user_id": str(current_user["_id"])})
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    
    # Calculate productivity
    produtividade = harvest.quantidade_sacas / field["area_ha"]
    
    harvest_doc = {
        "user_id": str(current_user["_id"]),
        "field_id": harvest.field_id,
        "field_name": field["nome"],
        "area_ha": field["area_ha"],
        "cultura": harvest.cultura,
        "quantidade_sacas": harvest.quantidade_sacas,
        "produtividade": round(produtividade, 2),
        "data_colheita": harvest.data_colheita,
        "observacoes": harvest.observacoes,
        "created_at": datetime.utcnow()
    }
    result = await db.harvests.insert_one(harvest_doc)
    harvest_doc["id"] = str(result.inserted_id)
    harvest_doc["_id"] = str(result.inserted_id)
    return harvest_doc

@api_router.get("/harvests")
async def get_harvests(current_user = Depends(get_current_user)):
    harvests = await db.harvests.find({"user_id": str(current_user["_id"])}).to_list(1000)
    return [{"id": str(h["_id"]), **{k: v for k, v in h.items() if k != "_id"}} for h in harvests]

@api_router.delete("/harvests/{harvest_id}")
async def delete_harvest(harvest_id: str, current_user = Depends(get_current_user)):
    result = await db.harvests.delete_one({"_id": ObjectId(harvest_id), "user_id": str(current_user["_id"])})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Harvest not found")
    return {"message": "Harvest deleted"}


# ==================== DASHBOARD ====================

@api_router.get("/dashboard/summary")
async def get_dashboard_summary(current_user = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    
    # Get all revenues
    revenues = await db.revenues.find({"user_id": user_id}).to_list(1000)
    total_receitas = sum(r["valor"] for r in revenues)
    
    # Get all expenses
    expenses = await db.expenses.find({"user_id": user_id}).to_list(1000)
    total_despesas = sum(e["valor"] for e in expenses)
    
    # Get pending debts
    debts = await db.debts.find({"user_id": user_id, "status": "pendente"}).to_list(1000)
    total_dividas = sum(d["valor"] for d in debts)
    
    # Calculate profit
    lucro = total_receitas - total_despesas
    
    # Group by cultura
    receitas_por_cultura = {}
    for r in revenues:
        cultura = r.get("cultura", "Outro")
        receitas_por_cultura[cultura] = receitas_por_cultura.get(cultura, 0) + r["valor"]
    
    despesas_por_cultura = {}
    for e in expenses:
        cultura = e.get("cultura", "Outro")
        despesas_por_cultura[cultura] = despesas_por_cultura.get(cultura, 0) + e["valor"]
    
    return {
        "total_receitas": total_receitas,
        "total_despesas": total_despesas,
        "lucro": lucro,
        "total_dividas_pendentes": total_dividas,
        "receitas_por_cultura": receitas_por_cultura,
        "despesas_por_cultura": despesas_por_cultura,
        "dividas_pendentes": [{"id": str(d["_id"]), **{k: v for k, v in d.items() if k != "_id"}} for d in debts]
    }


# ==================== QUOTATIONS ====================

@api_router.get("/quotations/b3")
async def get_b3_quotations():
    # Mock data - In production, integrate with real B3 API
    import random
    
    base_prices = {
        "Soja": 130.50,
        "Milho": 65.20,
        "Trigo": 95.80,
        "Algodão": 180.30,
        "Aveia": 45.60
    }
    
    quotations = []
    for produto, base_price in base_prices.items():
        variation = random.uniform(-5, 5)
        current_price = base_price * (1 + variation / 100)
        
        quotations.append({
            "produto": produto,
            "preco": round(current_price, 2),
            "variacao": round(variation, 2),
            "unidade": "R$/sc",
            "data": datetime.utcnow().isoformat()
        })
    
    return quotations


# ==================== ROOT ====================

@api_router.get("/")
async def root():
    return {"message": "Agro Track API", "version": "1.0"}


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
