import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";

export default async function DoctorsPage() {
  const docs = await prisma.doctor.findMany({
    include: { user: true, department: true, _count: { select: { appointments: true } } },
  });
  return (
    <div>
      <PageHeader title="Doctors" subtitle={`${docs.length} practitioners`} />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {docs.map((d: any, i: number) => (
          <div key={d.id} className="card shadow-card p-5 rise" style={{ animationDelay: `${i*40}ms` }}>
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-accentlt text-accent grid place-items-center font-serif text-lg">
                {d.user.name.replace("Dr. ","").charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-ink truncate">{d.user.name}</p>
                <p className="text-xs text-muted truncate">{d.specialization}</p>
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-hairline grid grid-cols-2 gap-y-3 gap-x-4">
              <Meta label="Department" value={d.department.name} />
              <Meta label="Fee" value={`₹${d.consultationFee}`} mono />
              <Meta label="Appointments" value={String(d._count.appointments)} mono />
              <Meta label="Status" value={d.onLeave ? "On leave" : "Available"} tone={d.onLeave ? "warn" : "ok"} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Meta({ label, value, mono, tone }: { label: string; value: string; mono?: boolean; tone?: "ok" | "warn" }) {
  const c = tone === "ok" ? "text-ok" : tone === "warn" ? "text-warn" : "text-ink";
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <p className={`text-sm mt-0.5 ${c} ${mono ? "figure" : ""}`}>{value}</p>
    </div>
  );
}
