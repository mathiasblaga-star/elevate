import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/habits/:path*",
    "/goals/:path*",
    "/journal/:path*",
    "/mood/:path*",
    "/settings/:path*",
  ],
};
