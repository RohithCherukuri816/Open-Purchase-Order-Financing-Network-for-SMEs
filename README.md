# Open Purchase Order Financing Network

An open, interoperable purchase-order–based financing system for small vendors, utilizing Blockchain for verification, Python for lending logic, and AI for credit risk scoring.

## Architecture
- **Blockchain**: Solidity Smart Contract on Hardhat (Local Node).
- **Backend**: FastAPI + Web3.py + SQLModel.
- **AI**: Random Forest Regressor (Scikit-learn) for Credit Scoring.
- **Frontend**: React (Vite) + Framer Motion + Lucide React.

## Getting Started

### 1. Blockchain Setup
```bash
cd blockchain
npm install
npx hardhat node
# In another terminal:
npx hardhat run scripts/deploy.js --network localhost
```

### 2. AI Setup
```bash
cd ai
pip install pandas numpy scikit-learn joblib
python train_model.py
```

### 3. Backend Setup
```bash
cd backend
pip install fastapi uvicorn web3 sqlmodel
uvicorn main:app --reload --port 8000
```

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## AI Logic & Explainability
The credit scoring model uses a Random Forest Regressor trained on 1,000 synthetic samples. It evaluates:
1. **PO Amount**: Higher amounts slightly increase risk.
2. **Delivery Days**: Tight deadlines increase delivery risk.
3. **Vendor History**: Historical repayment performance.
4. **Buyer Score**: Credibility of the purchasing entity.
5. **Category Risk**: Specific industry risks (e.g., Electronics vs Food).

The model outputs a probability (0-1). Scores above 0.7 are approved for full financing.

## Tech Stack Highlights
- **Premium UI**: Designed for the Singapore/Luxembourg fintech market with a sleek light mode and indigo color palette.
- **Interoperability**: Smart contract events allow any participant to monitor and verify PO states.
- **Explainable AI**: Features are clearly mapped to risk decisions.
