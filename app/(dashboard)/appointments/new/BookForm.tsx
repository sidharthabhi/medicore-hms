"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Patient = { id: string; label: string };
type Doctor = { id: string; label: string; days: number[]; start: string; end: string; onLeave: boolean };

export default function BookForm({ patients, doctors }: { patients: Patient[]; doctors: Doctor[] }) {
  const router = useRouter();
  const [patientId, setPatientId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState<{ token: number } | null>(null);
  const [saving, setSaving] = useState(false);

  const doctor = doctors.find((d) => d.id === doctorId);

  // Build available time slots (30-min) from the doctor's schedule for the chosen day
  const slots: string[] = [];
  if (doctor && date) {
    const dow = new Date(date + "T00:00").getDay();
    if (doctor.days.includes(dow)) {
      const [sh, sm] = doctor.start.split(":").map(Number);
      const [eh, em] = doctor.end.split(":").map(Number);
      let mins = sh * 60 + sm;
      const end = eh * 60 + em;
      while (mins < end) {
        slots.push(`${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`);
        mins += 30;
      }
    }
  }

  async function submit() {
    setErr(""); setOk(null);
    if (!patientId) return setErr("Select a patient");
    if (!doctorId) return setErr("Select a doctor");
    if (!date || !time) return setErr("Pick a date and time");

    setSaving(true);
    const scheduledAt = new Date(`${date}T${time}:00`).toISOString();
    const res = await fetch("/api/appointments", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId, doctorId, scheduledAt, reason }),
    });
    setSaving(false);
    const data = await res.json();
    if (res.ok) {
      setOk({ token: data.token });
      setTimeout(() => router.push("/appointments"), 1500);
    } else setErr(data.error ?? "Could not book");
  }

  if (ok) {
    return (
      <div className="card shadow-card p-8 text-center rise">
        <div className="h-12 w-12 rounded-full bg-okwash text-ok grid place-items-center mx-auto mb-4 text-xl">✓</div>
        <h2 className="font-serif text-xl text-ink">Appointment booked</h2>
        <p className="text-muted text-sm mt-1">Token number <span className="figure text-ink">#{ok.token}</span> · taking you to the schedule…</p>
      </div>
    );
  }

  return (
    <div className="card shadow-card p-7 space-y-6 rise max-w-2xl">
      {err && <div className="rounded-xl bg-alertwash text-alert px-4 py-3 text-sm">{err}</div>}

      <div>
        <label className="eyebrow">Patient</label>
        <select className="input mt-1.5" value={patientId} onChange={(e) => setPatientId(e.target.value)}>
          <option value="">Select a patient…</option>
          {patients.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
      </div>

      <div>
        <label className="eyebrow">Doctor</label>
        <select className="input mt-1.5" value={doctorId} onChange={(e) => { setDoctorId(e.target.value); setTime(""); }}>
          <option value="">Select a doctor…</option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id} disabled={d.onLeave}>
              {d.label}{d.onLeave ? " (on leave)" : ""}
            </option>
          ))}
        </select>
        {doctor && <p className="text-xs text-faint mt-1.5">Available {doctor.start}–{doctor.end}, Mon–Fri</p>}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="eyebrow">Date</label>
          <input type="date" className="input mt-1.5" value={date}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => { setDate(e.target.value); setTime(""); }} />
        </div>
        <div>
          <label className="eyebrow">Time slot</label>
          <select className="input mt-1.5" value={time} onChange={(e) => setTime(e.target.value)}
            disabled={!doctor || !date}>
            <option value="">{!doctor || !date ? "Pick doctor & date first" : slots.length ? "Select a slot…" : "Doctor unavailable this day"}</option>
            {slots.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="eyebrow">Reason (optional)</label>
        <input className="input mt-1.5" value={reason} onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Fever, follow-up" />
      </div>

      <div className="flex gap-3 pt-1">
        <button className="btn btn-primary" onClick={submit} disabled={saving}>
          {saving ? "Booking…" : "Book appointment"}
        </button>
        <button className="btn btn-ghost" onClick={() => router.back()}>Cancel</button>
      </div>
    </div>
  );
}
