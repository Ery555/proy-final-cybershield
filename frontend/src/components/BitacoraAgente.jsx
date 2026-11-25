import React from 'react';
import { BrainCircuit, Scale, TrendingUp, ShieldAlert, ListChecks } from 'lucide-react';

export default function BitacoraAgente({ ultimoFlujo, historial, ipsBloqueadas }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Panel Izquierdo: Desglose de los 4 Pilares de IA del Último Flujo */}
      <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
        <h2 className="text-base font-semibold text-slate-100 mb-1">
          Explicabilidad del Razonamiento Híbrido (XAI)
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          Trazabilidad de cada técnica del temario sobre el último paquete inspeccionado
        </p>

        {!ultimoFlujo ? (
          <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
            Ejecuta una simulación para inspeccionar el razonamiento de la Regresión, Red Neuronal, Prolog y el Agente.
          </div>
        ) : (
          <div className="space-y-3">
            {/* 1. Regresión Lineal */}
            <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800">
              <div className="flex items-center justify-between mb-1">
                <span className="flex items-center gap-2 text-xs font-semibold text-sky-400">
                  <TrendingUp className="w-4 h-4" />
                  1. Regresión Lineal (Línea Base Volumétrica)
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                    ultimoFlujo.linear_regression.volumetric_anomaly
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  Ratio: {ultimoFlujo.linear_regression.deviation_ratio}x
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Tráfico esperado: <strong>{ultimoFlujo.linear_regression.expected_rps} RPS</strong> | Observado:{' '}
                <strong>{ultimoFlujo.telemetry.observed_rps} RPS</strong>{' '}
                {ultimoFlujo.linear_regression.volumetric_anomaly
                  ? '— Anomalía volumétrica detectada.'
                  : '— Dentro del rango normal.'}
              </p>
            </div>

            {/* 2. Red Neuronal PyTorch */}
            <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-2 text-xs font-semibold text-purple-400">
                  <BrainCircuit className="w-4 h-4" />
                  2. Red Neuronal MLP (Clasificador IDS)
                </span>
                <span className="text-xs font-mono font-bold text-purple-300">
                  {ultimoFlujo.neural_network.predicted_class} (
                  {(ultimoFlujo.neural_network.confidence * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.entries(ultimoFlujo.neural_network.probabilities).map(([clase, prob]) => (
                  <div key={clase} className="bg-slate-900 p-2 rounded border border-slate-800">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span className="truncate">{clase}</span>
                      <span className="font-mono text-slate-200">{(prob * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-purple-500 h-full transition-all"
                        style={{ width: `${Math.min(100, prob * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Base de Conocimientos Prolog */}
            <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800">
              <div className="flex items-center justify-between mb-1">
                <span className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                  <Scale className="w-4 h-4" />
                  3. Motor Lógico SWI-Prolog (Auditoría Zero-Trust)
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                    ultimoFlujo.prolog_audit.policy_violated
                      ? 'bg-rose-500/20 text-rose-300'
                      : 'bg-emerald-500/20 text-emerald-300'
                  }`}
                >
                  {ultimoFlujo.prolog_audit.triggered_rule}
                </span>
              </div>
              <p className="text-xs text-slate-300">{ultimoFlujo.prolog_audit.explanation}</p>
            </div>

            {/* 4. Decisión del Agente Inteligente */}
            <div className="p-3.5 rounded-lg bg-indigo-950/30 border border-indigo-500/40">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
                  <ShieldAlert className="w-4 h-4" />
                  4. Acción Ejecutada por el Agente Autónomo
                </span>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-200">
                  {ultimoFlujo.agent_decision.action} → {ultimoFlujo.agent_decision.target}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Panel Derecho: Historial de Eventos e IPs Bloqueadas */}
      <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-100 mb-3">
            <ListChecks className="w-4 h-4 text-slate-400" />
            Bitácora de Decisiones Recientes
          </h2>

          <div className="overflow-x-auto max-h-[230px] overflow-y-auto border border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 sticky top-0">
                <tr>
                  <th className="py-2 px-3">ID</th>
                  <th className="py-2 px-3">Destino</th>
                  <th className="py-2 px-3">Clase NN</th>
                  <th className="py-2 px-3">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {historial.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-6 text-center text-slate-500">
                      Sin eventos registrados
                    </td>
                  </tr>
                ) : (
                  historial.map((item) => (
                    <tr key={item.flow_id} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-300">{item.flow_id}</td>
                      <td className="py-2 px-3 text-slate-300">{item.telemetry.dst_node}</td>
                      <td className="py-2 px-3 text-slate-300">{item.neural_network.predicted_class}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            item.agent_decision.action === 'ALLOW'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : item.agent_decision.action === 'RATE_LIMIT'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {item.agent_decision.action}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lista Negra del Agente */}
        <div className="mt-4 pt-3 border-t border-slate-800">
          <span className="text-xs font-semibold text-slate-300 block mb-2">
            IPs en Lista Negra del Firewall ({ipsBloqueadas.length})
          </span>
          <div className="flex flex-wrap gap-1.5 max-h-[64px] overflow-y-auto">
            {ipsBloqueadas.length === 0 ? (
              <span className="text-[11px] text-slate-500">Ninguna IP bloqueada actualmente</span>
            ) : (
              ipsBloqueadas.map((ip) => (
                <span
                  key={ip}
                  className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/60"
                >
                  {ip}
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}