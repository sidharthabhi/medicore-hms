"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const DEMO = [
  ["admin@hms.dev", "Admin"], ["doctor@hms.dev", "Doctor"],
  ["nurse@hms.dev", "Nurse"], ["reception@hms.dev", "Reception"],
  ["pharmacy@hms.dev", "Pharmacy"], ["lab@hms.dev", "Lab"],
  ["accounts@hms.dev", "Accounts"],
];

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@hms.dev");
  const [password, setPassword] = useState("password");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true); setErr("");
    const res = await fetch("/api/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (res.ok) router.push("/dashboard");
    else setErr((await res.json()).error ?? "Login failed");
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr] bg-canvas">
      {/* Brand side */}
      <div className="hidden lg:flex flex-col justify-between p-14 relative overflow-hidden border-r border-hairline">
        <div className="absolute inset-0 -z-10"
          style={{ background: "radial-gradient(900px circle at 15% 0%, #EBF2FA, transparent 55%)" }} />
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-accent grid place-items-center">
            <span className="text-white font-serif font-semibold">M</span>
          </div>
          <span className="font-serif text-xl text-ink">MediCore</span>
        </div>

        <div className="max-w-md">
          <p className="eyebrow mb-4">Hospital Operating System</p>
          <h1 className="font-serif text-[2.6rem] leading-[1.1] text-ink tracking-tight">
            Every department,<br />one calm surface.
          </h1>
          <p className="mt-5 text-muted leading-relaxed">
            Patients, scheduling, records, pharmacy, labs, beds, and billing —
            unified, with role-aware access for your whole team.
          </p>
        </div>

        <div className="flex gap-8 text-sm">
          <div><span className="font-serif text-2xl text-ink figure">8</span><p className="eyebrow mt-1">Roles</p></div>
          <div><span className="font-serif text-2xl text-ink figure">11</span><p className="eyebrow mt-1">Modules</p></div>
          <div><span className="font-serif text-2xl text-ink figure">∞</span><p className="eyebrow mt-1">Live data</p></div>
        </div>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm rise">
          <h2 className="font-serif text-2xl text-ink">Sign in</h2>
          <p className="text-sm text-muted mt-1">Choose a demo account to explore.</p>

          <div className="mt-7 space-y-3">
            <div>
              <label className="eyebrow">Email</label>
              <input className="input mt-1.5" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="eyebrow">Password</label>
              <input className="input mt-1.5" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {err && <p className="text-sm text-alert">{err}</p>}
            <button className="btn btn-primary w-full mt-1" onClick={submit} disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </div>

          <div className="mt-8">
            <p className="eyebrow mb-3">Quick demo login</p>
            <div className="flex flex-wrap gap-2">
              {DEMO.map(([e, label]) => (
                <button key={e} onClick={() => { setEmail(e); setPassword("password"); }}
                  className={`pill border transition ${email === e ? "bg-accent text-white border-accent" : "border-hairline text-muted hover:border-accent hover:text-accent"}`}>
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs text-faint mt-3">Password for all accounts: <span className="figure text-muted">password</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
