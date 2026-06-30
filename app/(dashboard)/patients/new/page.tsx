"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui";

export default function NewPatientPage() {
  const router = useRouter();
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", dob: "", gender: "Male", bloodGroup: "",
    phone: "", email: "", address: "", emgName: "", emgPhone: "", emgRelation: "",
    insProvider: "", insPolicyNo: "", allergies: "",
  });
  const set = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value });

  async function submit() {
    setSaving(true); setErr("");
    const res = await fetch("/api/patients", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    const data = await res.json();
    if (res.ok) router.push(`/patients/${data.id}`);
    else setErr(data.error ?? "Could not register patient");
  }

  const F = ({ label, k, type = "text" }: any) => (
    <div>
      <label className="eyebrow">{label}</label>
      <input className="input mt-1.5" type={type} value={(form as any)[k]} onChange={set(k)} />
    </div>
  );

  return (
    <div className="max-w-2xl">
      <PageHeader title="Register patient" subtitle="A new MRN is generated automatically" />
      {err && <div className="mb-5 rounded-xl bg-alertwash text-alert px-4 py-3 text-sm rise">{err}</div>}

      <div className="card shadow-card p-7 space-y-7 rise">
        <Group title="Identity">
          <F label="First name" k="firstName" />
          <F label="Last name" k="lastName" />
          <F label="Date of birth" k="dob" type="date" />
          <div>
            <label className="eyebrow">Gender</label>
            <select className="input mt-1.5" value={form.gender} onChange={set("gender")}>
              <option>Male</option><option>Female</option><option>Other</option>
            </select>
          </div>
          <F label="Blood group" k="bloodGroup" />
          <F label="Known allergies" k="allergies" />
        </Group>

        <Group title="Contact">
          <F label="Phone (10 digits)" k="phone" />
          <F label="Email" k="email" type="email" />
          <F label="Address" k="address" />
        </Group>

        <Group title="Emergency contact">
          <F label="Name" k="emgName" />
          <F label="Phone" k="emgPhone" />
          <F label="Relation" k="emgRelation" />
        </Group>

        <Group title="Insurance">
          <F label="Provider" k="insProvider" />
          <F label="Policy number" k="insPolicyNo" />
        </Group>

        <div className="flex gap-3 pt-1">
          <button className="btn btn-primary" onClick={submit} disabled={saving}>
            {saving ? "Registering…" : "Register patient"}
          </button>
          <button className="btn btn-ghost" onClick={() => router.back()}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="eyebrow mb-3">{title}</p>
      <div className="grid sm:grid-cols-2 gap-4">{children}</div>
    </section>
  );
}
