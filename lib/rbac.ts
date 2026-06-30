export type Role =
  | "ADMIN" | "DOCTOR" | "NURSE" | "RECEPTIONIST"
  | "PHARMACIST" | "LAB_TECHNICIAN" | "ACCOUNTANT" | "PATIENT";

// Surface key -> roles allowed to access it
export const ACCESS: Record<string, Role[]> = {
  dashboard:    ["ADMIN","DOCTOR","NURSE","RECEPTIONIST","PHARMACIST","LAB_TECHNICIAN","ACCOUNTANT"],
  patients:     ["ADMIN","DOCTOR","NURSE","RECEPTIONIST"],
  appointments: ["ADMIN","DOCTOR","NURSE","RECEPTIONIST"],
  doctors:      ["ADMIN","RECEPTIONIST"],
  emr:          ["ADMIN","DOCTOR","NURSE"],
  pharmacy:     ["ADMIN","PHARMACIST","DOCTOR"],
  lab:          ["ADMIN","LAB_TECHNICIAN","DOCTOR"],
  beds:         ["ADMIN","NURSE","RECEPTIONIST"],
  billing:      ["ADMIN","ACCOUNTANT","RECEPTIONIST"],
  staff:        ["ADMIN"],
  reports:      ["ADMIN","ACCOUNTANT"],
};

export function can(role: Role, surface: string): boolean {
  return ACCESS[surface]?.includes(role) ?? false;
}

export const NAV: { key: string; label: string; icon: string }[] = [
  { key: "dashboard",    label: "Dashboard",    icon: "grid" },
  { key: "patients",     label: "Patients",     icon: "users" },
  { key: "appointments", label: "Appointments", icon: "calendar" },
  { key: "doctors",      label: "Doctors",      icon: "stethoscope" },
  { key: "emr",          label: "Records",      icon: "file" },
  { key: "pharmacy",     label: "Pharmacy",     icon: "pill" },
  { key: "lab",          label: "Laboratory",   icon: "flask" },
  { key: "beds",         label: "Beds & Wards", icon: "bed" },
  { key: "billing",      label: "Billing",      icon: "receipt" },
  { key: "staff",        label: "Staff",        icon: "id" },
  { key: "reports",      label: "Reports",      icon: "chart" },
];
