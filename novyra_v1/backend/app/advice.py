"""
advice.py — Turns raw sensor readings + model predictions into the same
result shape the frontend's AI screen expects (crop, alternatives, fertiliser
class, soil health, advice tips, risk warning).

This replaces the original NovyraApp.jsx behaviour of calling
https://api.anthropic.com/v1/messages directly from the browser with no
API key attached. That call could never have worked outside the Claude
artifact sandbox that injects credentials automatically — in a real
deployment it would fail with 401 every time. Two things were wrong with
the old approach even if a key had been attached client-side: API keys
must never live in frontend JS (anyone can read them from devtools), and
the prediction itself should come from the trained scikit-learn models in
predict.py, not be re-invented by an LLM from scratch each time.

This module is fully rule-based and works with zero external dependencies
or API keys. If ANTHROPIC_API_KEY is set in the deployment environment,
generate_advice() will optionally ask Claude (server-side, key never
exposed to the client) to phrase the actionable tips more naturally —
but the crop/fertiliser predictions themselves always come from the
trained models, never from the LLM.
"""

from __future__ import annotations
import os
import json
from typing import Optional

from .config import WEATHER_RULES, SENSOR_RANGES
from .sensors import SensorReading
from .predict import CropResult, FertResult


def interpret_weather(reading: SensorReading) -> str:
    r = WEATHER_RULES
    h = reading.humidity
    p = reading.pressure

    if h >= r["thunderstorm"]["humidity_min"] and p <= r["thunderstorm"]["pressure_max"]:
        return "High chance of a thunderstorm — postpone fertiliser application to avoid runoff loss."
    elif h >= r["rain"]["humidity_min"]:
        return "Rain is likely today."
    elif p <= r["wind"]["pressure_max"]:
        return "Strong winds headed your way — secure young seedlings and greenhouse structures."
    else:
        return ""


def _soil_health(reading: SensorReading) -> str:
    """Simple scoring: how many readings sit comfortably inside their range."""
    score = 0
    total = 0
    for key in ("pH", "N", "P", "K", "moisture"):
        lo, hi = SENSOR_RANGES[key]
        val = getattr(reading, key)
        span = hi - lo
        # "comfortable" = middle 60% of the valid range
        comfy_lo, comfy_hi = lo + span * 0.2, hi - span * 0.2
        total += 1
        if comfy_lo <= val <= comfy_hi:
            score += 1
    ratio = score / total if total else 0
    if ratio >= 0.7:
        return "Good"
    if ratio >= 0.4:
        return "Fair"
    return "Poor"


def _rule_based_tips(reading: SensorReading, crop: CropResult, fert: FertResult) -> list:
    tips = []
    if reading.moisture < 35:
        tips.append("Soil moisture is low — schedule irrigation within the next 24 hours.")
    elif reading.moisture > 75:
        tips.append("Soil moisture is high — hold off on irrigation to avoid waterlogging.")

    if fert.class_id == 1:
        tips.append("Apply a potassium-rich fertiliser to correct the deficiency.")
    elif fert.class_id == 2:
        tips.append("Apply a nitrogen-rich fertiliser; split into two applications for better uptake.")
    elif fert.class_id == 3:
        tips.append("Apply a phosphorus-rich fertiliser, ideally worked into the root zone.")

    if reading.pH < 5.5:
        tips.append("Soil is acidic — consider liming to raise pH toward the 6.0–7.0 range.")
    elif reading.pH > 7.5:
        tips.append("Soil is alkaline — organic matter or sulfur amendments can help lower pH.")

    if not tips:
        tips.append(f"Conditions favour {crop.crop} — maintain current irrigation and fertiliser schedule.")

    return tips[:3]


def _llm_enhance_tips(reading: SensorReading, crop: CropResult, fert: FertResult, fallback_tips: list) -> list:
    """
    Optional: rephrase tips more naturally using Claude, called server-side
    only (the API key never reaches the browser). Silently falls back to
    the rule-based tips on any error or if no key is configured.
    """
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        return fallback_tips

    try:
        import httpx
        prompt = (
            f"A farmer's sensors report pH {reading.pH}, N {reading.N}, P {reading.P}, "
            f"K {reading.K} mg/kg, temperature {reading.temperature}C, humidity {reading.humidity}%, "
            f"moisture {reading.moisture}%. The model recommends growing {crop.crop} and applying "
            f"fertiliser class {fert.class_id} ({fert.description}). "
            f"Rewrite these tips as up to 3 short, farmer-friendly bullet points (max 15 words each), "
            f"return ONLY a JSON array of strings, no markdown: {json.dumps(fallback_tips)}"
        )
        resp = httpx.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": "claude-sonnet-4-6",
                "max_tokens": 300,
                "messages": [{"role": "user", "content": prompt}],
            },
            timeout=8.0,
        )
        resp.raise_for_status()
        data = resp.json()
        text = data["content"][0]["text"]
        clean = text.replace("```json", "").replace("```", "").strip()
        parsed = json.loads(clean)
        if isinstance(parsed, list) and parsed:
            return parsed[:3]
    except Exception:
        pass
    return fallback_tips


def build_result(reading: SensorReading, crop: CropResult, fert: FertResult) -> dict:
    """Assemble the exact JSON shape NovyraApp.jsx's AI screen expects."""
    fallback_tips = _rule_based_tips(reading, crop, fert)
    tips = _llm_enhance_tips(reading, crop, fert, fallback_tips)

    return {
        "crop": crop.crop,
        "cropConf": round(crop.confidence * 100),
        "alternatives": [
            {"name": name, "conf": round(conf * 100)} for name, conf in crop.alternatives
        ],
        "fertClass": fert.class_id,
        "fertDesc": fert.description,
        "fertConf": round(fert.confidence * 100),
        "soilHealth": _soil_health(reading),
        "advice": tips,
        "warning": interpret_weather(reading),
        "sensorWarnings": reading.warnings,
    }
