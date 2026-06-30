"""
config.py — Central configuration for the Smart Farm system.

Adapted for container deployment (Fly.io / Railway):
  - BASE_DIR now resolves relative to this package so it works no matter
    where the container's working directory ends up.
  - PATHS can be overridden by environment variables (useful if you mount
    a persistent volume for models on Fly.io instead of baking them into
    the image).
"""

import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # backend/

DATASETS_DIR = os.environ.get("SMARTFARM_DATASETS_DIR", os.path.join(BASE_DIR, "Datasets"))
MODELS_DIR   = os.environ.get("SMARTFARM_MODELS_DIR",   os.path.join(BASE_DIR, "models"))

# --- Paths ---
PATHS = {
    "crop_csv":         os.path.join(DATASETS_DIR, "Crop_Pred.csv"),
    "fert_csv":         os.path.join(DATASETS_DIR, "FertPredictDataset.csv"),
    "crop_model":       os.path.join(MODELS_DIR, "crop_model.joblib"),
    "fert_model":       os.path.join(MODELS_DIR, "fert_model.joblib"),
    "crop_scaler":      os.path.join(MODELS_DIR, "crop_scaler.joblib"),
    "fert_scaler":      os.path.join(MODELS_DIR, "fert_scaler.joblib"),
    "crop_label_map":   os.path.join(MODELS_DIR, "crop_label_map.joblib"),
}

# --- Sensor feature definitions ---
# Each entry: (min_valid, max_valid) — readings outside this range are flagged
SENSOR_RANGES = {
    "pH":           (0.0,  14.0),
    "N":            (0.0,  300.0),
    "P":            (0.0,  200.0),
    "K":            (0.0,  300.0),
    "temperature":  (0.0,  60.0),
    "humidity":     (0.0,  100.0),
    "pressure":     (90.0, 110.0),
    "moisture":     (0.0,  100.0),
}

# --- Crop model feature order ---
CROP_FEATURES = ["N", "P", "K", "pH"]

# --- Fertiliser model feature order ---
FERT_FEATURES = ["N", "P", "K"]

# --- Fertiliser class descriptions ---
FERT_CLASS_LABELS = {
    1: "Low potassium — apply a potassium-rich (Class 1) fertiliser",
    2: "Low nitrogen — apply a nitrogen-rich (Class 2) fertiliser",
    3: "Low phosphorus — apply a phosphorus-rich (Class 3) fertiliser",
}

# --- Weather thresholds (rule-based) ---
WEATHER_RULES = {
    "thunderstorm": {"humidity_min": 70, "pressure_max": 100},
    "rain":         {"humidity_min": 70},
    "wind":         {"pressure_max": 99},
}

# --- Model hyperparameters ---
CROP_MODEL_PARAMS = {
    "n_estimators":  200,
    "max_depth":     None,
    "random_state":  42,
    "n_jobs":        -1,
}

FERT_MODEL_PARAMS = {
    "n_estimators":  100,
    "max_depth":     6,
    "random_state":  42,
    "n_jobs":        -1,
}

TEST_SIZE   = 0.2
RANDOM_SEED = 42

# --- API/server config ---
CORS_ALLOW_ORIGINS = [
    o.strip() for o in os.environ.get("SMARTFARM_CORS_ORIGINS", "*").split(",") if o.strip()
]
