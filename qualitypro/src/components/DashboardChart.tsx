"use client";

import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  Tooltip,
} from "recharts";

const data = [
  { mes: "Jan", valor: 20 },
  { mes: "Fev", valor: 35 },
  { mes: "Mar", valor: 45 },
  { mes: "Abr", valor: 60 },
  { mes: "Mai", valor: 75 },
  { mes: "Jun", valor: 90 },
];

export default function DashboardChart() {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis
            dataKey="mes"
            stroke="#94a3b8"
          />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="valor"
            stroke="#3b82f6"
            strokeWidth={4}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}