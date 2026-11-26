import React from 'react';
import {
  Globe,
  Shield,
  Server,
  Cpu,
  KeyRound,
  Database,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
} from 'lucide-react';
import { NODOS_INFO, obtenerNombreNodo, traducirAccionAgente } from '../utils/etiquetas';

const CONFIG_ESTADO = {
  healthy: {
    texto: 'Saludable',
    borde: 'border-slate-300',
    fondo: 'bg-white',
    badge: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
    iconoColor: 'text-slate-700',
  },
  rate_limited: {
    texto: 'Velocidad Limitada',
    borde: 'border-amber-400',
    fondo: 'bg-amber-50',
    badge: 'bg-amber-200/80 text-amber-900 border border-amber-400',
    iconoColor: 'text-amber-700',
  },
  under_mitigation: {
    texto: 'Mitigando Ataque',
    borde: 'border-orange-400',
    fondo: 'bg-orange-50',
    badge: 'bg-orange-200/80 text-orange-900 border border-orange-400',
    iconoColor: 'text-orange-700',
  },
  protected: {
    texto: 'Aislado (Zero-Trust)',
    borde: 'border-cyan-500',
    fondo: 'bg-cyan-50',
    badge: 'bg-cyan-200/80 text-cyan-900 border border-cyan-400',
    iconoColor: 'text-cyan-800',
  },
};

// Coordenadas Y porcentuales sincronizadas con los 4 servidores de 76px y gap-4
const LISTA_SERVIDORES = [
  { id: 'web_server', icono: Server, yPct: 22.7 },
  { id: 'api_gateway', icono: Cpu, yPct: 43.6 },
  { id: 'auth_service', icono: KeyRound, yPct: 64.5 },
  { id: 'db_server', icono: Database, yPct: 85.5 },
];

export default function TopologiaRed({ estadoNodos, ultimoFlujo, estadoRafaga }) {
  const destinoActivo = ultimoFlujo?.telemetry?.dst_node;
  const puertoActivo = ultimoFlujo?.telemetry?.dst_port;
  const accion = ultimoFlujo?.agent_decision?.action;

  const esBloqueado = accion && ['BLOCK_IP', 'BLOCK_AND_ISOLATE', 'DROP_BLACKLISTED'].includes(accion);
  const esLimitado = accion === 'RATE_LIMIT';

  const obtenerColorRuta = (idNodo) => {
    if (destinoActivo !== idNodo) return '#cbd5e1';
    if (esBloqueado) return '#e11d48';
    if (esLimitado) return '#d97706';
    return '#059669';
  };

  return (
    <div className="bg-white border border-slate-300 rounded-2xl p-6 shadow-md flex flex-col justify-between">
      {/* Cabecera y Leyenda */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Arquitectura de Red y Defensa Perimetral</h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Recorrido en tiempo real de las peticiones desde Internet hacia los servidores de la organización
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-100 px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Permitido
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Limitado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" /> Bloqueado en puerta
          </span>
        </div>
      </div>

      {/* Lienzo Amplio con Altura Generosa */}
      <div className="relative bg-slate-100/90 rounded-xl border border-slate-300/80 p-5 md:h-[440px] flex flex-col">
        {/* Capa SVG con Curvas Bézier Suaves (visible en pantallas medianas/grandes) */}
        <svg
          viewBox="0 0 100 100"
          className="hidden md:block absolute inset-0 w-full h-full pointer-events-none"
          preserveAspectRatio="none"
        >
          {/* Enlace 1: Origen Externo -> Aduana IA */}
          <line
            x1="22"
            y1="54.1"
            x2="36.5"
            y2="54.1"
            stroke={ultimoFlujo ? (esBloqueado ? '#e11d48' : '#0284c7') : '#94a3b8'}
            strokeWidth="0.65"
            vectorEffect="non-scaling-stroke"
            style={{ strokeWidth: '3px' }}
            className={ultimoFlujo ? 'enlace-activo' : ''}
          />

          {/* Enlaces 2: Curvas Bézier desde Aduana IA hasta el puerto de cada servidor */}
          {LISTA_SERVIDORES.map((srv) => {
            const activo = destinoActivo === srv.id;
            const color = obtenerColorRuta(srv.id);
            const rutaCurva = `M 54.8 54.1 C 61 54.1, 61 ${srv.yPct}, 66.7 ${srv.yPct}`;

            return (
              <path
                key={srv.id}
                d={rutaCurva}
                fill="none"
                stroke={color}
                style={{ strokeWidth: activo ? '3.5px' : '2px' }}
                strokeDasharray={activo && esBloqueado ? '6 6' : undefined}
                className={activo && !esBloqueado ? 'enlace-activo' : ''}
              />
            );
          })}
        </svg>

        {/* Encabezados de las 3 Zonas */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 mb-3 h-6 items-center">
          <div className="md:col-span-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center">
            1. Origen Externo
          </div>
          <div className="hidden md:block md:col-span-1" />
          <div className="hidden md:block md:col-span-3 text-[11px] font-bold uppercase tracking-wider text-indigo-700 text-center">
            2. Aduana IA y Prolog
          </div>
          <div className="hidden md:block md:col-span-1" />
          <div className="hidden md:block md:col-span-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center">
            3. Servidores Internos
          </div>
        </div>

        {/* Contenido de las 3 Columnas */}
        <div className="relative z-10 flex-1 grid grid-cols-1 md:grid-cols-12 items-center gap-4 md:gap-0">
          {/* Columna 1: Origen Externo */}
          <div className="md:col-span-3 flex justify-center">
            <div className="relative w-full max-w-[195px]">
              {estadoRafaga && estadoRafaga.total > 1 && (
                <>
                  <div className="absolute -top-2 -right-2 w-full h-full rounded-xl bg-rose-200 border border-rose-300 -z-10" />
                  <div className="absolute -top-1 -right-1 w-full h-full rounded-xl bg-rose-100 border border-rose-300 -z-10" />
                </>
              )}

              <div className="p-4 rounded-xl bg-white border-2 border-slate-300 shadow-sm flex flex-col items-center text-center">
                <div className="w-11 h-11 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center mb-2">
                  <Globe className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-900">
                  {estadoRafaga && estadoRafaga.total > 1 ? 'Red Atacante (Botnet)' : 'Usuario / Cliente'}
                </span>
                <span className="text-xs font-mono font-semibold text-slate-700 mt-1">
                  {ultimoFlujo ? ultimoFlujo.telemetry.src_ip : 'Esperando conexión'}
                </span>
                {estadoRafaga && estadoRafaga.total > 1 && (
                  <span className="mt-2 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-600 text-white">
                    Oleada {estadoRafaga.actual} de {estadoRafaga.total} IPs
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="hidden md:block md:col-span-1" />

          {/* Columna 2: Aduana IA y Prolog */}
          <div className="md:col-span-3 flex justify-center">
            <div
              className={`w-full max-w-[215px] p-4 rounded-xl border-2 bg-white shadow-md flex flex-col items-center text-center transition-all ${
                esBloqueado
                  ? 'border-rose-600'
                  : esLimitado
                  ? 'border-amber-500'
                  : 'border-indigo-600'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 ${
                  esBloqueado
                    ? 'bg-rose-100 text-rose-700'
                    : esLimitado
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-indigo-100 text-indigo-700'
                }`}
              >
                <Shield className="w-7 h-7" />
              </div>
              <span className="text-xs font-bold text-slate-900">Agente Defensor SOC</span>
              <span className="text-[11px] text-slate-500 mt-0.5">Analiza, audita y filtra</span>

              {accion ? (
                <span
                  className={`mt-2.5 text-[10px] font-bold px-2.5 py-1 rounded-md ${
                    esBloqueado
                      ? 'bg-rose-600 text-white'
                      : esLimitado
                      ? 'bg-amber-500 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {traducirAccionAgente(accion)}
                </span>
              ) : (
                <span className="mt-2.5 text-[10px] font-semibold px-2.5 py-1 rounded-md bg-slate-200 text-slate-600">
                  En vigilancia
                </span>
              )}
            </div>
          </div>

          <div className="hidden md:block md:col-span-1" />

          {/* Columna 3: Servidores Internos con Amplia Separación Vertical */}
          <div className="md:col-span-4 flex flex-col gap-4">
            {LISTA_SERVIDORES.map((srv) => {
              const Icono = srv.icono;
              const info = NODOS_INFO[srv.id];
              const estadoActual = estadoNodos[srv.id] || 'healthy';
              const estilo = CONFIG_ESTADO[estadoActual] || CONFIG_ESTADO.healthy;
              const esObjetivoActual = destinoActivo === srv.id;

              return (
                <div
                  key={srv.id}
                  className={`relative h-[76px] flex items-center justify-between px-4 rounded-xl border-2 transition-all ${
                    esObjetivoActual && esBloqueado
                      ? 'bg-rose-50/60 border-rose-500 shadow-sm'
                      : esObjetivoActual
                      ? `${estilo.fondo} border-slate-900 shadow-sm`
                      : `${estilo.fondo} ${estilo.borde}`
                  }`}
                >
                  {/* Puerto de entrada en el borde izquierdo de cada servidor */}
                  {esObjetivoActual && esBloqueado ? (
                    <div
                      title="Conexión bloqueada en el puerto de entrada"
                      className="hidden md:flex absolute -left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-rose-600 text-white items-center justify-center shadow-md ring-4 ring-slate-100"
                    >
                      <X className="w-4 h-4 stroke-[3]" />
                    </div>
                  ) : (
                    <div
                      className={`hidden md:block absolute -left-[7px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white ${
                        esObjetivoActual
                          ? esLimitado
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                          : 'bg-slate-400'
                      }`}
                    />
                  )}

                  <div className="flex items-center gap-3 min-w-0 pl-1">
                    <div className="p-2 rounded-lg bg-slate-100 border border-slate-200/80 shrink-0">
                      <Icono className={`w-4 h-4 ${estilo.iconoColor}`} />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 truncate">{info.nombre}</span>
                        <span className="text-[10px] font-mono text-slate-500 shrink-0">{info.puerto}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 block mt-0.5">{info.zona}</span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ml-2 ${estilo.badge}`}>
                    {estilo.texto}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Barra inferior explicativa */}
      <div className="mt-4 px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 flex items-center gap-2.5 text-xs text-slate-800">
        {!ultimoFlujo ? (
          <span>
            Selecciona cualquier escenario en la barra superior para visualizar cómo el Agente evalúa el tráfico antes de permitir el paso a los servidores.
          </span>
        ) : esBloqueado ? (
          <>
            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              <strong>Amenaza detenida en la puerta del servidor:</strong> La conexión desde{' '}
              <code className="font-mono font-bold">{ultimoFlujo.telemetry.src_ip}</code> fue bloqueada antes de ingresar al{' '}
              <strong>{obtenerNombreNodo(destinoActivo)}</strong> (puerto {puertoActivo}).
            </span>
          </>
        ) : esLimitado ? (
          <>
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Velocidad restringida:</strong> Se limitó el ancho de banda de{' '}
              <code className="font-mono font-bold">{ultimoFlujo.telemetry.src_ip}</code> hacia el{' '}
              <strong>{obtenerNombreNodo(destinoActivo)}</strong> por exceso de peticiones.
            </span>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Conexión autorizada:</strong> La petición legítima de{' '}
              <code className="font-mono font-bold">{ultimoFlujo.telemetry.src_ip}</code> accedió correctamente al{' '}
              <strong>{obtenerNombreNodo(destinoActivo)}</strong> (puerto {puertoActivo}).
            </span>
          </>
        )}
      </div>
    </div>
  );
}