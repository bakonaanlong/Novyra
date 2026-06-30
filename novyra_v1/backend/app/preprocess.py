"""
preprocess.py — Data loading and preprocessing for crop and fertiliser datasets.

Unchanged from the original except for the relative import (this now lives
inside the `app` package).
"""

import re
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler

from .config import CROP_FEATURES, FERT_FEATURES


# ---------------------------------------------------------------------------
# Crop dataset
# ---------------------------------------------------------------------------

def _clean_crop_name(name: str) -> str:
    """Strip special characters and collapse whitespace from a crop name."""
    name = re.sub(r"[^\w\s]", " ", name)      # replace non-word chars
    name = re.sub(r"\(.*?\)", "", name)        # remove parenthetical notes
    name = re.sub(r"\s+", " ", name).strip()  # collapse whitespace
    if name.lower().startswith("drumstick"):
        return "Drumstick"
    return name


def load_crop_data(csv_path: str):
    """
    Load and preprocess the crop recommendation CSV.

    Returns
    -------
    X : np.ndarray, shape (n_samples, len(CROP_FEATURES))
    y : np.ndarray, shape (n_samples,)   — integer class labels
    scaler : fitted StandardScaler
    label_map : dict  { crop_name: int_class }
    """
    df = pd.read_csv(csv_path)

    unnamed = [c for c in df.columns if c.startswith("Unnamed")]
    if unnamed:
        df.drop(columns=unnamed, inplace=True)

    df["Crop"] = df["Crop"].astype(str).apply(_clean_crop_name)

    unique_crops = sorted(df["Crop"].unique())
    label_map = {crop: idx for idx, crop in enumerate(unique_crops)}
    df["label"] = df["Crop"].map(label_map)

    X = df[CROP_FEATURES].values.astype(np.float64)
    y = df["label"].values.astype(np.int64)

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    return X_scaled, y, scaler, label_map


# ---------------------------------------------------------------------------
# Fertiliser dataset
# ---------------------------------------------------------------------------

def load_fert_data(csv_path: str):
    """
    Load and preprocess the fertiliser recommendation CSV.

    Drops columns unused by the model (Ca, Mg, S, Lime, C, Moisture).
    Remaps classes: original {2, 3, 4}  →  model-friendly {0, 1, 2}.
    """
    COLS_TO_DROP = ["Ca", "Mg", "S", "Lime", "C", "Moisture"]

    df = pd.read_csv(csv_path)
    df.drop(columns=[c for c in COLS_TO_DROP if c in df.columns], inplace=True)

    df = df[df["class"] != 1].copy()
    df["class"] = df["class"].map({2: 0, 3: 1, 4: 2})

    X = df[FERT_FEATURES].values.astype(np.float64)
    y = df["class"].values.astype(np.int64)

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    return X_scaled, y, scaler
