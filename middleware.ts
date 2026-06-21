import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig, PROTECTED } from "@/auth.config";

const { auth } = NextAuth(authConfig);

const isDev = process.env.NODE_ENV !== "production";

function buildCsp(nonce: string): string {
  // ponytail: strict nonce CSP. style-src keeps 'unsafe-inline' — next/font, recharts and @dnd-kit
  // emit inline style attributes (governed by style-src, not script-src). 'strict-dynamic' lets
  // Next's nonce'd bootstrap load its own chunks.
  return [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob:`,
    `font-src 'self'`,
    `connect-src 'self'`,
    `worker-src 'self'`,
    `manifest-src 'self'`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `object-src 'none'`,
    `upgrade-insecure-requests`,
  ].join("; ");
}

export default auth((req) => {
  // Per-request nonce via Web Crypto (edge runtime has no Node Buffer).
  const nonce = btoa(String.fromCharCode(...Array.from(crypto.getRandomValues(new Uint8Array(16)))));
  const csp = buildCsp(nonce);

  // Auth gate (replaces the now-redundant `authorized` callback under the wrapper form).
  const path = req.nextUrl.pathname;
  const isProtected = PROTECTED.some((p) => path === p || path.startsWith(p + "/"));
  if (isProtected && !req.auth) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Expose nonce + CSP on the request so Next applies the nonce to its own <script> tags.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set("Content-Security-Policy", csp);
  return res;
});

export const config = {
  // All routes except static assets / Next internals.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml|manifest.webmanifest|sw.js).*)",
  ],
};
