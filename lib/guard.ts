import { getSession, Session } from "./auth";
import { can, Role } from "./rbac";

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

/** Require a logged-in user. Throws 401 if none. */
export async function requireSession(): Promise<Session> {
  const s = await getSession();
  if (!s) throw new HttpError(401, "Not authenticated");
  return s;
}

/** Require a logged-in user whose role may access `surface`. Throws 401/403. */
export async function requireAccess(surface: string): Promise<Session> {
  const s = await requireSession();
  if (!can(s.role as Role, surface)) throw new HttpError(403, "Forbidden");
  return s;
}

/** Require the user to hold one of the given roles explicitly. */
export async function requireRole(...roles: Role[]): Promise<Session> {
  const s = await requireSession();
  if (!roles.includes(s.role as Role)) throw new HttpError(403, "Forbidden");
  return s;
}

/** Turn a thrown HttpError (or unknown) into a JSON Response. */
export function errorResponse(e: unknown) {
  if (e instanceof HttpError)
    return Response.json({ error: e.message }, { status: e.status });
  console.error(e);
  return Response.json({ error: "Internal server error" }, { status: 500 });
}
