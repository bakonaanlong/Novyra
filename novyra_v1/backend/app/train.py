"""
train.py — Train and save the crop and fertiliser models.

Run during the Docker build (see Dockerfile) so the deployed container
starts up with trained models already on disk — no training happens at
request time.

    python -m app.train
"""

import os
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

from .config import (
    PATHS, CROP_MODEL_PARAMS, FERT_MODEL_PARAMS,
    TEST_SIZE, RANDOM_SEED, FERT_CLASS_LABELS
)
from .preprocess import load_crop_data, load_fert_data


def _ensure_model_dir():
    os.makedirs(os.path.dirname(PATHS["crop_model"]), exist_ok=True)


def train_crop_model():
    print("\n-- Crop model --------------------------------")
    X, y, scaler, label_map = load_crop_data(PATHS["crop_csv"])

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_SEED, stratify=y
    )

    model = RandomForestClassifier(**CROP_MODEL_PARAMS)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)

    idx_to_crop = {v: k for k, v in label_map.items()}
    target_names = [idx_to_crop[i] for i in sorted(idx_to_crop)]

    print(f"  Test accuracy : {acc:.3f}")
    print(classification_report(y_test, y_pred, target_names=target_names, zero_division=0))

    joblib.dump(model,     PATHS["crop_model"])
    joblib.dump(scaler,    PATHS["crop_scaler"])
    joblib.dump(label_map, PATHS["crop_label_map"])
    print(f"  Saved -> {PATHS['crop_model']}")
    return acc


def train_fert_model():
    print("\n-- Fertiliser model ---------------------------")
    X, y, scaler = load_fert_data(PATHS["fert_csv"])

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_SEED, stratify=y
    )

    model = RandomForestClassifier(**FERT_MODEL_PARAMS)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)

    target_names = [FERT_CLASS_LABELS[i + 1] for i in range(3)]

    print(f"  Test accuracy : {acc:.3f}")
    print(classification_report(y_test, y_pred, target_names=target_names, zero_division=0))

    joblib.dump(model,  PATHS["fert_model"])
    joblib.dump(scaler, PATHS["fert_scaler"])
    print(f"  Saved -> {PATHS['fert_model']}")
    return acc


if __name__ == "__main__":
    _ensure_model_dir()
    crop_acc = train_crop_model()
    fert_acc = train_fert_model()
    print("\n-- Summary -------------------------------------")
    print(f"  Crop model accuracy      : {crop_acc:.1%}")
    print(f"  Fertiliser model accuracy: {fert_acc:.1%}")
    print("  All models saved.\n")
