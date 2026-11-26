import React from 'react';
import {
  BrainCircuit,
  Scale,
  TrendingUp,
  ShieldAlert,
  ListChecks,
  Sparkles,
  Ban,
} from 'lucide-react';
import { obtenerNombreNodo, traducirClaseNN, traducirAccionAgente } from '../utils/etiquetas';

function generarVeredictoNatural(flujo) {
  const { telemetry, linear_regression, neural_network, prolog_audit, agent_decision } = flujo;
  const conf = (neural_network.confidence * 100).toFixed(1);
  const nombreServidor = obtenerNombreNodo(telemetry.dst_node);
  const claseTraducida = traducirClaseNN(neural_network.predicted_class);

  if (agent_decision.action === 'DROP_BLACKLISTED') {
    return `Paquete descartado en el perímetro porque la IP ${telemetry.src_ip} ya se encuentra en la lista negra del firewall.`;
  }
  if (agent_decision.action === 'BLOCK_AND_ISOLATE') {
    return `Bloqueo crítico y aislamiento del ${nombreServidor}: Prolog detectó una violación Zero-Trust (${prolog_audit.triggered_rule}) y la Red Neuronal clasificó el flujo como ${claseTraducida} con ${conf}% de confianza.`;
  }
  if (agent_decision.action === 'BLOCK_IP') {
    const motivo = prolog_audit.policy_violated
      ? `Prolog activó la regla "${prolog_audit.triggered_rule}"`
      : `la Red Neuronal identificó un patrón de ${claseTraducida} (${conf}% de confianza)`;
    return `IP ${telemetry.src_ip} bloqueada automáticamente hacia el ${nombreServidor} porque ${motivo}.`;
  }
  if (agent_decision.action === 'RATE_LIMIT') {
    return `Velocidad restringida hacia el ${nombreServidor}: la Regresión Lineal detectó un volumen ${linear_regression.deviation_ratio}x superior al tráfico normal esperado para esta hora.`;
  }
  return `Acceso permitido al ${nombreServidor}: cumple las políticas Zero-Trust de Prolog, mantiene un volumen normal según la Regresión Lineal y la Red Neuronal lo valida como ${claseTraducida} (${conf}%).`;
}

export function PanelExplicabilidad({ ultimoFlujo }) {
  if (!ultimoFlujo) {
    return (
      <div className="bg-white border border-slate-300 rounded-2xl p-10 text-center shadow-md">
        <p className="text-sm font-bold text-slate-700">Aún no se ha inspeccionado ningún paquete</p>
        <p className="text-xs text-slate-500 mt-1">
          Selecciona un escenario en la barra superior para ver el razonamiento paso a paso de los 4 módulos de IA.
        </p>
      </div>
    );
  }

  const accion = ultimoFlujo.agent_decision.action;
  const esAlerta = accion !== 'ALLOW';

  return (
    <div className="bg-white border border-slate-300 rounded-2xl p-6 shadow-md space-y-5">
      {/* Veredicto Ejecutivo */}
      <div
        className={`p-4 rounded-xl border-2 flex items-start gap-3 ${
          esAlerta
            ? 'bg-rose-50 border-rose-300 text-rose-950'
            : 'bg-emerald-50 border-emerald-300 text-emerald-950'
        }`}
      >
        <Sparkles className={`w-5 h-5 shrink-0 mt-0.5 ${esAlerta ? 'text-rose-600' : 'text-emerald-600'}`} />
        <div>
          <span className="text-xs font-bold uppercase tracking-wide block mb-0.5">
            Veredicto Ejecutivo del Agente ({ultimoFlujo.flow_id})
          </span>
          <p className="text-sm leading-relaxed">{generarVeredictoNatural(ultimoFlujo)}</p>
        </div>
      </div>

      {/* Grid 2x2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Regresión Lineal */}
        <div className="p-4 rounded-xl bg-slate-100 border border-slate-300/80">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <span className="p-1.5 rounded-lg bg-sky-200/80 text-sky-800">
                <TrendingUp className="w-4 h-4" />
              </span>
              1. Regresión Lineal (Línea Base)
            </span>
            <span
              className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                ultimoFlujo.linear_regression.volumetric_anomaly
                  ? 'bg-amber-200 text-amber-900 border border-amber-400'
                  : 'bg-white text-slate-700 border border-slate-300'
              }`}
            >
              Desvío: {ultimoFlujo.linear_regression.deviation_ratio}x
            </span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            Esperado para esta hora: <strong className="text-slate-950">{ultimoFlujo.linear_regression.expected_rps} RPS</strong> •
            Observado: <strong className="text-slate-950">{ultimoFlujo.telemetry.observed_rps} RPS</strong>.
          </p>
        </div>

        {/* 2. Red Neuronal PyTorch */}
        <div className="p-4 rounded-xl bg-slate-100 border border-slate-300/80">
          <div className="flex items-center justify-between mb-2.5">
            <span className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <span className="p-1.5 rounded-lg bg-purple-200/80 text-purple-800">
                <BrainCircuit className="w-4 h-4" />
              </span>
              2. Red Neuronal MLP (PyTorch)
            </span>
            <span className="text-xs font-bold text-purple-800">
              {traducirClaseNN(ultimoFlujo.neural_network.predicted_class)} (
              {(ultimoFlujo.neural_network.confidence * 100).toFixed(1)}%)
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(ultimoFlujo.neural_network.probabilities).map(([clase, prob]) => (
              <div key={clase} className="bg-white p-2 rounded-lg border border-slate-300/80">
                <div className="flex justify-between text-[10px] text-slate-700 mb-1">
                  <span className="font-semibold truncate">{traducirClaseNN(clase)}</span>
                  <span className="font-mono font-bold text-slate-900">{(prob * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-purple-600 h-full transition-all"
                    style={{ width: `${Math.min(100, prob * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Base de Conocimientos Prolog */}
        <div className="p-4 rounded-xl bg-slate-100 border border-slate-300/80">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <span className="p-1.5 rounded-lg bg-amber-200/80 text-amber-800">
                <Scale className="w-4 h-4" />
              </span>
              3. Motor Lógico SWI-Prolog
            </span>
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                ultimoFlujo.prolog_audit.policy_violated
                  ? 'bg-rose-200 text-rose-900 border border-rose-300'
                  : 'bg-emerald-200 text-emerald-900 border border-emerald-300'
              }`}
            >
              {ultimoFlujo.prolog_audit.triggered_rule}
            </span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">{ultimoFlujo.prolog_audit.explanation}</p>
        </div>

        {/* 4. Decisión del Agente Inteligente */}
        <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-300">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-2 text-xs font-bold text-indigo-950">
              <span className="p-1.5 rounded-lg bg-indigo-200 text-indigo-800">
                <ShieldAlert className="w-4 h-4" />
              </span>
              4. Acción del Agente Inteligente
            </span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-indigo-600 text-white">
              {traducirAccionAgente(ultimoFlujo.agent_decision.action)}
            </span>
          </div>
          <p className="text-xs text-indigo-950">
            IP evaluada: <strong className="font-mono">{ultimoFlujo.agent_decision.target}</strong> • Destino:{' '}
            <strong>{obtenerNombreNodo(ultimoFlujo.telemetry.dst_node)}</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function BitacoraAgente({ historial, ipsBloqueadas }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Tabla de Bitácora */}
      <div className="lg:col-span-8 bg-white border border-slate-300 rounded-2xl p-6 shadow-md">
        <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 mb-4">
          <ListChecks className="w-4 h-4 text-indigo-600" />
          Bitácora de Flujos Analizados
        </h3>

        <div className="overflow-x-auto max-h-[260px] overflow-y-auto border border-slate-300 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 border-b border-slate-300 sticky top-0">
              <tr>
                <th className="py-2.5 px-3.5 font-bold">Flujo</th>
                <th className="py-2.5 px-3.5 font-bold">IP Origen</th>
                <th className="py-2.5 px-3.5 font-bold">Servidor Destino</th>
                <th className="py-2.5 px-3.5 font-bold">Diagnóstico Red</th>
                <th className="py-2.5 px-3.5 font-bold">Decisión Agente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {historial.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-500">
                    No hay eventos registrados todavía
                  </td>
                </tr>
              ) : (
                historial.map((item) => (
                  <tr key={item.flow_id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3.5 font-mono text-[11px] font-bold text-slate-800">{item.flow_id}</td>
                    <td className="py-2.5 px-3.5 font-mono text-[11px] text-slate-700">{item.telemetry.src_ip}</td>
                    <td className="py-2.5 px-3.5 font-medium text-slate-800">
                      {obtenerNombreNodo(item.telemetry.dst_node)}
                    </td>
                    <td className="py-2.5 px-3.5 font-semibold text-slate-900">
                      {traducirClaseNN(item.neural_network.predicted_class)}
                    </td>
                    <td className="py-2.5 px-3.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.agent_decision.action === 'ALLOW'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : item.agent_decision.action === 'RATE_LIMIT'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}
                      >
                        {traducirAccionAgente(item.agent_decision.action)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lista Negra Activa */}
      <div className="lg:col-span-4 bg-white border border-slate-300 rounded-2xl p-6 shadow-md flex flex-col">
        <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 mb-1">
          <Ban className="w-4 h-4 text-rose-600" />
          IPs Bloqueadas ({ipsBloqueadas.length})
        </h3>
        <p className="text-xs text-slate-600 mb-4">Direcciones aisladas dinámicamente en el firewall</p>

        <div className="flex-1 bg-slate-100 rounded-xl border border-slate-300/80 p-3.5 overflow-y-auto max-h-[220px]">
          {ipsBloqueadas.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-500 text-center">
              Ninguna IP en lista negra actualmente
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {ipsBloqueadas.map((ip) => (
                <span
                  key={ip}
                  className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-white text-rose-700 border border-rose-300 shadow-2xs"
                >
                  {ip}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}