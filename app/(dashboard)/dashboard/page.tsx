import { getDashboardMetrics } from "@/lib/metrics";
import { PatientFlow, RevenueBars } from "@/components/DashboardCharts";
import { StatusBadge } from "@/components/ui";
import Link from "next/link";
import Icon from "@/components/Icon";

export default async function DashboardPage() {
  const m = await getDashboardMetrics();
  const k = m.kpis;
  const occupancyPct = k.totalBeds ? Math.round((k.occupiedBeds / k.totalBeds) * 100) : 0;

  return (
    <div className="space-y-10">
      <div className="rise">
        <p className="eyebrow">Today at a glance</p>
        <div className="flex items-baseline gap-4 mt-2">
          <span className="font-serif text-display text-ink figure">{k.todayAppts}</span>
          <span className="text-muted text-lg mb-1">appointments scheduled</span>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-1 mt-3 text-sm text-muted">
          <span><span className="text-ink figure">{k.totalPatients.toLocaleString()}</span> total patients</span>
          <span><span className="text-ink figure">{k.availableBeds}</span> of {k.totalBeds} beds free</span>
          <span><span className="text-ink figure">₹{k.revenueToday.toLocaleString()}</span> collected today</span>
        </div>
      </div>

      <div className="card shadow-card rise" style={{ animationDelay: "60ms" }}>
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-hairline">
          <Stat label="Bed occupancy" value={`${occupancyPct}%`} note={`${k.occupiedBeds} occupied`} />
          <Stat label="Pending lab tests" value={String(k.pendingLabs)} note="awaiting result" tone={k.pendingLabs > 0 ? "warn" : undefined} />
          <Stat label="Low-stock medicines" value={String(k.lowStockCount)} note="below reorder" tone={k.lowStockCount > 0 ? "alert" : undefined} />
          <Stat label="Revenue today" value={`₹${k.revenueToday.toLocaleString()}`} note="collected" />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Panel title="Patient flow" note="Encounters · last 14 days" delay={120}>
          <PatientFlow data={m.patientFlow} />
        </Panel>
        <Panel title="Revenue" note="Collected · last 6 months" delay={160}>
          <RevenueBars data={m.revenueByMonth} />
        </Panel>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rise" style={{ animationDelay: "200ms" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-serif text-xl text-ink">Today's schedule</h2>
              <p className="eyebrow mt-0.5">{m.upcoming.length} appointments</p>
            </div>
            <Link href="/appointments" className="text-sm text-accent hover:underline flex items-center gap-1">
              View all <Icon name="arrow" className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="card shadow-card divide-y divide-hairline overflow-hidden">
            {m.upcoming.length === 0 && (
              <p className="px-5 py-10 text-center text-sm text-faint">Nothing scheduled today.</p>
            )}
            {m.upcoming.map((a: any) => (
              <div key={a.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-canvas/60 transition">
                <span className="figure text-sm text-muted w-16">{a.time}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink truncate">{a.patient}</p>
                  <p className="text-xs text-faint truncate">{a.doctor}</p>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="rise" style={{ animationDelay: "240ms" }}>
          <h2 className="font-serif text-xl text-ink mb-4">Stock alerts</h2>
          <div className="card shadow-card divide-y divide-hairline overflow-hidden">
            {m.lowStockItems.length === 0 && (
              <p className="px-5 py-10 text-center text-sm text-faint">All medicines well stocked.</p>
            )}
            {m.lowStockItems.map((med: any) => (
              <div key={med.name} className="flex items-center justify-between px-5 py-3">
                <span className="text-sm text-ink truncate pr-2">{med.name}</span>
                <span className="pill bg-alertwash text-alert figure shrink-0">{med.stock} left</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, note, tone }: { label: string; value: string; note: string; tone?: "warn" | "alert" }) {
  const toneColor = tone === "alert" ? "text-alert" : tone === "warn" ? "text-warn" : "text-ink";
  return (
    <div className="px-6 py-5">
      <p className="eyebrow">{label}</p>
      <p className={`font-serif text-3xl mt-1.5 figure ${toneColor}`}>{value}</p>
      <p className="text-xs text-faint mt-0.5">{note}</p>
    </div>
  );
}

function Panel({ title, note, children, delay }: { title: string; note: string; children: React.ReactNode; delay: number }) {
  return (
    <div className="card shadow-card p-6 rise" style={{ animationDelay: `${delay}ms` }}>
      <div className="mb-5">
        <h2 className="font-serif text-xl text-ink">{title}</h2>
        <p className="eyebrow mt-0.5">{note}</p>
      </div>
      {children}
    </div>
  );
}
