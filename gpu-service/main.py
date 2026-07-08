import os
import time
from datetime import datetime
from typing import List, Optional

import modal
from fastapi import FastAPI, HTTPException, Depends, Security
from fastapi.security.api_key import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
import pandas as pd

# =============================================================================
# Modal Configuration
# =============================================================================

# Build the Modal Image with dependencies
image = (
    modal.Image.from_registry("nvidia/cuda:12.2.2-devel-ubuntu22.04", add_python="3.10")
    .apt_install("libgomp1")
    .pip_install("fastapi", "uvicorn", "pydantic", "scikit-learn", "numpy", "pandas")
    .pip_install(
        "cudf-cu12==24.4.1",
        "cuml-cu12==24.4.0",
        extra_index_url="https://pypi.nvidia.com"
    )
)

app = modal.App("citypulse-gpu-service")
web_app = FastAPI(title="CityPulse AI - GPU Acceleration Service")

# =============================================================================
# Security & CORS
# =============================================================================

# Add CORS so Vercel can hit the benchmark endpoint directly from the browser
web_app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://citypulse-urban.vercel.app", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_KEY = os.environ.get("GPU_SERVICE_API_KEY")
api_key_header = APIKeyHeader(name="x-api-key", auto_error=False)

def get_api_key(api_key: str = Security(api_key_header)):
    if api_key != API_KEY:
        raise HTTPException(status_code=403, detail="Could not validate API Key")
    return api_key

# =============================================================================
# Models
# =============================================================================

class ComplaintItem(BaseModel):
    id: str
    raw_text: str
    category: str
    severity: str
    latitude: float
    longitude: float
    timestamp: str

class TriageRequest(BaseModel):
    zone: str
    complaints: List[ComplaintItem]

class AqiHistoryItem(BaseModel):
    timestamp: str
    value: float

class WeatherHistoryItem(BaseModel):
    timestamp: str
    temperature_c: float
    humidity_pct: float
    wind_kph: float

class ForecastRequest(BaseModel):
    zone: str
    traffic_multiplier: float
    aqi_history: List[AqiHistoryItem]
    weather_history: List[WeatherHistoryItem]

# =============================================================================
# Endpoints
# =============================================================================

@web_app.get("/")
def read_root():
    return {
        "status": "online",
        "device": "Modal Serverless NVIDIA T4 GPU",
        "protected": True
    }

@web_app.post("/triage", dependencies=[Depends(get_api_key)])
def run_triage(req: TriageRequest):
    import cudf
    from cuml.cluster import DBSCAN
    
    if not req.complaints:
        return {
            "hotspot_detected": False,
            "cluster_count": 0,
            "computed_on_gpu": True
        }

    coords = [[c.latitude, c.longitude] for c in req.complaints]
    coords_arr = np.array(coords, dtype=np.float32)

    eps = 0.005
    min_samples = 2
    start_time = time.perf_counter()

    # GPU Acceleration!
    df = cudf.DataFrame(coords_arr, columns=['lat', 'lng'])
    dbscan = DBSCAN(eps=eps, min_samples=min_samples)
    dbscan.fit(df)
    labels = dbscan.labels_.to_numpy()

    duration = (time.perf_counter() - start_time) * 1000
    unique_labels = set(labels)
    clusters = [l for l in unique_labels if l != -1]
    cluster_count = len(clusters)

    return {
        "hotspot_detected": cluster_count > 0,
        "cluster_count": cluster_count,
        "computed_on_gpu": True,
        "execution_time_ms": duration,
        "labels": labels.tolist()
    }

@web_app.post("/forecast", dependencies=[Depends(get_api_key)])
def run_forecast(req: ForecastRequest):
    import cudf
    from cuml.linear_model import LinearRegression
    
    start_time = time.perf_counter()
    aqi_values = [item.value for item in req.aqi_history]
    weather_temps = [item.temperature_c for item in req.weather_history]
    weather_winds = [item.wind_kph for item in req.weather_history]
    weather_hums = [item.humidity_pct for item in req.weather_history]

    if len(aqi_values) < 5:
        # Heuristic fallback
        base_aqi = np.mean(aqi_values) if aqi_values else 75.0
        predicted_aqi = base_aqi * (1.0 + (req.traffic_multiplier - 1.0) * 0.3)
        return {
            "predicted_aqi": max(0, min(500, round(predicted_aqi))),
            "confidence": 0.6,
            "reasoning": "Fallback used due to insufficient data.",
            "computed_on_gpu": True,
            "execution_time_ms": (time.perf_counter() - start_time) * 1000
        }

    n = min(len(aqi_values), len(weather_temps))
    if n <= 1:
        return {"predicted_aqi": 75, "confidence": 0.4, "reasoning": "Error", "computed_on_gpu": True, "execution_time_ms": 0}

    X_data = []
    y_data = []
    for i in range(1, n):
        X_data.append([aqi_values[i - 1], weather_temps[i], weather_hums[i], weather_winds[i]])
        y_data.append(aqi_values[i])

    X_arr = np.array(X_data, dtype=np.float32)
    y_arr = np.array(y_data, dtype=np.float32)

    # GPU Acceleration!
    X_df = cudf.DataFrame(X_arr)
    y_df = cudf.Series(y_arr)
    model = LinearRegression()
    model.fit(X_df, y_df)
    
    latest_features = np.array([[aqi_values[-1], weather_temps[-1], weather_hums[-1], weather_winds[-1]]], dtype=np.float32)
    latest_df = cudf.DataFrame(latest_features)
    pred = model.predict(latest_df)[0].item()

    predicted_aqi = pred * (1.0 + (req.traffic_multiplier - 1.0) * 0.3)
    predicted_aqi = max(0, min(500, round(predicted_aqi)))

    return {
        "predicted_aqi": predicted_aqi,
        "confidence": 0.85,
        "reasoning": f"GPU cuML Linear Regression used. Traffic multiplier: {req.traffic_multiplier:.2f}",
        "computed_on_gpu": True,
        "execution_time_ms": (time.perf_counter() - start_time) * 1000
    }

@web_app.get("/benchmark", dependencies=[Depends(get_api_key)])
def run_benchmark():
    import cudf
    from cuml.cluster import DBSCAN as cumlDBSCAN
    from sklearn.cluster import DBSCAN as cpuDBSCAN
    
    size = 15000
    dummy_coords = np.random.uniform(-90.0, 90.0, (size, 2)).astype(np.float32)

    # CPU Run
    start_cpu = time.perf_counter()
    cpu_db = cpuDBSCAN(eps=0.01, min_samples=5)
    cpu_db.fit(dummy_coords)
    cpu_time = (time.perf_counter() - start_cpu) * 1000

    # GPU Run
    start_gpu = time.perf_counter()
    df = cudf.DataFrame(dummy_coords, columns=['lat', 'lng'])
    gpu_db = cumlDBSCAN(eps=0.01, min_samples=5)
    gpu_db.fit(df)
    gpu_time = (time.perf_counter() - start_gpu) * 1000

    return {
        "pandas_ms": cpu_time,
        "cudf_ms": gpu_time,
        "speedup": cpu_time / gpu_time if gpu_time > 0 else 1.0,
        "dataset_size": size,
        "computed_on_gpu": True
    }

# =============================================================================
# Modal Entrypoint
# =============================================================================

@app.function(image=image, gpu="T4", secrets=[modal.Secret.from_dotenv()])
@modal.asgi_app()
def fastapi_app():
    return web_app
