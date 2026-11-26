import React from 'react';
import { Play, Zap, Key, DatabaseBackup, RotateCcw, Clock, Radio, Loader2 } from 'lucide-react';

const ESCENARIOS = [
  {
    id: 'normal',
    cantidad: 1,
    titulo: 'Tráfico Legítimo',
    badgeCantidad: '1 Sesión',
    subtitulo: 'Usuario navegando en el Servidor Web',
    pilar: 'Valida tráfico normal',
    icono: Play,
    estilo: 'border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/70',
    iconBg: 'bg-emerald-100 text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-800',
  },
  {
    id: 'ddos',
    cantidad: 6,
    titulo: 'Ataque DDoS',
    badgeCantidad: 'Oleada 6 IPs',
    subtitulo: 'Saturación simultánea al Servidor API',
    pilar: 'Regresión + Red Neuronal',
    icono: Zap,
    estilo: 'border-slate-300 hover:border-amber-500 hover:bg-amber-50/70',
    iconBg: 'bg-amber-100 text-amber-700',
    badge: 'bg-amber-100 text-amber-800',
  },
  {
    id: 'brute_force',
    cantidad: 3,
    titulo: 'Fuerza Bruta',
    badgeCantidad: 'Ráfaga 3 IPs',
    subtitulo: 'Claves fallidas en Autenticación',
    pilar: 'Red Neuronal + Prolog',
    icono: Key,
    estilo: 'border-slate-300 hover:border-orange-500 hover:bg-orange-50/70',
    iconBg: 'bg-orange-100 text-orange-700',
    badge: 'bg-orange-100 text-orange-800',
  },
  {
    id: 'exfiltration',
    cantidad: 1,
    titulo: 'Exfiltración de Datos',
    badgeCantidad: 'Ataque Crítico',
    subtitulo: 'Acceso directo a Base de Datos (:5432)',
    pilar: 'Zero-Trust Prolog + Aislamiento',
    icono: DatabaseBackup,
    estilo: 'border-slate-300 hover:border-rose-500 hover:bg-rose-50/70',
    iconBg: 'bg-rose-100 text-rose-700',
    badge: 'bg-rose-100 text-rose-800',
  },
];

export default function PanelSimulador({
  hora,
  setHora,
  onSimular,
  onReiniciar,
  cargando,
  estadoRafaga,
  autoPiloto,
  setAutoPiloto,
}) {
  const etiquetaFranja =
    hora < 6 ? 'Madrugada (Bajo)' : hora >= 9 && hora <= 18 ? 'Horario laboral (Pico)' : 'Noche (Moderado)';

  return (
    <div className="bg-white border border-slate-300 rounded-2xl p-5 shadow-md space-y-4">
      {/* Fila Superior: Título + Slider de Hora + Controles Globales */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-base font-bold text-slate-900">Panel de Simulación de Tráfico y Ataques</h2>
          <p className="text-xs text-slate-600">
            Selecciona un escenario para observar la respuesta en tiempo real en el mapa inferior
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Control de Hora */}
          <div className="flex items-center gap-3 bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-300/80">
            <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-slate-800">
                Hora: <span className="font-mono text-indigo-700">{String(hora).padStart(2, '0')}:00</span> ({etiquetaFranja})
              </span>
              <input
                type="range"
                min="0"
                max="23"
                value={hora}
                onChange={(e) => setHora(Number(e.target.value))}
                className="w-40 sm:w-48 accent-indigo-600 cursor-pointer h-1.5 mt-1"
              />
            </div>
          </div>

          {/* Tráfico Automático */}
          <button
            onClick={() => setAutoPiloto(!autoPiloto)}
            disabled={cargando && !autoPiloto}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
              autoPiloto
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                : 'bg-slate-100 text-slate-800 hover:bg-slate-200 border-slate-300'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${autoPiloto ? 'animate-ping' : 'text-slate-500'}`} />
            {autoPiloto ? 'Detener Auto-Tráfico' : 'Auto-Tráfico Normal'}
          </button>

          {/* Botón Reiniciar */}
          <button
            onClick={onReiniciar}
            disabled={cargando}
            className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reiniciar SOC
          </button>
        </div>
      </div>

      {/* Progreso de Oleada Multi-IP */}
      {estadoRafaga && (
        <div className="px-4 py-2.5 rounded-xl bg-indigo-50 border border-indigo-300 flex items-center justify-between text-xs text-indigo-950">
          <span className="flex items-center gap-2 font-bold">
            <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
            Inyectando oleada coordinada de atacantes...
          </span>
          <span className="font-mono font-bold bg-indigo-600 text-white px-2.5 py-0.5 rounded-md">
            IP {estadoRafaga.actual} de {estadoRafaga.total}
          </span>
        </div>
      )}

      {/* Fila de 4 Botones de Escenario en Ancho Completo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {ESCENARIOS.map((esc) => {
          const Icono = esc.icono;
          return (
            <button
              key={esc.id}
              onClick={() => onSimular(esc.id, esc.cantidad)}
              disabled={cargando}
              className={`p-3.5 rounded-xl bg-white border-2 text-left transition-all shadow-2xs cursor-pointer flex flex-col justify-between gap-2.5 disabled:opacity-50 ${esc.estilo}`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className={`p-2 rounded-lg ${esc.iconBg}`}>
                    <Icono className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {esc.badgeCantidad}
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-900">{esc.titulo}</div>
                <div className="text-xs text-slate-600 leading-snug mt-0.5">{esc.subtitulo}</div>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md w-fit ${esc.badge}`}>
                {esc.pilar}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}