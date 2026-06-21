import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/ratelimit";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        await prisma.user.upsert({
          where: { email: user.email },
          update: { name: user.name ?? undefined },
          create: { email: user.email, name: user.name ?? null, passwordHash: "" },
        });
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user?.email && account?.provider === "google") {
        const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
        if (dbUser) token.id = dbUser.id;
      } else if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (creds) => {
        const parsed = loginSchema.safeParse(creds);
        if (!parsed.success) return null;
        // ponytail: per-email throttle (5/60s). IP-keying needs the request, not exposed in
        // authorize — add a thin /api/auth login proxy if IP limits matter.
        const { success } = await rateLimit(`login:${parsed.data.email.toLowerCase()}`);
        if (!success) return null;
        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user) return null;
        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;
        return { id: user.id, email: user.email, name: user.name ?? undefined };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID
      ? [Google({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        })]
      : []),
  ],
});
