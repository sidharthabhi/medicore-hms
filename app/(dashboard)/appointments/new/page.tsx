export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import BookForm from "./BookForm";

export default async function NewAppointmentPage() {
  const [patients, doctors] = await Promise.all([
    prisma.patient.findMany({ orderBy: { firstName: "asc" }, take: 200 }),
    prisma.doctor.findMany({ include: { user: true, schedules: true } }),
  ]);

  return (
    <div>
      <PageHeader title="Book appointment" subtitle="Choose a patient, doctor, and an open slot" />
      <BookForm
        patients={patients.map((p: any) => ({ id: p.id, label: `${p.firstName} ${p.lastName} · ${p.mrn}` }))}
        doctors={doctors.map((d: any) => ({
          id: d.id,
          label: `${d.user.name} — ${d.specialization}`,
          days: d.schedules.map((s: any) => s.dayOfWeek),
          start: d.schedules[0]?.startTime ?? "09:00",
          end: d.schedules[0]?.endTime ?? "17:00",
          onLeave: d.onLeave,
        }))}
      />
    </div>
  );
}
