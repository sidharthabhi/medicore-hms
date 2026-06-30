import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const rand = <T>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const randInt = (lo: number, hi: number) =>
  Math.floor(Math.random() * (hi - lo + 1)) + lo;

async function main() {
  console.log("Seeding HMS…");

  // wipe (order matters for FKs)
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.labOrder.deleteMany();
  await prisma.encounter.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.admission.deleteMany();
  await prisma.bed.deleteMany();
  await prisma.doctorSchedule.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.medicine.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.counter.deleteMany();

  const pw = await bcrypt.hash("password", 10);

  // ---- Departments ----
  const deptNames = ["General Medicine","Cardiology","Orthopedics","Pediatrics","Neurology","Emergency"];
  const depts = await Promise.all(
    deptNames.map((name) => prisma.department.create({ data: { name } }))
  );
  const deptByName = Object.fromEntries(depts.map((d) => [d.name, d]));

  // ---- One user per role (login accounts) ----
  const accounts: { email: string; name: string; role: any }[] = [
    { email: "admin@hms.dev",       name: "Asha Rao (Admin)",        role: "ADMIN" },
    { email: "doctor@hms.dev",      name: "Dr. Vikram Menon",        role: "DOCTOR" },
    { email: "nurse@hms.dev",       name: "Nurse Priya Nair",        role: "NURSE" },
    { email: "reception@hms.dev",   name: "Ravi Kumar (Reception)",  role: "RECEPTIONIST" },
    { email: "pharmacy@hms.dev",    name: "Sanjay Pharm",            role: "PHARMACIST" },
    { email: "lab@hms.dev",         name: "Lakshmi Lab",             role: "LAB_TECHNICIAN" },
    { email: "accounts@hms.dev",    name: "Deepak Accounts",         role: "ACCOUNTANT" },
  ];
  for (const a of accounts) {
    await prisma.user.create({ data: { ...a, passwordHash: pw } });
  }

  // ---- Doctors (with user accounts) ----
  const docDefs = [
    { name: "Dr. Vikram Menon",  spec: "Internal Medicine", dept: "General Medicine", fee: 600 },
    { name: "Dr. Neha Sharma",   spec: "Cardiologist",      dept: "Cardiology",       fee: 900 },
    { name: "Dr. Arjun Reddy",   spec: "Orthopedic Surgeon",dept: "Orthopedics",      fee: 800 },
    { name: "Dr. Meera Iyer",    spec: "Pediatrician",      dept: "Pediatrics",       fee: 700 },
    { name: "Dr. Sameer Khan",   spec: "Neurologist",       dept: "Neurology",        fee: 1000 },
  ];
  const doctors = [];
  for (const d of docDefs) {
    // reuse the doctor@hms.dev login for the first doctor; others get their own
    let user = await prisma.user.findFirst({ where: { name: d.name } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: d.name.toLowerCase().replace(/[^a-z]/g, "") + "@hms.dev",
          name: d.name, role: "DOCTOR", passwordHash: pw,
        },
      });
    }
    const doc = await prisma.doctor.create({
      data: {
        userId: user.id,
        specialization: d.spec,
        departmentId: deptByName[d.dept].id,
        consultationFee: d.fee,
      },
    });
    // Mon–Fri 9–17
    for (let day = 1; day <= 5; day++) {
      await prisma.doctorSchedule.create({
        data: { doctorId: doc.id, dayOfWeek: day, startTime: "09:00", endTime: "17:00" },
      });
    }
    doctors.push(doc);
  }

  // ---- Staff ----
  const staffDefs = [
    { email: "nurse@hms.dev", desig: "Head Nurse", shift: "Morning", sal: 35000 },
  ];
  for (const s of staffDefs) {
    const user = await prisma.user.findUnique({ where: { email: s.email } });
    if (user)
      await prisma.staff.create({
        data: {
          userId: user.id,
          employeeId: "EMP" + randInt(1000, 9999),
          designation: s.desig, shift: s.shift, salary: s.sal,
        },
      });
  }

  // ---- Patients ----
  const first = ["Aarav","Diya","Kabir","Ananya","Vivaan","Isha","Reyansh","Saanvi","Aditya","Myra","Arjun","Kiara","Rohan","Tara","Dev"];
  const last  = ["Sharma","Reddy","Nair","Patel","Rao","Iyer","Gupta","Menon","Singh","Das"];
  const blood = ["A+","B+","O+","AB+","A-","O-"];
  const patients = [];
  for (let i = 0; i < 40; i++) {
    const fn = rand(first), ln = rand(last);
    const p = await prisma.patient.create({
      data: {
        mrn: "MRN" + String(100000 + i),
        firstName: fn, lastName: ln,
        dob: new Date(randInt(1950, 2018), randInt(0, 11), randInt(1, 28)),
        gender: rand(["Male","Female"]),
        bloodGroup: rand(blood),
        phone: "9" + randInt(100000000, 999999999),
        email: `${fn.toLowerCase()}.${ln.toLowerCase()}@mail.com`,
        address: rand(["Hyderabad","Warangal","Karimnagar","Secunderabad"]),
        emgName: rand(first) + " " + ln,
        emgPhone: "9" + randInt(100000000, 999999999),
        emgRelation: rand(["Spouse","Parent","Sibling","Child"]),
        insProvider: rand(["Star Health","HDFC Ergo","ICICI Lombard", null as any]),
        insPolicyNo: "POL" + randInt(10000, 99999),
        allergies: rand(["None","Penicillin","Peanuts","Dust", "None"]),
      },
    });
    patients.push(p);
  }

  // ---- Counters (so live MRN/invoice generation continues past seed data) ----
  await prisma.counter.create({ data: { id: "mrn", value: 100000 + patients.length } });
  await prisma.counter.create({ data: { id: "invoice", value: 1000 } });

  // ---- Suppliers + Medicines ----
  const sup = await prisma.supplier.create({
    data: { name: "MedSupply Co.", phone: "9876500000", email: "sales@medsupply.dev" },
  });
  const medDefs = [
    ["Paracetamol 500mg","PARA500",2.5,500,50],
    ["Amoxicillin 250mg","AMOX250",6,40,50],   // low stock (below reorder)
    ["Azithromycin 500mg","AZI500",18,200,30],
    ["Ibuprofen 400mg","IBU400",3.2,15,40],    // low stock
    ["Cetirizine 10mg","CET10",1.8,800,60],
    ["Omeprazole 20mg","OME20",4.5,120,40],
    ["Metformin 500mg","MET500",2.2,18,50],    // low stock
    ["Atorvastatin 10mg","ATO10",7,300,30],
  ];
  for (const [name, sku, price, stock, reorder] of medDefs) {
    await prisma.medicine.create({
      data: {
        name: name as string, sku: sku as string,
        unitPrice: price as number, stock: stock as number,
        reorderLevel: reorder as number, supplierId: sup.id,
        category: "General",
        expiryDate: new Date(2026, randInt(6, 11), 1),
      },
    });
  }

  // ---- Beds ----
  const wards = [
    { ward: "General", count: 20, rate: 1000 },
    { ward: "ICU", count: 8, rate: 5000 },
    { ward: "Private", count: 10, rate: 3000 },
  ];
  const beds = [];
  for (const w of wards) {
    for (let i = 1; i <= w.count; i++) {
      const b = await prisma.bed.create({
        data: {
          bedNumber: `${w.ward[0]}-${i}`,
          ward: w.ward, dailyRate: w.rate,
          status: rand(["AVAILABLE","OCCUPIED","OCCUPIED","CLEANING","AVAILABLE"]) as any,
        },
      });
      beds.push(b);
    }
  }

  // ---- Appointments (today + spread) ----
  const today = new Date();
  let tokenCounter = 1;
  for (let i = 0; i < 60; i++) {
    const dayOffset = randInt(-20, 3);
    const at = new Date(today);
    at.setDate(today.getDate() + dayOffset);
    at.setHours(randInt(9, 16), rand([0, 30]), 0, 0);
    const isPast = dayOffset < 0;
    const isToday = dayOffset === 0;
    await prisma.appointment.create({
      data: {
        patientId: rand(patients).id,
        doctorId: rand(doctors).id,
        scheduledAt: at,
        token: tokenCounter++,
        status: isPast
          ? rand(["COMPLETED","COMPLETED","NO_SHOW","CANCELLED"]) as any
          : isToday
          ? rand(["BOOKED","CHECKED_IN","COMPLETED"]) as any
          : "BOOKED",
        reason: rand(["Fever","Follow-up","Chest pain","Routine checkup","Back pain","Headache"]),
      },
    });
  }

  // ---- Encounters + Lab orders + Invoices (revenue history) ----
  const months = 6;
  for (let m = 0; m < months; m++) {
    const count = randInt(20, 40);
    for (let i = 0; i < count; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - m);
      d.setDate(randInt(1, 28));
      const patient = rand(patients);
      const doctor = rand(doctors);

      const enc = await prisma.encounter.create({
        data: {
          patientId: patient.id, doctorId: doctor.id, type: "OPD",
          bpSystolic: randInt(110, 145), bpDiastolic: randInt(70, 95),
          pulse: randInt(60, 100), tempC: 36 + Math.random() * 2,
          weightKg: randInt(45, 95),
          symptoms: rand(["Fever, cough","Headache","Joint pain","Fatigue"]),
          diagnosis: rand(["Viral fever","Hypertension","Migraine","Gastritis","Arthritis"]),
          createdAt: d,
        },
      });

      // invoice
      const consultFee = doctor.consultationFee;
      const labCharge = Math.random() < 0.5 ? randInt(200, 800) : 0;
      const total = consultFee + labCharge;
      const inv = await prisma.invoice.create({
        data: {
          invoiceNo: "INV" + Date.now().toString().slice(-6) + randInt(100, 999),
          patientId: patient.id,
          status: rand(["PAID","PAID","PAID","UNPAID","PARTIAL"]) as any,
          total, paid: total, createdAt: d,
        },
      });
      await prisma.invoiceItem.create({
        data: { invoiceId: inv.id, label: "Consultation", category: "CONSULT", amount: consultFee },
      });
      if (labCharge > 0) {
        await prisma.invoiceItem.create({
          data: { invoiceId: inv.id, label: "Lab tests", category: "LAB", amount: labCharge },
        });
        await prisma.labOrder.create({
          data: {
            patientId: patient.id, encounterId: enc.id,
            testName: rand(["CBC","Lipid Profile","Blood Sugar","Thyroid Panel","Liver Function"]),
            status: m === 0 ? rand(["ORDERED","IN_PROGRESS","COMPLETED"]) as any : "COMPLETED",
            price: labCharge, orderedAt: d,
          },
        });
      }
    }
  }

  // a few pending lab orders for "today"
  for (let i = 0; i < 6; i++) {
    await prisma.labOrder.create({
      data: {
        patientId: rand(patients).id,
        testName: rand(["CBC","X-Ray Chest","MRI Brain","Blood Sugar","Urine Routine"]),
        status: rand(["ORDERED","SAMPLE_COLLECTED","IN_PROGRESS"]) as any,
        price: randInt(300, 2500),
      },
    });
  }

  console.log("Seed complete.");
  console.log("Login with any of: admin@hms.dev / doctor@hms.dev / nurse@hms.dev / reception@hms.dev / pharmacy@hms.dev / lab@hms.dev / accounts@hms.dev");
  console.log("Password for all: password");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
