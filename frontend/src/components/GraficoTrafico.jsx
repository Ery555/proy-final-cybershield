import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

export default function GraficoTrafico({ serieTrafico }) {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
      <div className="mb-3">
        <h2 className="text-base font-semibold text-slate-100">
          Detección Volumétrica (Regresión Lineal vs. Tráfico Real)
        </h2>
        <p className="text-xs text-slate-400">
          La línea punteada representa el RPS esperado según la hora del día; los picos revelan anomalías DDoS
        </p>
      </div>

      <div className="h-[220px] w-full">
        {serieTrafico.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
            Simula tráfico para visualizar la comparación contra la Regresión Lineal
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={serieTrafico} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="id" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  fontSize: '12px',
                  color: '#f8fafc',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar
                dataKey="observado"
                name="RPS Observado"
                fill="#38bdf8"
                radius={[4, 4, 0, 0]}
                barSize={24}
              />
              <Line
                type="monotone"
                dataKey="esperado"
                name="RPS Esperado (Regresión Lineal)"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}