import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get("vendor_session");
  const { pathname } = request.nextUrl;

  let isValid = false;
  if (sessionCookie) {
    try {
      const decoded = decodeURIComponent(sessionCookie.value);
      const session = JSON.parse(decoded);
      isValid = Date.now() < session.expires_at;
    } catch {
      // invalid cookie — treat as missing
    }
  }

  if (isValid && pathname === "/vendors/signup") {
    return NextResponse.redirect(new URL("/vendors/new-product", request.url));
  }

  if (!isValid && (pathname === "/vendors/profile" || pathname === "/vendors/new-product")) {
    return NextResponse.redirect(new URL("/vendors/signup", request.url));
  }

  return NextResponse.next();
}
