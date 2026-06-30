export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";

export default async function ReportsPage() {
  const [patients, encounters, revenue, labs, topDoctors] = await Promise.all([
    prisma.patient.count(),
    prisma.encounter.count(),
    prisma.invoice.aggregate({ _sum: { paid: true } }),
    prisma.labOrder.count(),
    prisma.doctor.findMany({
      include: { user: true, _count: { select: { encounters: true } } },
      orderBy: { encounters: { _count: "desc" } }, take: 5,
    }),
  ]);

  const Stat = ({ label, value }: { label: string; value: string }) => (
    <div className="px-6 py-5">
      <p className="eyebrow">{label}</p>
      <p className="font-serif text-3xl text-ink mt-1.5 figure">{value}</p>
    </div>
  );

  return (
    <div>
      <PageHeader title="Reports & Analytics" subtitle="Operational summary" />
      <div className="card shadow-card mb-6 rise">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-hairline">
          <Stat label="Total patients" value={patients.toLocaleString()} />
          <Stat label="Encounters" value={encounters.toLocaleString()} />
          <Stat label="Total revenue" value={`₹${Math.round(revenue._sum.paid ?? 0).toLocaleString()}`} />
          <Stat label="Lab tests" value={labs.toLocaleString()} />
        </div>
      </div>
      <div className="card shadow-card p-6 rise" style={{ animationDelay: "80ms" }}>
        <h2 className="font-serif text-lg text-ink mb-5">Doctor performance</h2>
        <div className="space-y-4">
          {topDoctors.map((d: any, i: number) => {
            const max = topDoctors[0]._count.encounters || 1;
            const pct = (d._count.encounters / max) * 100;
            return (
              <div key={d.id}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-ink">{d.user.name}</span>
                  <span className="figure text-muted">{d._count.encounters}</span>
                </div>
                <div className="h-1.5 rounded-full bg-hairline overflow-hidden">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
