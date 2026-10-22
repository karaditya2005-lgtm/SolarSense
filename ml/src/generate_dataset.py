"""
SolarSense Benchmark Dataset Generator
Generates a realistic meteorological and photovoltaic generation time series
anchored on real physical solar geometry and empirical cell temperature models.
"""

import math
import os
import numpy as np
import pandas as pd
try:
    from .features import calculate_solar_position
except ImportError:
    from features import calculate_solar_position

def generate_benchmark_dataset(
    output_path: str = "data/raw/solar_generation_dataset.csv",
    latitude: float = 28.6139,
    longitude: float = 77.2090,
    capacity_kw: float = 50.0,
    seed: int = 42
):
    np.random.seed(seed)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    # 1 Full Year hourly resolution
    date_range = pd.date_range(start="2024-01-01 00:00:00", end="2024-12-31 23:00:00", freq="h", tz="UTC")
    n_hours = len(date_range)

    records = []

    # Seasonal baseline temperatures for Delhi (°C)
    monthly_temps = {
        1: 14.5, 2: 18.2, 3: 24.1, 4: 31.0, 5: 35.5, 6: 34.0,
        7: 31.2, 8: 30.5, 9: 29.8, 10: 26.2, 11: 20.5, 12: 15.5
    }

    # Temperature coefficient for crystalline Silicon: -0.41 % / °C
    temp_coeff = -0.0041
    noct = 45.0  # Nominal Operating Cell Temperature (°C)
    inverter_eff = 0.96
    dc_loss_factor = 0.88  # Soiling, cabling, mismatch

    # Generate persistent weather system states for cloud cover
    cloud_state = 0.2
    for dt in date_range:
        month = dt.month
        hour = dt.hour + dt.minute / 60.0
        day = dt.dayofyear

        # Compute astronomical solar altitude angle
        elev = calculate_solar_position(dt, latitude, longitude)

        # Autoregressive cloud cover evolution
        cloud_innovation = np.random.normal(0, 0.12)
        # Higher cloud probability during monsoon (July-August)
        cloud_bias = 0.55 if month in [7, 8] else 0.20
        cloud_state = np.clip(0.85 * cloud_state + 0.15 * cloud_bias + cloud_innovation, 0.0, 1.0)
        cloud_pct = round(cloud_state * 100.0, 1)

        # Ambient temperature model: seasonal mean + diurnal cycle peaking at 14:30
        t_base = monthly_temps[month]
        diurnal_t = 6.5 * math.sin(math.radians((hour - 8.5) * 15.0))
        t_amb = round(t_base + diurnal_t + np.random.normal(0, 1.2), 1)

        # Relative humidity model: inversely correlated with temperature
        rel_hum = round(np.clip(70.0 - 1.2 * (t_amb - 20.0) + (20.0 if month in [7, 8] else 0.0) + np.random.normal(0, 4.0), 15.0, 98.0), 1)

        # Wind speed model (m/s)
        wind_speed = round(np.clip(2.5 + 1.2 * math.sin(math.radians(hour * 15.0)) + np.random.exponential(1.2), 0.2, 18.0), 1)

        if elev <= 0.0:
            # Nighttime physical guarantee
            ghi = 0.0
            dni = 0.0
            dhi = 0.0
            ac_power = 0.0
        else:
            # Clear sky calculation
            # Extraterrestrial radiation
            i0 = 1367.0 * (1.0 + 0.033 * math.cos(2.0 * math.pi * day / 365.25))
            sin_elev = math.sin(math.radians(elev))
            air_mass = 1.0 / (sin_elev + 0.50572 * ((elev + 6.07995) ** -1.6364))

            # Transmittance with cloud attenuation
            k_clear = 0.7 ** (air_mass ** 0.678)
            cloud_transmittance = 1.0 - 0.75 * (cloud_state ** 3.2)
            ghi = round(np.clip(i0 * sin_elev * k_clear * cloud_transmittance + np.random.normal(0, 5.0), 0.0, 1250.0), 1)

            # DNI / DHI partitioning
            if ghi > 5.0:
                dni_clear = i0 * (0.7 ** (air_mass ** 0.678))
                dni = round(np.clip(dni_clear * (1.0 - cloud_state ** 1.8), 0.0, 1050.0), 1)
                dhi = round(np.clip(ghi - dni * sin_elev, 0.0, ghi), 1)
            else:
                dni = 0.0
                dhi = ghi

            # PV Power Output Calculation
            if ghi > 1.0:
                # Cell temperature model (King / PVWatts)
                t_cell = t_amb + (ghi / 800.0) * (noct - 20.0) * (1.0 - 0.05 * wind_speed)
                # Temperature derating
                temp_derating = 1.0 + temp_coeff * (t_cell - 25.0)

                # DC power: capacity * (GHI / 1000) * losses * temp_derating
                p_dc = capacity_kw * (ghi / 1000.0) * dc_loss_factor * temp_derating
                # Inverter AC conversion with inverter clipping at 46.5 kW
                p_ac = min(46.5, max(0.0, p_dc * inverter_eff))
                ac_power = round(p_ac, 2)
            else:
                ac_power = 0.0

        cf = round(ac_power / capacity_kw, 4)

        records.append({
            "timestamp": dt.isoformat(),
            "latitude": latitude,
            "longitude": longitude,
            "ghiWm2": ghi,
            "dniWm2": dni,
            "dhiWm2": dhi,
            "temperatureC": t_amb,
            "cloudCoverPct": cloud_pct,
            "humidityPct": rel_hum,
            "windSpeedMs": wind_speed,
            "solarElevationDeg": round(elev, 2),
            "capacityKw": capacity_kw,
            "acPowerKw": ac_power,
            "capacityFactor": cf,
            "source": "solar_benchmark_delhi_50kw"
        })

    df = pd.DataFrame(records)
    df.to_csv(output_path, index=False)
    print(f"Generated {len(df)} hourly benchmark records saved to {output_path}")
    return df

if __name__ == "__main__":
    generate_benchmark_dataset()
