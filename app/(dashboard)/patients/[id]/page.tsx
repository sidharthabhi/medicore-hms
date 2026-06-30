import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { StatusBadge } from "@/components/ui";
import { getSession } from "@/lib/auth";

export default async function PatientDetail({ params }: { params: { id: string } }) {
  const p = await prisma.patient.findUnique({
    where: { id: params.id },
    include: {
      encounters: { include: { doctor: { include: { user: true } } }, orderBy: { createdAt: "desc" } },
      labOrders: { orderBy: { orderedAt: "desc" }, take: 10 },
      invoices: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
  if (!p) notFound();

  // Security (spec §6.1): a PATIENT may only view their OWN record.
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "PATIENT" && p.userId !== session.uid) redirect("/dashboard");

  const age = new Date().getFullYear() - p.dob.getFullYear();
  const hasAllergy = p.allergies && p.allergies !== "None";

  return (
    <div className="space-y-8">
      {/* Identity header */}
      <div className="rise">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-accentlt text-accent grid place-items-center font-serif text-2xl">
              {p.firstName[0]}{p.lastName[0]}
            </div>
            <div>
              <h1 className="font-serif text-[26px] text-ink leading-tight">{p.firstName} {p.lastName}</h1>
              <p className="text-sm text-muted figure">{p.mrn} · {age}y · {p.gender} · {p.bloodGroup ?? "—"}</p>
            </div>
          </div>
          {hasAllergy && (
            <span className="pill bg-alertwash text-alert">⚠ Allergy: {p.allergies}</span>
          )}
        </div>
        <div className="card shadow-card mt-6 grid sm:grid-cols-3 divide-x divide-hairline">
          <Field label="Phone" value={p.phone} mono />
          <Field label="Email" value={p.email ?? "—"} />
          <Field label="Address" value={p.address ?? "—"} />
          <Field label="Emergency" value={p.emgName ? `${p.emgName} (${p.emgRelation})` : "—"} />
          <Field label="Emergency phone" value={p.emgPhone ?? "—"} mono />
          <Field label="Insurance" value={p.insProvider ? `${p.insProvider} · ${p.insPolicyNo}` : "—"} />
        </div>
      </div>

      <Section title="Encounter history" delay={80}>
        {p.encounters.length === 0 ? <EmptyNote /> : (
          <div className="space-y-2">
            {p.encounters.map((e: any) => (
              <div key={e.id} className="card shadow-card p-4">
                <div className="flex justify-between">
                  <span className="text-ink">{e.diagnosis ?? "Consultation"}</span>
                  <span className="figure text-xs text-faint">{e.createdAt.toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-muted mt-1">
                  {e.symptoms && <>{e.symptoms} · </>}{e.doctor.user.name}
                </p>
                {(e.bpSystolic || e.pulse) && (
                  <div className="flex gap-4 mt-2 figure text-xs text-faint">
                    {e.bpSystolic && <span>BP {e.bpSystolic}/{e.bpDiastolic}</span>}
                    {e.pulse && <span>HR {e.pulse}</span>}
                    {e.tempC && <span>{e.tempC.toFixed(1)}°C</span>}
                    {e.weightKg && <span>{e.weightKg}kg</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      <div className="grid lg:grid-cols-2 gap-6">
        <Section title="Lab orders" delay={120}>
          {p.labOrders.length === 0 ? <EmptyNote /> : (
            <div className="card shadow-card divide-y divide-hairline">
              {p.labOrders.map((l: any) => (
                <div key={l.id} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-ink">{l.testName}</span>
                  <StatusBadge status={l.status} />
                </div>
              ))}
            </div>
          )}
        </Section>
        <Section title="Billing" delay={160}>
          {p.invoices.length === 0 ? <EmptyNote /> : (
            <div className="card shadow-card divide-y divide-hairline">
              {p.invoices.map((i: any) => (
                <div key={i.id} className="flex items-center justify-between px-4 py-3">
                  <span className="figure text-xs text-muted">{i.invoiceNo}</span>
                  <span className="figure text-sm text-ink">₹{i.total.toLocaleString()}</span>
                  <StatusBadge status={i.status} />
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="px-5 py-4">
      <p className="eyebrow">{label}</p>
      <p className={`text-sm text-ink mt-1 ${mono ? "figure" : ""}`}>{value}</p>
    </div>
  );
}
function Section({ title, children, delay }: { title: string; children: React.ReactNode; delay: number }) {
  return <div className="rise" style={{ animationDelay: `${delay}ms` }}><h2 className="font-serif text-xl text-ink mb-3">{title}</h2>{children}</div>;
}
function EmptyNote() { return <p className="text-sm text-faint">No records.</p>; }
