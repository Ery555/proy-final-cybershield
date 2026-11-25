import React from 'react';
import { Globe, Shield, Server, Cpu, KeyRound, Database, Ban } from 'lucide-react';

const CONFIG_ESTADO = {
  healthy: {
    texto: 'Saludable',
    borde: 'border-emerald-500/60',
    fondo: 'bg-emerald-950/40',
    badge: 'bg-emerald-500/20 text-emerald-300',
  },
  rate_limited: {
    texto: 'Rate-Limited',
    borde: 'border-amber-500/70',
    fondo: 'bg-amber-950/40',
    badge: 'bg-amber-500/20 text-amber-300',
  },
  under_mitigation: {
    texto: 'Mitigando Ataque',
    borde: 'border-orange-500/70',
    fondo: 'bg-orange-950/40',
    badge: 'bg-orange-500/20 text-orange-300',
  },
  protected: {
    texto: 'Aislado (Zero-Trust)',
    borde: 'border-cyan-400/80',
    fondo: 'bg-cyan-950/50',
    badge: 'bg-cyan-500/20 text-cyan-300',
  },
};

const NODOS_DESTINO = [
  { id: 'web_server', nombre: 'Web Server', puerto: ':80 / :443', zona: 'DMZ Pública', icono: Server },
  { id: 'api_gateway', nombre: 'API Gateway', puerto: ':443', zona: 'DMZ Core', icono: Cpu },
  { id: 'auth_service', nombre: 'Auth Service', puerto: ':22 / :443', zona: 'Zona Identidad', icono: KeyRound },
  { id: 'db_server', nombre: 'DB Server', puerto: ':5432', zona: 'Red Interna Crítica', icono: Database },
];

export default function TopologiaRed({ estadoNodos, ultimoFlujo }) {
  const destinoActivo = ultimoFlujo?.telemetry?.dst_node;
  const accion = ultimoFlujo?.agent_decision?.action;
  const esBloqueado = accion && ['BLOCK_IP', 'BLOCK_AND_ISOLATE', 'DROP_BLACKLISTED'].includes(accion);
  const esLimitado = accion === 'RATE_LIMIT';

  const colorEnlace = (idNodo) => {
    if (destinoActivo !== idNodo) return '#334155'; // slate-700
    if (esBloqueado) return '#f43f5e'; // rose-500
    if (esLimitado) return '#f59e0b'; // amber-500
    return '#10b981'; // emerald-500
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-100">Topología de Red Protegida</h2>
          <p className="text-xs text-slate-400">
            Visualización en vivo del enrutamiento y aislamiento autónomo por nodo
          </p>
        </div>
        {ultimoFlujo && (
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
            Último flujo: {ultimoFlujo.flow_id} ({ultimoFlujo.telemetry.src_ip})
          </span>
        )}
      </div>

      <div className="relative grid grid-cols-12 items-center gap-2 py-4 px-2 bg-slate-950/70 rounded-lg border border-slate-800/80 min-h-[300px]">
        {/* Columna 1: Origen Externo */}
        <div className="col-span-3 flex flex-col items-center z-10">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 flex flex-col items-center text-center w-full max-w-[150px]">
            <Globe className="w-8 h-8 text-sky-400 mb-2" />
            <span className="text-xs font-semibold text-slate-200">Tráfico Entrante</span>
            <span className="text-[11px] text-slate-400 mt-0.5">
              {ultimoFlujo ? ultimoFlujo.telemetry.src_ip : 'Esperando paquetes...'}
            </span>
          </div>
        </div>

        {/* Columna 2: Firewall + Agente SOC */}
        <div className="col-span-4 flex flex-col items-center z-10">
          <div
            className={`p-4 rounded-xl border-2 flex flex-col items-center text-center w-full max-w-[190px] transition-all ${
              esBloqueado
                ? 'bg-rose-950/40 border-rose-500 shadow-md shadow-rose-500/20'
                : 'bg-indigo-950/40 border-indigo-500/70'
            }`}
          >
            <Shield className={`w-9 h-9 mb-2 ${esBloqueado ? 'text-rose-400' : 'text-indigo-400'}`} />
            <span className="text-xs font-bold text-slate-100">Agente SOC + Prolog</span>
            <span className="text-[11px] text-slate-400 mt-0.5">Firewall Zero-Trust & IDS</span>
            {accion && (
              <span
                className={`mt-2 text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                  esBloqueado
                    ? 'bg-rose-500/20 text-rose-300'
                    : esLimitado
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}
              >
                {accion}
              </span>
            )}
          </div>
        </div>

        {/* Columna 3: Servidores Internos */}
        <div className="col-span-5 flex flex-col gap-3 z-10">
          {NODOS_DESTINO.map((nodo) => {
            const Icono = nodo.icono;
            const estadoActual = estadoNodos[nodo.id] || 'healthy';
            const estilo = CONFIG_ESTADO[estadoActual] || CONFIG_ESTADO.healthy;
            const esObjetivoActual = destinoActivo === nodo.id;

            return (
              <div
                key={nodo.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${estilo.fondo} ${
                  esObjetivoActual ? `${estilo.borde} ring-2 ring-offset-1 ring-offset-slate-950 ring-slate-500` : estilo.borde
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icono className="w-5 h-5 text-slate-200 shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-100">{nodo.nombre}</span>
                      <span className="text-[10px] font-mono text-slate-400">{nodo.puerto}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">{nodo.zona}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {esObjetivoActual && esBloqueado && (
                    <Ban className="w-4 h-4 text-rose-400 animate-pulse" title="Conexión bloqueada en firewall" />
                  )}
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${estilo.badge}`}>
                    {estilo.texto}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Capa SVG de conexiones */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
          {/* Enlace Internet -> Agente */}
          <line
            x1="22%"
            y1="50%"
            x2="37%"
            y2="50%"
            stroke={ultimoFlujo ? (esBloqueado ? '#f43f5e' : '#38bdf8') : '#334155'}
            strokeWidth="2.5"
            className={ultimoFlujo ? 'enlace-activo' : ''}
          />

          {/* Enlaces Agente -> 4 Nodos */}
          {[16, 39, 62, 85].map((yDest, idx) => {
            const idNodo = NODOS_DESTINO[idx].id;
            const activo = destinoActivo === idNodo;
            return (
              <line
                key={idNodo}
                x1="54%"
                y1="50%"
                x2="60%"
                y2={`${yDest}%`}
                stroke={colorEnlace(idNodo)}
                strokeWidth={activo ? '3' : '1.5'}
                strokeDasharray={activo && esBloqueado ? '4 4' : undefined}
                className={activo && !esBloqueado ? 'enlace-activo' : ''}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
}