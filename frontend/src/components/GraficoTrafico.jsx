import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

export default function GraficoTrafico({ serieTrafico }) {
  return (
    <div className="bg-white border border-slate-300 rounded-2xl p-6 shadow-md">
      <div className="mb-4">
        <h3 className="text-base font-bold text-slate-900">
          Detección Volumétrica: Regresión Lineal vs. Tráfico Observado
        </h3>
        <p className="text-xs text-slate-600 mt-0.5">
          La línea verde muestra el tráfico esperado según la hora del día; las barras en rojo indican picos anómalos detectados por el modelo.
        </p>
      </div>

      <div className="h-[260px] w-full">
        {serieTrafico.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs font-medium text-slate-500 bg-slate-100 border border-dashed border-slate-300 rounded-xl">
            Ejecuta simulaciones para visualizar la comparación contra la Regresión Lineal
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={serieTrafico} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
              <XAxis dataKey="id" stroke="#475569" fontSize={11} />
              <YAxis stroke="#475569" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#94a3b8',
                  borderRadius: '10px',
                  fontSize: '12px',
                  color: '#0f172a',
                  boxShadow: '0 4px 12px rgb(0 0 0 / 0.12)',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
              <Bar dataKey="observado" name="RPS Observado (Azul = Normal / Rojo = Pico)" radius={[6, 6, 0, 0]} barSize={28}>
                {serieTrafico.map((entrada, index) => (
                  <Cell key={`cell-${index}`} fill={entrada.anomalia ? '#e11d48' : '#0284c7'} />
                ))}
              </Bar>
              <Line
                type="monotone"
                dataKey="esperado"
                name="RPS Esperado (Regresión Lineal)"
                stroke="#059669"
                strokeWidth={3}
                dot={{ r: 4, fill: '#059669' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}