from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel, Field, create_engine, Session, select
from typing import List, Optional
import joblib
import pandas as pd
from web3 import Web3
import json
import os
from datetime import datetime
from fastapi import WebSocket, WebSocketDisconnect
import asyncio

# --- Constants & Config ---
CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
W3_PROVIDER = "http://127.0.0.1:8545"
MODEL_PATH = "../ai/models/credit_model.joblib"
ABI_PATH = "../blockchain/artifacts/contracts/POFinancing.sol/POFinancing.json"

# --- Database Setup ---
sqlite_url = "sqlite:///./finance.db"
engine = create_engine(sqlite_url)

class LoanRecord(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    po_id: int
    vendor_address: str
    amount: float
    risk_score: float
    status: str # Approved, Rejected, Pending, Repaid
    timestamp: datetime = Field(default_factory=datetime.utcnow)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session

from contextlib import asynccontextmanager

# --- FastAPI App ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    create_db_and_tables()
    yield
    # Shutdown logic (none for now)

app = FastAPI(title="Open PO Financing API", lifespan=lifespan)

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load AI Model
try:
    model = joblib.load(MODEL_PATH)
except:
    model = None
    print("Warning: Credit model not found.")

# WebSocket Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            await connection.send_json(message)

manager = ConnectionManager()

# Connect to Blockchain
w3 = Web3(Web3.HTTPProvider(W3_PROVIDER))
with open(ABI_PATH) as f:
    contract_json = json.load(f)
    contract_abi = contract_json["abi"]

contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=contract_abi)

@app.get("/")
def read_root():
    return {"status": "PO Financing Backend Running"}

@app.get("/purchase-orders/{po_id}")
def get_po(po_id: int):
    try:
        po_data = contract.functions.getPurchaseOrder(po_id).call()
        return {
            "id": po_data[0],
            "buyer": po_data[1],
            "vendor": po_data[2],
            "amount": po_data[3],
            "deliveryDate": po_data[4],
            "goodsCategory": po_data[5],
            "status": po_data[6]
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.post("/request-loan/{po_id}")
async def request_loan(po_id: int, session: Session = Depends(get_session)):
    # 1. Fetch PO details from contract
    try:
        po_data = contract.functions.getPurchaseOrder(po_id).call()
    except Exception as e:
        raise HTTPException(status_code=404, detail="PO not found on blockchain")

    buyer_address = po_data[1]
    vendor_address = po_data[2]
    amount = po_data[3]
    delivery_date = po_data[4]
    category = po_data[5]

    # 2. Build feature vector for AI model
    # po_amount, delivery_days, vendor_history_score, buyer_score, category_risk
    # We use some mock scores for this prototype
    days_to_delivery = (delivery_date - int(datetime.utcnow().timestamp())) // 86400
    if days_to_delivery < 0: days_to_delivery = 0
    
    # Mock scores (in production, these would come from historic performance data)
    vendor_history_score = 0.85 
    buyer_score = 0.9
    category_risk_map = {"Electronics": 0.1, "Textiles": 0.3, "Construction": 0.5, "Food": 0.2}
    cat_risk = category_risk_map.get(category, 0.2)

    features = pd.DataFrame([{
        'po_amount': amount,
        'delivery_days': days_to_delivery,
        'vendor_history_score': vendor_history_score,
        'buyer_score': buyer_score,
        'category_risk': cat_risk
    }])

    # 3. Predict risk score
    if model:
        risk_prob = model.predict(features)[0]
    else:
        risk_prob = 0.5 # Default if model missing

    # 4. Decision logic
    if risk_prob > 0.7:
        status = "Approved"
    elif risk_prob > 0.4:
        status = "Partial Approval"
    else:
        status = "Rejected"

    # 5. Store loan record
    loan_record = LoanRecord(
        po_id=po_id,
        vendor_address=vendor_address,
        amount=amount,
        risk_score=float(risk_prob),
        status=status
    )
    session.add(loan_record)
    session.commit()
    session.refresh(loan_record)

    # 6. If approved, mark as financed on blockchain (Admin call)
    if status == "Approved" or status == "Partial Approval":
        # In a real app, this would be a signed transaction from the lender's wallet
        # For prototype, we assume the backend has permission
        pass 

    # 7. Broadcast update
    await manager.broadcast({"type": "NEW_LOAN", "data": loan_record.model_dump()})

    return {
        "po_id": po_id,
        "risk_probability": float(risk_prob),
        "decision": status,
        "loan_record_id": loan_record.id
    }

@app.get("/loans", response_model=List[LoanRecord])
def list_loans(session: Session = Depends(get_session)):
    loans = session.exec(select(LoanRecord)).all()
    return loans

@app.post("/repay-loan/{loan_id}")
async def repay_loan(loan_id: int, session: Session = Depends(get_session)):
    loan = session.get(LoanRecord, loan_id)
    if not loan:
        raise HTTPException(status_code=404, detail="Loan record not found")
    
    loan.status = "Repaid"
    session.add(loan)
    session.commit()
    
    # Broadcast update
    await manager.broadcast({"type": "LOAN_REPAID", "data": {"loan_id": loan_id}})
    
    return {"status": "Loan marked as repaid"}

@app.get("/stats")
def get_dashboard_stats(session: Session = Depends(get_session)):
    loans = session.exec(select(LoanRecord)).all()
    total_capital = sum(l.amount for l in loans if l.status in ["Approved", "Partial Approval"])
    financed_pos = len([l for l in loans if l.status in ["Approved", "Partial Approval"]])
    avg_risk = sum(l.risk_score for l in loans) / len(loans) if loans else 0
    
    return {
        "total_capital": total_capital,
        "financed_pos": financed_pos,
        "average_risk": avg_risk
    }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
