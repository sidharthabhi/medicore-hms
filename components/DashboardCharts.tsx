"use client";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const BLUE = "#2B6CB0";

const tip = {
  contentStyle: {
    borderRadius: 12, border: "1px solid #EBEDF0",
    boxShadow: "0 4px 16px rgba(21,24,30,0.08)", fontSize: 12, fontFamily: "IBM Plex Mono",
  },
  cursor: { fill: "rgba(43,108,176,0.04)" },
};

export function PatientFlow({ data }: { data: { date: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
        <defs>
          <linearGradient id="flow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={BLUE} stopOpacity={0.16} />
            <stop offset="100%" stopColor={BLUE} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9AA1AD", fontFamily: "IBM Plex Mono" }}
          axisLine={false} tickLine={false} interval={2} />
        <YAxis tick={{ fontSize: 11, fill: "#9AA1AD", fontFamily: "IBM Plex Mono" }}
          axisLine={false} tickLine={false} allowDecimals={false} width={36} />
        <Tooltip {...tip} />
        <Area type="monotone" dataKey="count" stroke={BLUE} strokeWidth={2}
          fill="url(#flow)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function RevenueBars({ data }: { data: { month: string; revenue: number }[] }) {
  const max = Math.max(...data.map((d) => d.revenue), 1);
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9AA1AD", fontFamily: "IBM Plex Mono" }}
          axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#9AA1AD", fontFamily: "IBM Plex Mono" }}
          axisLine={false} tickLine={false} width={44}
          tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
        <Tooltip {...tip} formatter={(v: number) => [`₹${v.toLocaleString()}`, "Revenue"]} />
        <Bar dataKey="revenue" radius={[6, 6, 6, 6]} maxBarSize={28}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.revenue === max ? BLUE : "#CBD9E8"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
