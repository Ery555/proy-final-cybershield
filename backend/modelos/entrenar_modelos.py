from pathlib import Path
import joblib
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import LinearRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    mean_absolute_error,
    r2_score,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler

SEMILLA = 42
np.random.seed(SEMILLA)
torch.manual_seed(SEMILLA)

DIR_MODELOS = Path(__file__).resolve().parent
DIR_DATOS = DIR_MODELOS.parent / "datos"

NOMBRES_CLASES = ["Normal", "DDoS", "Brute Force", "Data Exfiltration"]


class ClasificadorIDS(nn.Module):
    """Perceptrón Multicapa (MLP) para clasificación multiclase de tráfico de red."""

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


def entrenar_regresion_lineal() -> None:
    """Entrena el modelo de Regresión Lineal para predecir tráfico esperado (RPS)."""
    print("=== [1/2] Entrenando Regresión Lineal (Línea Base Volumétrica) ===")
    df = pd.read_csv(DIR_DATOS / "linea_base_horaria.csv")

    columnas_entrada = ["hour", "is_weekend", "active_users"]
    X = df[columnas_entrada]
    y = df["rps"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=SEMILLA
    )

    modelo = LinearRegression()
    modelo.fit(X_train, y_train)

    y_pred = modelo.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    print(f"MAE en prueba: {mae:.2f} RPS | R² Score: {r2:.4f}")
    print(
        f"Ecuación aprendida: RPS = {modelo.intercept_:.2f} "
        f"+ ({modelo.coef_[0]:.2f} * hour) "
        f"+ ({modelo.coef_[1]:.2f} * is_weekend) "
        f"+ ({modelo.coef_[2]:.2f} * active_users)\n"
    )

    artefacto = {
        "model": modelo,
        "features": columnas_entrada,
        "mae": float(mae),
        "r2": float(r2),
    }
    joblib.dump(artefacto, DIR_MODELOS / "regresion_base.joblib")


def entrenar_red_neuronal(
    epocas: int = 25, batch_size: int = 64, tasa_aprendizaje: float = 1e-3
) -> None:
    """Entrena la Red Neuronal en PyTorch para detección de intrusiones (IDS)."""
    print("=== [2/2] Entrenando Red Neuronal PyTorch (Clasificador IDS) ===")
    df = pd.read_csv(DIR_DATOS / "flujos_red.csv")

    columnas_categoricas = ["src_zone", "dst_node"]
    columnas_numericas = [
        "hour",
        "dst_port",
        "duration_ms",
        "packets_per_sec",
        "bytes_sent",
        "bytes_received",
        "failed_logins",
    ]

    X = df[columnas_categoricas + columnas_numericas]
    y = df["label"].values

    X_train_raw, X_test_raw, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=SEMILLA
    )

    escalador = ColumnTransformer(
        transformers=[
            (
                "cat",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                columnas_categoricas,
            ),
            ("num", StandardScaler(), columnas_numericas),
        ]
    )

    X_train = escalador.fit_transform(X_train_raw)
    X_test = escalador.transform(X_test_raw)

    joblib.dump(escalador, DIR_MODELOS / "escalador.joblib")

    dataset_entrenamiento = TensorDataset(
        torch.tensor(X_train, dtype=torch.float32),
        torch.tensor(y_train, dtype=torch.long),
    )
    loader_entrenamiento = DataLoader(
        dataset_entrenamiento, batch_size=batch_size, shuffle=True
    )

    dimension_entrada = X_train.shape[1]
    modelo = ClasificadorIDS(
        input_dim=dimension_entrada, num_classes=len(NOMBRES_CLASES)
    )
    criterio = nn.CrossEntropyLoss()
    optimizador = optim.Adam(modelo.parameters(), lr=tasa_aprendizaje)

    for epoca in range(1, epocas + 1):
        modelo.train()
        perdida_acumulada = 0.0
        for lote_X, lote_y in loader_entrenamiento:
            optimizador.zero_grad()
            salidas = modelo(lote_X)
            perdida = criterio(salidas, lote_y)
            perdida.backward()
            optimizador.step()
            perdida_acumulada += perdida.item() * lote_X.size(0)

        if epoca % 5 == 0 or epoca == 1:
            perdida_media = perdida_acumulada / len(dataset_entrenamiento)
            print(f"Época {epoca:02d}/{epocas} - Loss: {perdida_media:.4f}")

    modelo.eval()
    with torch.no_grad():
        logits_prueba = modelo(torch.tensor(X_test, dtype=torch.float32))
        y_pred = torch.argmax(logits_prueba, dim=1).numpy()

    exactitud = accuracy_score(y_test, y_pred)
    print(f"\nExactitud (Accuracy) en prueba: {exactitud * 100:.2f}%")
    print(classification_report(y_test, y_pred, target_names=NOMBRES_CLASES))

    torch.save(
        {
            "model_state_dict": modelo.state_dict(),
            "input_dim": dimension_entrada,
            "class_names": NOMBRES_CLASES,
        },
        DIR_MODELOS / "red_neuronal_ids.pt",
    )
    print(f"Artefactos guardados exitosamente en {DIR_MODELOS}")


if __name__ == "__main__":
    entrenar_regresion_lineal()
    entrenar_red_neuronal()