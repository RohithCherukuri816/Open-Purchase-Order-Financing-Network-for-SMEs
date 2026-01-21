import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
import joblib
import os

def generate_data(n_samples=1000):
    np.random.seed(42)
    
    po_amount = np.random.uniform(1000, 50000, n_samples)
    delivery_days = np.random.randint(7, 90, n_samples)
    vendor_history_score = np.random.uniform(0.1, 1.0, n_samples)
    buyer_score = np.random.uniform(0.3, 1.0, n_samples)
    # goods_category_risk: 0 (low) to 1 (high)
    # 0: Electronics, 1: Textiles, 2: Construction material, 3: Food
    category_risk = np.random.choice([0.1, 0.3, 0.5, 0.2], n_samples)
    
    # Simple logic for repayment probability
    # Higher vendor score + higher buyer score - higher category risk -> higher repayment probability
    repayment_probability = (
        0.4 * vendor_history_score + 
        0.3 * buyer_score - 
        0.2 * (category_risk) + 
        0.1 * (1 - po_amount/50000) + 
        0.1 * (1 - delivery_days/90) + 
        np.random.normal(0, 0.05, n_samples)
    )
    
    repayment_probability = np.clip(repayment_probability, 0, 1)
    
    df = pd.DataFrame({
        'po_amount': po_amount,
        'delivery_days': delivery_days,
        'vendor_history_score': vendor_history_score,
        'buyer_score': buyer_score,
        'category_risk': category_risk,
        'repayment_probability': repayment_probability
    })
    
    return df

def train_model():
    print("Generating synthetic data...")
    df = generate_data()
    
    X = df.drop('repayment_probability', axis=1)
    y = df['repayment_probability']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training Random Forest model...")
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    score = model.score(X_test, y_test)
    print(f"Model trained. R^2 score: {score:.4f}")
    
    # Ensure directory exists
    os.makedirs('models', exist_ok=True)
    joblib.dump(model, 'models/credit_model.joblib')
    print("Model saved to models/credit_model.joblib")

if __name__ == "__main__":
    train_model()
