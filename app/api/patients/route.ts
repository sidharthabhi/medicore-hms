import { prisma } from "@/lib/db";
import { requireAccess, errorResponse, HttpError } from "@/lib/guard";
import { str, phone, email, dateValue } from "@/lib/validate";
import { nextMrn } from "@/lib/refs";
import { audit } from "@/lib/audit";

// POST /api/patients — register a new patient
// Allowed: ADMIN, RECEPTIONIST (rbac surface "patients" with write intent)
export async function POST(req: Request) {
  try {
    const session = await requireAccess("patients");
    if (!["ADMIN", "RECEPTIONIST"].includes(session.role))
      throw new HttpError(403, "Only reception/admin may register patients");

    const b = await req.json();

    const firstName = str(b.firstName, "First name", { min: 1, max: 60 })!;
    const lastName  = str(b.lastName, "Last name", { min: 1, max: 60 })!;
    const dob       = dateValue(b.dob, "Date of birth")!;
    const gender    = str(b.gender, "Gender")!;
    const ph        = phone(b.phone, "Phone")!;
    const em        = email(b.email);
    const bloodGroup = str(b.bloodGroup, "Blood group", { optional: true });
    const address    = str(b.address, "Address", { optional: true });
    const emgName    = str(b.emgName, "Emergency name", { optional: true });
    const emgPhone   = phone(b.emgPhone, "Emergency phone", true);
    const emgRelation = str(b.emgRelation, "Emergency relation", { optional: true });
    const insProvider = str(b.insProvider, "Insurance provider", { optional: true });
    const insPolicyNo = str(b.insPolicyNo, "Policy number", { optional: true });
    const allergies   = str(b.allergies, "Allergies", { optional: true });

    if (dob.getTime() > Date.now()) throw new HttpError(422, "Date of birth cannot be in the future");

    // Duplicate guard: same name + dob + phone
    const dup = await prisma.patient.findFirst({
      where: { firstName, lastName, phone: ph, dob },
    });
    if (dup) throw new HttpError(409, `Possible duplicate of ${dup.mrn}`);

    const mrn = await nextMrn();
    const patient = await prisma.patient.create({
      data: {
        mrn, firstName, lastName, dob, gender, phone: ph,
        email: em, bloodGroup, address,
        emgName, emgPhone, emgRelation, insProvider, insPolicyNo, allergies,
      },
    });

    await audit(session.uid, "CREATE", "Patient", `${mrn} ${firstName} ${lastName}`);
    return Response.json({ id: patient.id, mrn: patient.mrn }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
