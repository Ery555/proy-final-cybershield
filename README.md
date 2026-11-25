# 🛡️ CyberShield SOC — Sistema Autónomo de Ciberdefensa en Tiempo Real

**CyberShield SOC** es un prototipo de Centro de Operaciones de Seguridad (SOC) impulsado por **Inteligencia Artificial Híbrida (Neuro-Simbólica)**. El sistema monitoriza flujos de tráfico de red en tiempo real, detecta ciberataques (como *DDoS*, *Fuerza Bruta* y *Exfiltración de Datos*) y ejecuta acciones automáticas de mitigación sin intervención humana.

---

## 🧠 ¿Cómo funciona? (Integración del Temario de IA)

El proyecto combina cuatro pilares fundamentales de la Inteligencia Artificial trabajando en conjunto dentro de un flujo de decisión:

1. **Regresión Lineal (Línea Base Volumétrica):**
   * **Función:** Predice cuántas peticiones por segundo (`RPS`) son normales según la hora del día, si es fin de semana y la cantidad de usuarios activos.
   * **Uso en seguridad:** Si el tráfico real supera drásticamente la predicción lineal, el sistema levanta una alerta temprana de anomalía volumétrica.

2. **Redes Neuronales Artificiales — PyTorch (Clasificador IDS):**
   * **Función:** Un Perceptrón Multicapa (MLP) analiza las métricas técnicas de cada conexión (duración, paquetes por segundo, bytes enviados/recibidos, intentos fallidos de inicio de sesión, puertos y zonas).
   * **Uso en seguridad:** Clasifica el tráfico en una de cuatro categorías (`Normal`, `DDoS`, `Brute Force` o `Data Exfiltration`) entregando un porcentaje de confianza.

3. **Programación Lógica en Prolog (Auditoría Zero-Trust):**
   * **Función:** Una base de conocimientos en SWI-Prolog contiene las políticas arquitectónicas de la empresa y reglas estrictas de firewall (por ejemplo: *ninguna IP externa puede conectarse directamente a la base de datos*).
   * **Uso en seguridad:** Aporta **explicabilidad** y control determinista. Si un flujo viola una regla de seguridad, Prolog lo bloquea inmediatamente e indica el motivo exacto, sin importar lo que diga la red neuronal.

4. **Agente Inteligente Autónomo (Orquestador SOAR):**
   * **Función:** Es un agente reactivo basado en estado interno y políticas. Percibe los flujos entrantes, consulta a la Regresión Lineal, a la Red Neuronal y a Prolog, y decide la contramedida óptima:
     * `ALLOW`: Permite el paso del tráfico normal.
     * `RATE_LIMIT`: Limita la velocidad de conexión ante picos sospechosos.
     * `BLOCK_IP`: Bloquea en el firewall la dirección IP atacante.
     * `BLOCK_AND_ISOLATE`: Bloquea la IP y pone en modo protegido los servidores críticos (como la base de datos).

---

## 📁 Estructura del Proyecto

```text
cybershield-soc/
├── backend/
│   ├── datos/
│   │   ├── generar_dataset.py        # Generador de tráfico sintético y línea base
│   │   ├── linea_base_horaria.csv    # Dataset para Regresión Lineal
│   │   └── flujos_red.csv            # Dataset etiquetado para la Red Neuronal
│   ├── modelos/
│   │   ├── entrenar_modelos.py       # Entrenamiento de Regresión Lineal y MLP
│   │   ├── regresion_base.joblib     # Modelo de Regresión Lineal serializado
│   │   ├── red_neuronal_ids.pt       # Pesos de la Red Neuronal en PyTorch
│   │   └── escalador.joblib          # Preprocesador de variables numéricas/categóricas
│   ├── base_conocimiento/
│   │   ├── politicas_firewall.pl     # Hechos y reglas Zero-Trust en SWI-Prolog
│   │   └── motor_prolog.py           # Puente de consulta entre Python y Prolog
│   ├── agente/
│   │   └── agente_soc.py             # Ciclo Percepción -> Razonamiento -> Acción
│   ├── main.py                       # API REST construida con FastAPI
│   └── requirements.txt              # Dependencias de Python
└── README.md
```

---

## ⚙️ Requisitos Previos e Instalación

### 1. Instalar SWI-Prolog (Sistema Operativo)
El puente `pyswip` requiere el binario de SWI-Prolog instalado en el sistema. En Ubuntu / WSL ejecuta:
```bash
sudo apt update && sudo apt install -y swi-prolog
```

### 2. Crear el Entorno Virtual con Miniconda
Desde la carpeta raíz del proyecto, crea y activa el entorno con Python 3.11:
```bash
conda create -n cybershield-soc python=3.11 -y
conda activate cybershield-soc
```

### 3. Instalar Dependencias de Python
Si tu equipo no cuenta con tarjeta gráfica dedicada NVIDIA, instala primero la versión CPU de PyTorch para ahorrar espacio y luego el resto de dependencias:
```bash
pip install --upgrade pip
pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install -r backend/requirements.txt
```

---

## 🚀 Guía de Ejecución

Ejecuta los siguientes comandos en orden desde la carpeta raíz del proyecto (`cybershield-soc/`):

### Paso 1: Generar los Datasets Sintéticos
Crea los archivos `linea_base_horaria.csv` y `flujos_red.csv` con patrones de tráfico normal y ciberataques:
```bash
python backend/datos/generar_dataset.py
```

### Paso 2: Entrenar los Modelos de IA
Entrena la Regresión Lineal y la Red Neuronal, guardando los artefactos listos para inferencia en `backend/modelos/`:
```bash
python backend/modelos/entrenar_modelos.py
```

### Paso 3: Iniciar el Servidor Backend (FastAPI)
Levanta la API REST en modo desarrollo:
```bash
uvicorn backend.main:app --reload
```

### Paso 4: Probar el Sistema
Abre tu navegador e ingresa a la documentación interactiva autogenerada:
* **Swagger UI:** `http://127.0.0.1:8000/docs`

Desde allí puedes utilizar el endpoint **`POST /api/simular-escenario`** enviando `"normal"`, `"ddos"`, `"brute_force"` o `"exfiltration"` para observar en tiempo real el análisis de cada modelo y la decisión tomada por el agente inteligente.