import os
import time
import json
import psycopg2
import pandas as pd
from celery import Celery
import numpy as np
from sklearn.linear_model import LinearRegression

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Database connection params
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "coreinventory")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "password123")

celery_app = Celery("core_inventory_worker", broker=REDIS_URL, backend=REDIS_URL)

def get_db_connection():
    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )

@celery_app.task(name="worker.generate_inventory_export")
def generate_inventory_export(user_id, export_format="csv"):
    """
    Simulates a heavy Big Data export process.
    Connects to the database, streams a large dataset into pandas,
    and saves it to a file. In a real system, this would upload to S3.
    """
    print(f"Starting inventory export for User {user_id}")
    time.sleep(2) # Simulate heavy processing delay
    
    try:
        conn = get_db_connection()
        query = "SELECT * FROM products;" 
        # In a real big data scenario, we'd use cursor pagination and write chunks
        df = pd.read_sql_query(query, conn)
        conn.close()
        
        filename = f"/tmp/export_{user_id}_{int(time.time())}.csv"
        df.to_csv(filename, index=False)
        
        print(f"Export completed successfully. Saved to {filename}")
        return {"status": "success", "file_path": filename, "rows_exported": len(df)}
    except Exception as e:
        print(f"Export failed: {str(e)}")
        return {"status": "error", "message": str(e)}

@celery_app.task(name="worker.predict_restock_levels")
def predict_restock_levels():
    """
    Simulates an AI/ML task that predicts future inventory needs.
    """
    print("Starting AI restocking predictions...")
    time.sleep(3) # Simulate ML model inference delay
    
    # Mock ML process: Using Linear Regression to forecast demand
    # In reality, this would query historical stock movements and train a model.
    days = np.array([1, 2, 3, 4, 5]).reshape(-1, 1)
    sales = np.array([10, 20, 28, 41, 55])
    
    model = LinearRegression()
    model.fit(days, sales)
    next_day_prediction = model.predict([[6]])
    
    result = {
        "status": "success",
        "message": "AI predictions generated",
        "mock_next_day_demand": int(next_day_prediction[0])
    }
    print(f"AI Prediction complete: {result}")
    return result
