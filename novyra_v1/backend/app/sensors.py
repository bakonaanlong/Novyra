"""
sensors.py — Sensor input handling with validation.

Adapted for server-side use:
  - manual()'s interactive input() prompt doesn't make sense in a deployed
    API, so it has been removed. Use from_dict() to build a reading from a
    JSON request body instead.
  - get_location_from_ip() now reads the IPInfo key from an environment
    variable instead of asking for it interactively.
"""

from __future__ import annotations
import os
import random
from dataclasses import dataclass, field
from typing import Optional

from .config import SENSOR_RANGES


@dataclass
class SensorReading:
    pH:          float
    N:           float
    P:           float
    K:           float
    temperature: float
    humidity:    float
    pressure:    float
    moisture:    float
    location:    Optional[str] = None
    warnings:    list = field(default_factory=list)

    def as_dict(self) -> dict:
        return {
            "pH":          self.pH,
            "N":           self.N,
            "P":           self.P,
            "K":           self.K,
            "temperature": self.temperature,
            "humidity":    self.humidity,
            "pressure":    self.pressure,
            "moisture":    self.moisture,
        }


def _validate(values: dict) -> list:
    warnings = []
    for key, value in values.items():
        if key not in SENSOR_RANGES:
            continue
        lo, hi = SENSOR_RANGES[key]
        if not (lo <= value <= hi):
            warnings.append(
                f"{key} = {value} is outside the expected range [{lo}, {hi}]. Check your sensor."
            )
    return warnings


def simulate(location: Optional[str] = None) -> SensorReading:
    """Generate statistically plausible sensor readings for testing."""
    values = {
        "pH":          round(random.uniform(4.5, 8.5),   2),
        "N":           round(random.normalvariate(90,  40), 1),
        "P":           round(random.normalvariate(50,  25), 1),
        "K":           round(random.normalvariate(100, 40), 1),
        "temperature": round(random.uniform(20, 40),     1),
        "humidity":    round(random.uniform(30, 90),     1),
        "pressure":    round(random.uniform(98, 103),    1),
        "moisture":    round(random.uniform(20, 80),     1),
    }
    warnings = _validate(values)
    return SensorReading(**values, location=location, warnings=warnings)


def from_dict(data: dict, location: Optional[str] = None) -> SensorReading:
    """
    Build a SensorReading from a pre-built dict — this is what the API uses
    to turn an incoming JSON request body (or real hardware data posted by
    the Arduino/ESP32) into a validated reading.
    """
    required = {"pH", "N", "P", "K", "temperature", "humidity", "pressure", "moisture"}
    missing  = required - set(data.keys())
    if missing:
        raise ValueError(f"Missing sensor keys: {missing}")

    values = {k: float(data[k]) for k in required}
    warnings = _validate(values)
    return SensorReading(**values, location=location, warnings=warnings)


def get_location_from_ip(api_key: Optional[str] = None) -> Optional[str]:
    """
    Look up the city name from the machine's public IP.
    api_key falls back to the IPINFO_API_KEY environment variable.
    Returns None (instead of raising) if unavailable.
    """
    api_key = api_key or os.environ.get("IPINFO_API_KEY")
    if not api_key:
        return None
    try:
        import ipinfo
        handler = ipinfo.getHandler(api_key)
        details = handler.getDetails()
        return details.city
    except Exception:
        return None
