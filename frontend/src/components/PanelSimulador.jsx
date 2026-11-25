import React from 'react';
import { Play, Zap, Key, DatabaseBackup, RotateCcw, Clock, Radio } from 'lucide-react';

export default function PanelSimulador({
  hora,
  setHora,
  onSimular,
  onReiniciar,
  cargando,
  autoPiloto,
  setAutoPiloto,
}) {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between gap-4">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-slate-100">Simulador de Escenarios</h2>
          <button
            onClick={onReiniciar}
            disabled={cargando}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reiniciar SOC
          </button>
        </div>

        {/* Control de Hora del Día para la Regresión Lineal */}
        <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 mb-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="flex items-center gap-1.5 text-slate-300 font-medium">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              Hora Simulada (Regresión Lineal):
            </span>
            <span className="font-mono font-bold text-emerald-400">{String(hora).padStart(2, '0')}:00 hrs</span>
          </div>
          <input
            type="range"
            min="0"
            max="23"
            value={hora}
            onChange={(e) => setHora(Number(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
            <span>00:00 (Madrugada)</span>
            <span>14:00 (Hora Pico)</span>
            <span>23:00</span>
          </div>
        </div>

        {/* Botones de Inyección de Tráfico */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            onClick={() => onSimular('normal')}
            disabled={cargando}
            className="flex items-center gap-2 p-3 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-700/60 text-emerald-200 text-xs font-medium transition cursor-pointer"
          >
            <Play className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="text-left">
              <div className="font-semibold">Tráfico Normal</div>
              <div className="text-[10px] text-emerald-300/70">Navegación HTTPS legítima</div>
            </div>
          </button>

          <button
            onClick={() => onSimular('ddos')}
            disabled={cargando}
            className="flex items-center gap-2 p-3 rounded-lg bg-amber-950/50 hover:bg-amber-900/60 border border-amber-700/60 text-amber-200 text-xs font-medium transition cursor-pointer"
          >
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="text-left">
              <div className="font-semibold">Ataque DDoS</div>
              <div className="text-[10px] text-amber-300/70">Inundación volumétrica PPS</div>
            </div>
          </button>

          <button
            onClick={() => onSimular('brute_force')}
            disabled={cargando}
            className="flex items-center gap-2 p-3 rounded-lg bg-orange-950/50 hover:bg-orange-900/60 border border-orange-700/60 text-orange-200 text-xs font-medium transition cursor-pointer"
          >
            <Key className="w-4 h-4 text-orange-400 shrink-0" />
            <div className="text-left">
              <div className="font-semibold">Fuerza Bruta</div>
              <div className="text-[10px] text-orange-300/70">Múltiples logins fallidos</div>
            </div>
          </button>

          <button
            onClick={() => onSimular('exfiltration')}
            disabled={cargando}
            className="flex items-center gap-2 p-3 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 border border-rose-700/60 text-rose-200 text-xs font-medium transition cursor-pointer"
          >
            <DatabaseBackup className="w-4 h-4 text-rose-400 shrink-0" />
            <div className="text-left">
              <div className="font-semibold">Exfiltración DB</div>
              <div className="text-[10px] text-rose-300/70">Violación Zero-Trust :5432</div>
            </div>
          </button>
        </div>
      </div>

      {/* Modo Tráfico Continuo */}
      <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className={`w-4 h-4 ${autoPiloto ? 'text-emerald-400 animate-ping' : 'text-slate-500'}`} />
          <span className="text-xs text-slate-300">Flujo normal automático (cada 2.5s)</span>
        </div>
        <button
          onClick={() => setAutoPiloto(!autoPiloto)}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
            autoPiloto
              ? 'bg-emerald-500 text-slate-950'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          {autoPiloto ? 'Activo' : 'Activar'}
        </button>
      </div>
    </div>
  );
}