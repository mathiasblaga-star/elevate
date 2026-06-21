import type { NextAuthConfig } from "next-auth";

export const PROTECTED = ["/dashboard", "/habits", "/goals", "/journal", "/mood", "/settings"];

// Edge-safe config (no DB / bcrypt imports) — shared by middleware and the full auth instance.
export const authConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [], // real providers added in lib/auth.ts
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const path = request.nextUrl.pathname;
      const isProtected = PROTECTED.some((p) => path.startsWith(p));
      if (isProtected) return isLoggedIn; // false -> redirect to signIn page
      return true;
    },
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.id && session.user) session.user.id = token.id as string;
      return session;
    },
  },
} satisfies NextAuthConfig;
