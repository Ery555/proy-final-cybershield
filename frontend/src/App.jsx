import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  ChevronDown,
  ChevronUp,
  BrainCircuit,
  BarChart3,
} from 'lucide-react';
import TopologiaRed from './components/TopologiaRed';
import GraficoTrafico from './components/GraficoTrafico';
import PanelSimulador from './components/PanelSimulador';
import BitacoraAgente, { PanelExplicabilidad } from './components/BitacoraAgente';

const API_URL = 'http://127.0.0.1:8000';
const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function App() {
  const [hora, setHora] = useState(14);
  const [cargando, setCargando] = useState(false);
  const [estadoRafaga, setEstadoRafaga] = useState(null);
  const [errorApi, setErrorApi] = useState(null);
  const [autoPiloto, setAutoPiloto] = useState(false);
  const [mostrarGuia, setMostrarGuia] = useState(false);
  const [pestanaActiva, setPestanaActiva] = useState('xai');

  const [estadoNodos, setEstadoNodos] = useState({
    web_server: 'healthy',
    api_gateway: 'healthy',
    auth_service: 'healthy',
    db_server: 'healthy',
  });
  const [ipsBloqueadas, setIpsBloqueadas] = useState([]);
  const [metricas, setMetricas] = useState({
    total_analizados: 0,
    permitidos: 0,
    limitados: 0,
    bloqueados: 0,
  });

  const [ultimoFlujo, setUltimoFlujo] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [serieTrafico, setSerieTrafico] = useState([]);

  const cargarEstadoInicial = useCallback(async () => {
    try {
      const resp = await fetch(`${API_URL}/api/estado`);
      if (!resp.ok) throw new Error('Error consultando estado');
      const data = await resp.json();
      setEstadoNodos(data.node_status);
      setIpsBloqueadas(data.blocked_ips);
      setMetricas(data.metrics);
      setErrorApi(null);
    } catch {
      setErrorApi('No se pudo conectar con FastAPI en http://127.0.0.1:8000. Verifica que uvicorn esté corriendo.');
    }
  }, []);

  useEffect(() => {
    cargarEstadoInicial();
  }, [cargarEstadoInicial]);

  const ejecutarSimulacion = useCallback(
    async (tipo, cantidad = 1) => {
      setCargando(true);
      if (cantidad > 1) {
        setEstadoRafaga({ actual: 1, total: cantidad });
      }

      try {
        for (let i = 0; i < cantidad; i++) {
          if (cantidad > 1) {
            setEstadoRafaga({ actual: i + 1, total: cantidad });
          }

          const resp = await fetch(`${API_URL}/api/simular-escenario`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tipo, hora }),
          });
          if (!resp.ok) throw new Error('Error en la simulación');
          const resultado = await resp.json();

          setErrorApi(null);
          setUltimoFlujo(resultado);
          setEstadoNodos(resultado.agent_decision.node_status);
          setMetricas(resultado.agent_decision.metrics);

          if (['BLOCK_IP', 'BLOCK_AND_ISOLATE'].includes(resultado.agent_decision.action)) {
            setIpsBloqueadas((prev) =>
              prev.includes(resultado.agent_decision.target)
                ? prev
                : [resultado.agent_decision.target, ...prev]
            );
          }

          setHistorial((prev) => [resultado, ...prev].slice(0, 20));
          setSerieTrafico((prev) =>
            [
              ...prev,
              {
                id: resultado.flow_id.replace('FLW-', ''),
                observado: resultado.telemetry.observed_rps,
                esperado: resultado.linear_regression.expected_rps,
                anomalia: resultado.linear_regression.volumetric_anomaly,
              },
            ].slice(-14)
          );

          // Pausa breve entre paquetes de una oleada para apreciar la animación en vivo
          if (i < cantidad - 1) {
            await esperar(260);
          }
        }
      } catch {
        setErrorApi('Error de conexión con el servidor backend.');
      } finally {
        setCargando(false);
        setEstadoRafaga(null);
      }
    },
    [hora]
  );

  useEffect(() => {
    if (!autoPiloto) return;
    const intervalo = setInterval(() => {
      if (!cargando) {
        ejecutarSimulacion('normal', 1);
      }
    }, 2500);
    return () => clearInterval(intervalo);
  }, [autoPiloto, cargando, ejecutarSimulacion]);

  const reiniciarSOC = async () => {
    setAutoPiloto(false);
    setCargando(true);
    setEstadoRafaga(null);
    try {
      const resp = await fetch(`${API_URL}/api/reiniciar`, { method: 'POST' });
      const data = await resp.json();
      setEstadoNodos(data.node_status);
      setIpsBloqueadas(data.blocked_ips);
      setMetricas(data.metrics);
      setUltimoFlujo(null);
      setHistorial([]);
      setSerieTrafico([]);
      setErrorApi(null);
    } catch {
      setErrorApi('No se pudo reiniciar el estado del SOC.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-200 text-slate-900 pb-10">
      {/* Cabecera Oscura de Alto Contraste */}
      <header className="bg-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-indigo-500 text-white shadow-sm">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white">
                  CyberShield SOC — Defensa Autónoma en Tiempo Real
                </h1>
                <p className="text-xs text-slate-300 mt-0.5">
                  Regresión Lineal • Red Neuronal PyTorch • Base de Conocimiento SWI-Prolog • Agente Inteligente
                </p>
              </div>
            </div>

            <button
              onClick={() => setMostrarGuia(!mostrarGuia)}
              className="flex items-center gap-1.5 self-start lg:self-auto text-xs font-semibold px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 transition cursor-pointer"
            >
              <Info className="w-4 h-4 text-indigo-400" />
              {mostrarGuia ? 'Ocultar arquitectura' : '¿Cómo funciona?'}
              {mostrarGuia ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {mostrarGuia && (
            <div className="mt-5 pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  paso: '1. Regresión Lineal',
                  desc: 'Calcula el tráfico normal (RPS) esperado según la hora del día para detectar inundaciones DDoS.',
                },
                {
                  paso: '2. Red Neuronal MLP',
                  desc: 'Clasifica el patrón del flujo entre Normal, DDoS, Fuerza Bruta o Exfiltración de Datos.',
                },
                {
                  paso: '3. SWI-Prolog',
                  desc: 'Verifica reglas deterministas Zero-Trust (ej. prohibir acceso externo directo al puerto :5432).',
                },
                {
                  paso: '4. Agente Inteligente',
                  desc: 'Combina las 3 señales y aplica la contramedida: Permitir, Limitar o Bloquear/Aislar.',
                },
              ].map((item) => (
                <div key={item.paso} className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                  <div className="text-xs font-bold text-indigo-300 mb-1">{item.paso}</div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Contenedor Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Tarjetas KPI */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-300 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-sky-100 text-sky-700">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 block">Flujos Analizados</span>
              <span className="text-2xl font-bold font-mono text-slate-900">{metricas.total_analizados}</span>
            </div>
          </div>

          <div className="bg-white border border-slate-300 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 block">Tráfico Permitido</span>
              <span className="text-2xl font-bold font-mono text-emerald-700">{metricas.permitidos}</span>
            </div>
          </div>

          <div className="bg-white border border-slate-300 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-amber-100 text-amber-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 block">Limitados (Rate-Limit)</span>
              <span className="text-2xl font-bold font-mono text-amber-700">{metricas.limitados}</span>
            </div>
          </div>

          <div className="bg-white border border-slate-300 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-rose-100 text-rose-700">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 block">Amenazas Bloqueadas</span>
              <span className="text-2xl font-bold font-mono text-rose-700">{metricas.bloqueados}</span>
            </div>
          </div>
        </section>

        {errorApi && (
          <div className="p-4 rounded-xl bg-rose-100 border border-rose-300 text-rose-900 text-xs font-bold">
            {errorApi}
          </div>
        )}

        {/* Zona Operativa en Ancho Completo: Simulador Arriba + Mapa de Red Abajo */}
        <section className="space-y-6">
          <PanelSimulador
            hora={hora}
            setHora={setHora}
            onSimular={ejecutarSimulacion}
            onReiniciar={reiniciarSOC}
            cargando={cargando}
            estadoRafaga={estadoRafaga}
            autoPiloto={autoPiloto}
            setAutoPiloto={setAutoPiloto}
          />

          <TopologiaRed
            estadoNodos={estadoNodos}
            ultimoFlujo={ultimoFlujo}
            estadoRafaga={estadoRafaga}
          />
        </section>

        {/* Zona de Análisis con Pestañas */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-300 pb-3">
            <button
              onClick={() => setPestanaActiva('xai')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                pestanaActiva === 'xai'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
              }`}
            >
              <BrainCircuit className="w-4 h-4" />
              Razonamiento de IA (XAI)
            </button>

            <button
              onClick={() => setPestanaActiva('metricas')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                pestanaActiva === 'metricas'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Gráfica Volumétrica y Bitácora
              {historial.length > 0 && (
                <span
                  className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${
                    pestanaActiva === 'metricas' ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-800'
                  }`}
                >
                  {historial.length}
                </span>
              )}
            </button>
          </div>

          {pestanaActiva === 'xai' ? (
            <PanelExplicabilidad ultimoFlujo={ultimoFlujo} />
          ) : (
            <div className="space-y-6">
              <GraficoTrafico serieTrafico={serieTrafico} />
              <BitacoraAgente historial={historial} ipsBloqueadas={ipsBloqueadas} />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}