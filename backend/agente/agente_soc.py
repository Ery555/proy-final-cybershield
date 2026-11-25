from pathlib import Path
import uuid
import joblib
import pandas as pd
import torch
import torch.nn as nn

from backend.base_conocimiento.motor_prolog import MotorProlog


class ClasificadorIDS(nn.Module):
    """Arquitectura MLP idéntica a la entrenada en entrenar_modelos.py."""

    def __init__(self, input_dim: int, num_classes: int = 4):
        super().__init__()
        self.network = nn.Sequential(
            nn.Linear(input_dim, 64),
            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(32, num_classes),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.network(x)


class AgenteSOCAutonomo:
    """Agente inteligente basado en utilidad y políticas para ciberdefensa."""

    def __init__(self):
        base_backend = Path(__file__).resolve().parent.parent
        dir_modelos = base_backend / "modelos"

        # 1. Cargar modelo de Regresión Lineal
        artefacto_reg = joblib.load(dir_modelos / "regresion_base.joblib")
        self.modelo_regresion = artefacto_reg["model"]
        self.features_regresion = artefacto_reg["features"]

        # 2. Cargar preprocesador y Red Neuronal PyTorch
        self.escalador = joblib.load(dir_modelos / "escalador.joblib")
        checkpoint = torch.load(
            dir_modelos / "red_neuronal_ids.pt", map_location=torch.device("cpu")
        )
        self.clases = checkpoint["class_names"]
        self.red_neuronal = ClasificadorIDS(
            input_dim=checkpoint["input_dim"], num_classes=len(self.clases)
        )
        self.red_neuronal.load_state_dict(checkpoint["model_state_dict"])
        self.red_neuronal.eval()

        # 3. Inicializar Motor Lógico Prolog
        self.motor_prolog = MotorProlog("politicas_firewall.pl")

        # 4. Estado interno del agente (memoria operativa)
        self.reiniciar_estado()

    def reiniciar_estado(self) -> dict:
        """Restaura la topología a estado saludable y limpia bloqueos."""
        self.ips_bloqueadas: set[str] = set()
        self.estado_nodos: dict[str, str] = {
            "web_server": "healthy",
            "api_gateway": "healthy",
            "auth_service": "healthy",
            "db_server": "healthy",
        }
        self.metricas = {
            "total_analizados": 0,
            "permitidos": 0,
            "limitados": 0,
            "bloqueados": 0,
        }
        return self.obtener_estado()

    def obtener_estado(self) -> dict:
        """Devuelve una instantánea del estado actual del SOC."""
        return {
            "node_status": dict(self.estado_nodos),
            "blocked_ips": sorted(list(self.ips_bloqueadas)),
            "metrics": dict(self.metricas),
        }

    def _evaluar_regresion(
        self, hour: int, is_weekend: int, active_users: int, observed_rps: float
    ) -> dict:
        """Predice RPS esperados según la hora y detecta anomalías volumétricas."""
        df_entrada = pd.DataFrame(
            [
                {
                    "hour": hour,
                    "is_weekend": is_weekend,
                    "active_users": active_users,
                }
            ]
        )[self.features_regresion]

        expected_rps = float(self.modelo_regresion.predict(df_entrada)[0])
        expected_rps = max(10.0, expected_rps)
        ratio = round(observed_rps / expected_rps, 2)

        return {
            "expected_rps": round(expected_rps, 2),
            "volumetric_anomaly": bool(ratio > 1.65),
            "deviation_ratio": ratio,
        }

    def _evaluar_red_neuronal(self, flujo: dict) -> dict:
        """Clasifica el flujo de red con el Perceptrón Multicapa."""
        columnas = [
            "src_zone",
            "dst_node",
            "hour",
            "dst_port",
            "duration_ms",
            "packets_per_sec",
            "bytes_sent",
            "bytes_received",
            "failed_logins",
        ]
        df_flujo = pd.DataFrame([{col: flujo[col] for col in columnas}])
        X_proc = self.escalador.transform(df_flujo)
        tensor_x = torch.tensor(X_proc, dtype=torch.float32)

        with torch.no_grad():
            logits = self.red_neuronal(tensor_x)
            probs = torch.softmax(logits, dim=1).numpy()[0]

        idx_pred = int(probs.argmax())
        clase_predicha = self.clases[idx_pred]
        confianza = round(float(probs[idx_pred]), 4)

        probabilidades = {
            self.clases[i]: round(float(probs[i]), 4)
            for i in range(len(self.clases))
        }

        return {
            "predicted_class": clase_predicha,
            "confidence": confianza,
            "probabilities": probabilidades,
        }

    def procesar_flujo(self, flujo: dict) -> dict:
        """Ejecuta el ciclo completo de percepción, razonamiento y acción."""
        self.metricas["total_analizados"] += 1
        flow_id = f"FLW-{uuid.uuid4().hex[:6].upper()}"
        src_ip = flujo["src_ip"]
        dst_node = flujo["dst_node"]

        # Razonamiento 1: Regresión Lineal (línea base de tráfico)
        res_reg = self._evaluar_regresion(
            hour=flujo["hour"],
            is_weekend=flujo.get("is_weekend", 0),
            active_users=flujo.get("active_users", 350),
            observed_rps=flujo["observed_rps"],
        )

        # Razonamiento 2: Red Neuronal (clasificación de patrón de ataque)
        res_nn = self._evaluar_red_neuronal(flujo)

        # Razonamiento 3: Prolog (auditoría lógica Zero-Trust)
        res_prolog = self.motor_prolog.auditar_flujo(
            src_zone=flujo["src_zone"],
            dst_node=dst_node,
            dst_port=flujo["dst_port"],
            failed_logins=flujo["failed_logins"],
            bytes_received=flujo["bytes_received"],
            packets_per_sec=flujo["packets_per_sec"],
        )

        # Toma de decisión y ejecución de acción del Agente
        clase_nn = res_nn["predicted_class"]
        conf_nn = res_nn["confidence"]
        viola_prolog = res_prolog["policy_violated"]

        if src_ip in self.ips_bloqueadas:
            accion = "DROP_BLACKLISTED"
            self.metricas["bloqueados"] += 1
        elif viola_prolog and (
            clase_nn == "Data Exfiltration" or dst_node == "db_server"
        ):
            accion = "BLOCK_AND_ISOLATE"
            self.ips_bloqueadas.add(src_ip)
            if dst_node in self.estado_nodos:
                self.estado_nodos[dst_node] = "protected"
            self.metricas["bloqueados"] += 1
        elif viola_prolog or (clase_nn != "Normal" and conf_nn >= 0.70):
            accion = "BLOCK_IP"
            self.ips_bloqueadas.add(src_ip)
            if dst_node in self.estado_nodos and self.estado_nodos[dst_node] != "protected":
                self.estado_nodos[dst_node] = "under_mitigation"
            self.metricas["bloqueados"] += 1
        elif res_reg["volumetric_anomaly"] or (clase_nn != "Normal" and conf_nn >= 0.45):
            accion = "RATE_LIMIT"
            if dst_node in self.estado_nodos and self.estado_nodos[dst_node] == "healthy":
                self.estado_nodos[dst_node] = "rate_limited"
            self.metricas["limitados"] += 1
        else:
            accion = "ALLOW"
            if dst_node in self.estado_nodos and self.estado_nodos[dst_node] in (
                "rate_limited",
                "under_mitigation",
            ):
                self.estado_nodos[dst_node] = "healthy"
            self.metricas["permitidos"] += 1

        return {
            "flow_id": flow_id,
            "telemetry": {
                "src_ip": src_ip,
                "src_zone": flujo["src_zone"],
                "dst_node": dst_node,
                "dst_port": flujo["dst_port"],
                "observed_rps": flujo["observed_rps"],
            },
            "linear_regression": res_reg,
            "neural_network": res_nn,
            "prolog_audit": res_prolog,
            "agent_decision": {
                "action": accion,
                "target": src_ip,
                "node_status": dict(self.estado_nodos),
                "metrics": dict(self.metricas),
            },
        }