import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Protect Admin Routes
    if (path.startsWith("/admin")) {
      if (token?.role !== "admin" && token?.role !== "super_admin") {
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }

    // Protect Nominations (only logged in users can nominate)
    if (path.startsWith("/elections/nominate")) {
       if (!token) {
           return NextResponse.redirect(new URL("/login", req.url));
       }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // Requires authentication for matching routes
    },
  }
);

// Define which paths this middleware runs on
export const config = {
  matcher: [
    "/admin/:path*",
    "/elections/nominate",
    // "/directory/:path*", // could protect directory if needed
  ],
};
