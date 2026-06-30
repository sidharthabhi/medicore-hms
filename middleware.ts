import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-secret-change-me");
const PROTECTED = ["/dashboard","/patients","/appointments","/doctors","/emr","/pharmacy","/lab","/beds","/billing","/staff","/reports"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!PROTECTED.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const token = req.cookies.get("hms_session")?.value;
  if (!token) return NextResponse.redirect(new URL("/login", req.url));
  try {
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/dashboard/:path*","/patients/:path*","/appointments/:path*","/doctors/:path*","/emr/:path*","/pharmacy/:path*","/lab/:path*","/beds/:path*","/billing/:path*","/staff/:path*","/reports/:path*"],
};
