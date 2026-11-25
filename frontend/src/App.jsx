import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Activity, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import TopologiaRed from './components/TopologiaRed';
import GraficoTrafico from './components/GraficoTrafico';
import PanelSimulador from './components/PanelSimulador';
import BitacoraAgente from './components/BitacoraAgente';

const API_URL = 'http://127.0.0.1:8000';

export default function App() {
  const [hora, setHora] = useState(14);
  const [cargando, setCargando] = useState(false);
  const [errorApi, setErrorApi] = useState(null);
  const [autoPiloto, setAutoPiloto] = useState(false);

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
    async (tipo) => {
      setCargando(true);
      try {
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

        setHistorial((prev) => [resultado, ...prev].slice(0, 15));
        setSerieTrafico((prev) =>
          [
            ...prev,
            {
              id: resultado.flow_id.replace('FLW-', ''),
              observado: resultado.telemetry.observed_rps,
              esperado: resultado.linear_regression.expected_rps,
            },
          ].slice(-12)
        );
      } catch {
        setErrorApi('Error de conexión con el servidor backend.');
      } finally {
        setCargando(false);
      }
    },
    [hora]
  );

  // Temporizador para tráfico normal en segundo plano
  useEffect(() => {
    if (!autoPiloto) return;
    const intervalo = setInterval(() => {
      ejecutarSimulacion('normal');
    }, 2500);
    return () => clearInterval(intervalo);
  }, [autoPiloto, ejecutarSimulacion]);

  const reiniciarSOC = async () => {
    setAutoPiloto(false);
    setCargando(true);
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
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Encabezado */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30">
              <ShieldCheck className="w-7 h-7 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                CyberShield SOC — Defensa Autónoma en Tiempo Real
              </h1>
              <p className="text-xs text-slate-400">
                Regresión Lineal • Red Neuronal PyTorch • Base de Conocimiento Prolog • Agente Inteligente
              </p>
            </div>
          </div>

          {/* Tarjetas de KPIs */}
          <div className="grid grid-cols-4 gap-2.5">
            <div className="bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg">
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <Activity className="w-3.5 h-3.5 text-sky-400" /> Total
              </div>
              <div className="text-base font-bold font-mono">{metricas.total_analizados}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg">
              <div className="flex items-center gap-1 text-[11px] text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Permitidos
              </div>
              <div className="text-base font-bold font-mono text-emerald-300">{metricas.permitidos}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg">
              <div className="flex items-center gap-1 text-[11px] text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" /> Limitados
              </div>
              <div className="text-base font-bold font-mono text-amber-300">{metricas.limitados}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg">
              <div className="flex items-center gap-1 text-[11px] text-rose-400">
                <XCircle className="w-3.5 h-3.5" /> Bloqueados
              </div>
              <div className="text-base font-bold font-mono text-rose-300">{metricas.bloqueados}</div>
            </div>
          </div>
        </header>

        {errorApi && (
          <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-700 text-rose-200 text-xs">
            {errorApi}
          </div>
        )}

        {/* Fila Superior: Topología + Simulador */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7">
            <TopologiaRed estadoNodos={estadoNodos} ultimoFlujo={ultimoFlujo} />
          </div>
          <div className="lg:col-span-5">
            <PanelSimulador
              hora={hora}
              setHora={setHora}
              onSimular={ejecutarSimulacion}
              onReiniciar={reiniciarSOC}
              cargando={cargando}
              autoPiloto={autoPiloto}
              setAutoPiloto={setAutoPiloto}
            />
          </div>
        </div>

        {/* Fila Media: Gráfico de Regresión Lineal */}
        <GraficoTrafico serieTrafico={serieTrafico} />

        {/* Fila Inferior: Inspector XAI e Historial */}
        <BitacoraAgente
          ultimoFlujo={ultimoFlujo}
          historial={historial}
          ipsBloqueadas={ipsBloqueadas}
        />
      </div>
    </div>
  );
}