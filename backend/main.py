import random
from typing import Literal
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from backend.agente.agente_soc import AgenteSOCAutonomo

app = FastAPI(
    title="CyberShield SOC - API de Ciberdefensa Autónoma",
    description="Integración de Regresión Lineal, Redes Neuronales, Prolog y Agentes Inteligentes.",
    version="1.0.0",
)

# Permitir peticiones desde el frontend en React (Vite / CRA)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

agente = AgenteSOCAutonomo()


class FlujoRedEntrada(BaseModel):
    src_ip: str = Field(default="192.168.1.45", examples=["185.220.101.4"])
    src_zone: Literal["external", "dmz", "internal"] = "external"
    dst_node: Literal["web_server", "api_gateway", "auth_service", "db_server"] = "web_server"
    dst_port: int = Field(default=443, ge=1, le=65535)
    hour: int = Field(default=14, ge=0, le=23)
    is_weekend: int = Field(default=0, ge=0, le=1)
    active_users: int = Field(default=420, ge=1)
    observed_rps: float = Field(default=780.0, ge=0.0)
    duration_ms: float = Field(default=180.0, ge=0.1)
    packets_per_sec: float = Field(default=40.0, ge=0.1)
    bytes_sent: float = Field(default=1900.0, ge=0.0)
    bytes_received: float = Field(default=4800.0, ge=0.0)
    failed_logins: int = Field(default=0, ge=0)


class EscenarioSimulacion(BaseModel):
    tipo: Literal["normal", "ddos", "brute_force", "exfiltration"]
    hora: int = Field(default=14, ge=0, le=23)


@app.get("/")
def raiz():
    return {"servicio": "CyberShield SOC", "estado": "activo"}


@app.get("/api/estado")
def obtener_estado():
    return agente.obtener_estado()


@app.post("/api/analizar-flujo")
def analizar_flujo(flujo: FlujoRedEntrada):
    return agente.procesar_flujo(flujo.model_dump())


@app.post("/api/simular-escenario")
def simular_escenario(escenario: EscenarioSimulacion):
    """Genera un paquete representativo del escenario elegido y lo pasa al agente."""
    ip_aleatoria = f"{random.randint(45, 210)}.{random.randint(10, 250)}.{random.randint(1, 254)}.{random.randint(2, 250)}"

    if escenario.tipo == "normal":
        datos = {
            "src_ip": ip_aleatoria,
            "src_zone": "external",
            "dst_node": "web_server",
            "dst_port": 443,
            "hour": escenario.hora,
            "is_weekend": 0,
            "active_users": 450,
            "observed_rps": round(random.uniform(750.0, 920.0), 2),
            "duration_ms": round(random.uniform(140.0, 260.0), 2),
            "packets_per_sec": round(random.uniform(25.0, 50.0), 2),
            "bytes_sent": round(random.uniform(1400.0, 2300.0), 2),
            "bytes_received": round(random.uniform(3500.0, 6200.0), 2),
            "failed_logins": 0,
        }
    elif escenario.tipo == "ddos":
        datos = {
            "src_ip": ip_aleatoria,
            "src_zone": "external",
            "dst_node": "api_gateway",
            "dst_port": 443,
            "hour": escenario.hora,
            "is_weekend": 0,
            "active_users": 450,
            "observed_rps": round(random.uniform(2600.0, 4200.0), 2),
            "duration_ms": round(random.uniform(8.0, 35.0), 2),
            "packets_per_sec": round(random.uniform(1600.0, 2400.0), 2),
            "bytes_sent": round(random.uniform(38000.0, 56000.0), 2),
            "bytes_received": round(random.uniform(0.0, 90.0), 2),
            "failed_logins": 0,
        }
    elif escenario.tipo == "brute_force":
        datos = {
            "src_ip": ip_aleatoria,
            "src_zone": "external",
            "dst_node": "auth_service",
            "dst_port": 443,
            "hour": escenario.hora,
            "is_weekend": 0,
            "active_users": 450,
            "observed_rps": round(random.uniform(950.0, 1200.0), 2),
            "duration_ms": round(random.uniform(380.0, 600.0), 2),
            "packets_per_sec": round(random.uniform(120.0, 180.0), 2),
            "bytes_sent": round(random.uniform(2800.0, 3900.0), 2),
            "bytes_received": round(random.uniform(900.0, 1400.0), 2),
            "failed_logins": random.randint(9, 25),
        }
    else:  # exfiltration
        datos = {
            "src_ip": ip_aleatoria,
            "src_zone": "external",
            "dst_node": "db_server",
            "dst_port": 5432,
            "hour": escenario.hora,
            "is_weekend": 0,
            "active_users": 450,
            "observed_rps": round(random.uniform(1100.0, 1500.0), 2),
            "duration_ms": round(random.uniform(3500.0, 5200.0), 2),
            "packets_per_sec": round(random.uniform(180.0, 260.0), 2),
            "bytes_sent": round(random.uniform(700.0, 1200.0), 2),
            "bytes_received": round(random.uniform(150000.0, 240000.0), 2),
            "failed_logins": 1,
        }

    return agente.procesar_flujo(datos)


@app.post("/api/reiniciar")
def reiniciar_soc():
    return agente.reiniciar_estado()