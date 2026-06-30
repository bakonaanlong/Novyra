"""
main.py — FastAPI entry point for the Smart Farm backend.

Endpoints
---------
GET  /health            liveness/readiness check (Fly.io and Railway both
                         poll this to know the container is up)
POST /api/predict       takes sensor readings (+ optional location), returns
                         the same result shape NovyraApp.jsx's AI screen
                         renders: crop, alternatives, fertiliser class,
                         soil health, advice tips, risk warning.
GET  /api/simulate      convenience endpoint returning a simulated sensor
                         reading, for frontend demos with no real hardware.

Run locally:
    uvicorn app.main:app --reload --port 8000

Run in production (see Dockerfile):
    uvicorn app.main:app --host 0.0.0.0 --port $PORT
"""

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from . import sensors, predict, advice
from .config import CORS_ALLOW_ORIGINS

app = FastAPI(title="Smart Farm API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOW_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SensorPayload(BaseModel):
    pH:          float = Field(..., ge=0, le=14)
    N:           float = Field(..., ge=0)
    P:           float = Field(..., ge=0)
    K:           float = Field(..., ge=0)
    temperature: float
    humidity:    float = Field(..., ge=0, le=100)
    pressure:    float
    moisture:    float = Field(..., ge=0, le=100)
    fieldName:   str | None = None
    location:    str | None = None


@app.get("/health")
def health():
    return {
        "status": "ok",
        "models_trained": predict.models_are_trained(),
    }


@app.get("/api/simulate")
def simulate_reading():
    reading = sensors.simulate()
    return reading.as_dict() | {"warnings": reading.warnings}


@app.post("/api/predict")
def run_prediction(payload: SensorPayload):
    if not predict.models_are_trained():
        raise HTTPException(
            status_code=503,
            detail="Models are not trained yet. Run `python -m app.train` (this happens "
                   "automatically during the Docker build) before serving predictions.",
        )

    data = payload.model_dump(exclude={"fieldName", "location"})
    try:
        reading = sensors.from_dict(data, location=payload.location)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    sensor_dict = reading.as_dict()
    crop_result = predict.predict_crop(sensor_dict)
    fert_result = predict.predict_fertiliser(sensor_dict)

    result = advice.build_result(reading, crop_result, fert_result)
    return result
