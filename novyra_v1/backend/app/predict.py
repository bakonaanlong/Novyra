"""
predict.py — Inference module.  Loads saved models and returns structured results.

Unchanged in behaviour from the original; only the import is now relative
since this lives inside the `app` package.
"""

from __future__ import annotations
import os
import numpy as np
import joblib
from dataclasses import dataclass

from .config import PATHS, CROP_FEATURES, FERT_FEATURES, FERT_CLASS_LABELS


class _ModelStore:
    """Holds loaded models so joblib.load() is only called once per process."""

    def __init__(self):
        self._crop_model     = None
        self._crop_scaler    = None
        self._crop_label_map = None
        self._fert_model     = None
        self._fert_scaler    = None

    def _load_crop(self):
        if self._crop_model is None:
            self._crop_model     = joblib.load(PATHS["crop_model"])
            self._crop_scaler    = joblib.load(PATHS["crop_scaler"])
            self._crop_label_map = joblib.load(PATHS["crop_label_map"])

    def _load_fert(self):
        if self._fert_model is None:
            self._fert_model  = joblib.load(PATHS["fert_model"])
            self._fert_scaler = joblib.load(PATHS["fert_scaler"])

    @property
    def crop_model(self):
        self._load_crop(); return self._crop_model

    @property
    def crop_scaler(self):
        self._load_crop(); return self._crop_scaler

    @property
    def crop_label_map(self):
        self._load_crop(); return self._crop_label_map

    @property
    def fert_model(self):
        self._load_fert(); return self._fert_model

    @property
    def fert_scaler(self):
        self._load_fert(); return self._fert_scaler


_store = _ModelStore()


@dataclass
class CropResult:
    crop:         str
    confidence:   float
    alternatives: list  # [(crop, confidence), ...]


@dataclass
class FertResult:
    class_id:    int
    description: str
    confidence:  float


def predict_crop(sensor: dict) -> CropResult:
    features = np.array([[sensor[f] for f in CROP_FEATURES]], dtype=np.float64)
    features_scaled = _store.crop_scaler.transform(features)

    proba = _store.crop_model.predict_proba(features_scaled)[0]
    idx_to_crop = {v: k for k, v in _store.crop_label_map.items()}
    ranked = sorted(enumerate(proba), key=lambda x: x[1], reverse=True)

    top_class, top_conf = ranked[0]
    alternatives = [(idx_to_crop[cls], float(conf)) for cls, conf in ranked[1:4]]

    return CropResult(
        crop         = idx_to_crop[top_class],
        confidence   = float(top_conf),
        alternatives = alternatives,
    )


def predict_fertiliser(sensor: dict) -> FertResult:
    features = np.array([[sensor[f] for f in FERT_FEATURES]], dtype=np.float64)
    features_scaled = _store.fert_scaler.transform(features)

    proba    = _store.fert_model.predict_proba(features_scaled)[0]
    pred_idx = int(np.argmax(proba))
    class_id = pred_idx + 1

    return FertResult(
        class_id    = class_id,
        description = FERT_CLASS_LABELS[class_id],
        confidence  = float(proba[pred_idx]),
    )


def models_are_trained() -> bool:
    return all(
        os.path.exists(p)
        for p in [PATHS["crop_model"], PATHS["fert_model"],
                  PATHS["crop_scaler"], PATHS["fert_scaler"],
                  PATHS["crop_label_map"]]
    )
