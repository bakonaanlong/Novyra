"""
generate_sample_datasets.py — Creates placeholder Crop_Pred.csv and
FertPredictDataset.csv so the project trains and runs end-to-end out of
the box.

IMPORTANT: these are synthetically generated, not real agronomic data.
The original project's actual datasets were never uploaded, so this
script exists purely to unblock training/deployment. Replace the two
CSVs in this folder with your real datasets (same column names) and
re-run `python -m app.train` for accurate predictions. See README.md.
"""

import os
import random

random.seed(42)

HERE = os.path.dirname(os.path.abspath(__file__))

CROPS = [
    # name, N range, P range, K range, pH range
    ("Maize",    (60, 140), (30, 70),  (60, 140), (5.5, 7.5)),
    ("Rice",     (80, 160), (30, 60),  (30, 80),  (5.0, 6.5)),
    ("Cassava",  (20, 60),  (10, 30),  (40, 100), (5.5, 7.0)),
    ("Sorghum",  (40, 90),  (20, 50),  (30, 80),  (5.5, 7.5)),
    ("Millet",   (20, 50),  (10, 30),  (20, 60),  (5.0, 7.0)),
    ("Groundnut",(10, 40),  (20, 60),  (60, 120), (5.5, 7.0)),
    ("Cowpea",   (10, 30),  (20, 50),  (40, 90),  (5.5, 7.0)),
    ("Yam",      (30, 70),  (20, 50),  (80, 160), (5.5, 6.8)),
    ("Tomato",   (80, 150), (40, 90),  (100, 200),(6.0, 7.0)),
    ("Soybean",  (20, 60),  (30, 70),  (60, 130), (6.0, 7.0)),
]


def gen_crop_csv(path: str, n_per_class: int = 120):
    rows = ["N,P,K,pH,Crop"]
    for name, n_rng, p_rng, k_rng, ph_rng in CROPS:
        for _ in range(n_per_class):
            n = round(random.uniform(*n_rng), 1)
            p = round(random.uniform(*p_rng), 1)
            k = round(random.uniform(*k_rng), 1)
            ph = round(random.uniform(*ph_rng), 2)
            rows.append(f"{n},{p},{k},{ph},{name}")
    with open(path, "w") as f:
        f.write("\n".join(rows) + "\n")
    print(f"Wrote {len(rows)-1} rows -> {path}")


def gen_fert_csv(path: str, n_per_class: int = 200):
    # classes 2,3,4 map to fert classes 1 (low K),2(low N),3(low P) after
    # preprocess.py's remap; class 1 rows are intentionally absent/dropped
    # to match the original dataset's documented behaviour.
    rows = ["N,P,K,Ca,Mg,S,Lime,C,Moisture,class"]
    # class 2 -> low N (N should be small relative to P,K)
    for _ in range(n_per_class):
        n = round(random.uniform(5, 25), 1)
        p = round(random.uniform(30, 80), 1)
        k = round(random.uniform(60, 150), 1)
        extras = [round(random.uniform(1, 20), 1) for _ in range(6)]
        rows.append(f"{n},{p},{k}," + ",".join(map(str, extras)) + ",2")
    # class 3 -> low P
    for _ in range(n_per_class):
        n = round(random.uniform(60, 140), 1)
        p = round(random.uniform(5, 20), 1)
        k = round(random.uniform(60, 150), 1)
        extras = [round(random.uniform(1, 20), 1) for _ in range(6)]
        rows.append(f"{n},{p},{k}," + ",".join(map(str, extras)) + ",3")
    # class 4 -> low K
    for _ in range(n_per_class):
        n = round(random.uniform(60, 140), 1)
        p = round(random.uniform(30, 80), 1)
        k = round(random.uniform(5, 25), 1)
        extras = [round(random.uniform(1, 20), 1) for _ in range(6)]
        rows.append(f"{n},{p},{k}," + ",".join(map(str, extras)) + ",4")
    with open(path, "w") as f:
        f.write("\n".join(rows) + "\n")
    print(f"Wrote {len(rows)-1} rows -> {path}")


if __name__ == "__main__":
    gen_crop_csv(os.path.join(HERE, "Crop_Pred.csv"))
    gen_fert_csv(os.path.join(HERE, "FertPredictDataset.csv"))
