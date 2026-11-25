from pathlib import Path
import numpy as np
import pandas as pd

np.random.seed(42)
DIR_DATOS = Path(__file__).resolve().parent


def generar_linea_base_horaria(n_dias: int = 60) -> pd.DataFrame:
    """Genera el histórico horario para entrenar el modelo de Regresión Lineal."""
    registros = []
    for dia in range(n_dias):
        es_fin_semana = 1 if (dia % 7) in (5, 6) else 0
        for hora in range(24):
            # Curva gaussiana de actividad laboral (pico alrededor de las 14:00)
            factor_actividad = np.exp(-0.5 * ((hora - 14) / 4.5) ** 2)
            usuarios_activos = int(
                np.clip(
                    np.random.normal(
                        loc=120
                        + 680 * factor_actividad * (0.6 if es_fin_semana else 1.0),
                        scale=35,
                    ),
                    20,
                    1000,
                )
            )
            # Relación lineal base: ~1.85 peticiones/seg por usuario + tráfico base
            rps_esperado = (
                45.0
                + 1.85 * usuarios_activos
                - 18.0 * es_fin_semana
                + np.random.normal(0, 22.0)
            )
            registros.append(
                {
                    "hour": hora,
                    "is_weekend": es_fin_semana,
                    "active_users": usuarios_activos,
                    "rps": round(max(10.0, rps_esperado), 2),
                }
            )
    return pd.DataFrame(registros)


def generar_flujos_red(n_muestras: int = 8000) -> pd.DataFrame:
    """Genera flujos de red etiquetados para la Red Neuronal y auditoría Prolog."""
    # Distribución: 55% Normal, 18% DDoS, 15% Brute Force, 12% Data Exfiltration
    etiquetas = np.random.choice(
        [0, 1, 2, 3], size=n_muestras, p=[0.55, 0.18, 0.15, 0.12]
    )
    filas = []

    for etiqueta in etiquetas:
        hora = int(np.random.randint(0, 24))

        if etiqueta == 0:  # Tráfico Normal
            src_zone = np.random.choice(
                ["external", "dmz", "internal"], p=[0.6, 0.25, 0.15]
            )
            dst_node = (
                "db_server"
                if src_zone == "internal"
                else np.random.choice(["web_server", "api_gateway"])
            )
            dst_port = (
                5432 if dst_node == "db_server" else int(np.random.choice([80, 443]))
            )
            duration_ms = np.random.lognormal(mean=5.2, sigma=0.6)
            packets_per_sec = np.random.normal(35, 12)
            bytes_sent = np.random.normal(1800, 600)
            bytes_received = np.random.normal(4500, 1500)
            failed_logins = int(np.random.choice([0, 1], p=[0.92, 0.08]))

        elif etiqueta == 1:  # DDoS (ráfagas cortas de altísima frecuencia)
            src_zone = "external"
            dst_node = np.random.choice(["web_server", "api_gateway"])
            dst_port = int(np.random.choice([80, 443]))
            duration_ms = np.random.uniform(5, 60)
            packets_per_sec = np.random.normal(1850, 350)
            bytes_sent = np.random.normal(45000, 9000)
            bytes_received = np.random.uniform(0, 120)
            failed_logins = 0

        elif etiqueta == 2:  # Fuerza Bruta (múltiples fallos de autenticación)
            src_zone = np.random.choice(["external", "dmz"], p=[0.85, 0.15])
            dst_node = "auth_service"
            dst_port = int(np.random.choice([22, 443]))
            duration_ms = np.random.normal(450, 120)
            packets_per_sec = np.random.normal(140, 30)
            bytes_sent = np.random.normal(3200, 500)
            bytes_received = np.random.normal(1100, 300)
            failed_logins = int(np.random.randint(6, 35))

        else:  # etiqueta == 3: Exfiltración de Datos (extracción masiva desde DB)
            src_zone = np.random.choice(
                ["dmz", "internal", "external"], p=[0.5, 0.35, 0.15]
            )
            dst_node = "db_server"
            dst_port = 5432
            duration_ms = np.random.normal(4200, 900)
            packets_per_sec = np.random.normal(210, 45)
            bytes_sent = np.random.normal(950, 250)
            bytes_received = np.random.normal(185000, 35000)
            failed_logins = int(np.random.choice([0, 1, 2], p=[0.7, 0.2, 0.1]))

        filas.append(
            {
                "hour": hora,
                "src_zone": src_zone,
                "dst_node": dst_node,
                "dst_port": dst_port,
                "duration_ms": round(max(1.0, duration_ms), 2),
                "packets_per_sec": round(max(1.0, packets_per_sec), 2),
                "bytes_sent": round(max(40.0, bytes_sent), 2),
                "bytes_received": round(max(0.0, bytes_received), 2),
                "failed_logins": failed_logins,
                "label": int(etiqueta),
            }
        )

    return pd.DataFrame(filas)


if __name__ == "__main__":
    df_linea_base = generar_linea_base_horaria()
    df_flujos = generar_flujos_red()

    ruta_base = DIR_DATOS / "linea_base_horaria.csv"
    ruta_flujos = DIR_DATOS / "flujos_red.csv"

    df_linea_base.to_csv(ruta_base, index=False)
    df_flujos.to_csv(ruta_flujos, index=False)

    print(f"Generado {ruta_base.name}: {len(df_linea_base)} filas")
    print(f"Generado {ruta_flujos.name}: {len(df_flujos)} filas")