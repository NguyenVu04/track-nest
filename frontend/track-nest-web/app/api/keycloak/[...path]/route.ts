/**
 * Development-only Keycloak reverse proxy.
 *
 * Why this exists:
 *   keycloak-js runs inside the browser and calls Keycloak token/userinfo
 *   endpoints directly via fetch(). The production Keycloak server does not
 *   include an Access-Control-Allow-Origin header for http://localhost:3000,
 *   so browsers block those requests.
 *
 * How it works:
 *   1. NEXT_PUBLIC_KEYCLOAK_URL is set to http://localhost:3000/api/keycloak
 *      in .env.local so keycloak-js targets THIS proxy instead of production.
 *   2. For the OIDC discovery document the proxy rewrites all upstream URLs in
 *      the response body so keycloak-js continues to route through here.
 *   3. For the /auth (login) endpoint the proxy issues a 302 redirect to the
 *      real Keycloak login UI — the browser navigates there directly (browser
 *      navigations are not subject to CORS).
 *   4. All other requests (token, userinfo, certs, …) are forwarded
 *      server-to-server; the response is returned as-is.
 *
 * Security: the route returns 403 in any NODE_ENV other than "development".
 */

import { NextRequest, NextResponse } from "next/server";

// Server-side only env var — never exposed in the client bundle.
const UPSTREAM =
  process.env.KEYCLOAK_UPSTREAM_URL ?? "https://tracknestapp.org/auth";

// Headers we forward to Keycloak (allowlist to avoid leaking internal headers).
const FORWARDED_REQUEST_HEADERS = [
  "content-type",
  "authorization",
  "accept",
  "accept-language",
  "accept-encoding",
];

// Headers we strip from the upstream response to avoid transfer issues.
const STRIPPED_RESPONSE_HEADERS = new Set([
  "transfer-encoding",
  "connection",
  "keep-alive",
  "te",
  "trailer",
  "upgrade",
]);

async function handleProxy(
  request: NextRequest,
  pathSegments: string[],
): Promise<NextResponse> {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse("This proxy is only available in development.", {
      status: 403,
    });
  }

  const path = pathSegments.join("/");
  const targetUrl = `${UPSTREAM}/${path}${request.nextUrl.search}`;

  // ── Authorization endpoint ──────────────────────────────────────────────
  // keycloak-js sets window.location.href to this URL, which navigates the
  // browser to Keycloak's login UI. We redirect to the real URL so the
  // browser ends up on the production Keycloak page. After successful login
  // Keycloak redirects the user back to localhost:3000 with the auth code.
  const isAuthEndpoint =
    path.includes("/protocol/openid-connect/auth") &&
    request.method === "GET";
  if (isAuthEndpoint) {
    return NextResponse.redirect(targetUrl);
  }

  // ── Build forwarded headers ─────────────────────────────────────────────
  const forwardedHeaders: Record<string, string> = {};
  for (const [key, value] of request.headers.entries()) {
    if (FORWARDED_REQUEST_HEADERS.includes(key.toLowerCase())) {
      forwardedHeaders[key] = value;
    }
  }

  // ── Read request body (token endpoint uses POST with form body) ──────────
  let body: string | undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    body = await request.text();
  }

  // ── Forward to upstream Keycloak ─────────────────────────────────────────
  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(targetUrl, {
      method: request.method,
      headers: forwardedHeaders,
      body,
    });
  } catch (err) {
    console.error("[keycloak-proxy] upstream fetch failed:", err);
    return new NextResponse("Upstream Keycloak unreachable.", { status: 502 });
  }

  // ── OIDC discovery document — rewrite all upstream URLs ─────────────────
  // keycloak-js reads token_endpoint, authorization_endpoint, etc. from this
  // document. We rewrite them so they all point back to this proxy.
  const isDiscovery = path.includes(".well-known/openid-configuration");
  if (isDiscovery) {
    const text = await upstreamResponse.text();
    const proxyBase = `${request.nextUrl.origin}/api/keycloak`;
    const rewritten = text.replaceAll(UPSTREAM, proxyBase);
    return new NextResponse(rewritten, {
      status: upstreamResponse.status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache",
      },
    });
  }

  // ── Passthrough ──────────────────────────────────────────────────────────
  const responseHeaders: Record<string, string> = {};
  upstreamResponse.headers.forEach((value, key) => {
    if (!STRIPPED_RESPONSE_HEADERS.has(key.toLowerCase())) {
      responseHeaders[key] = value;
    }
  });

  return new NextResponse(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: responseHeaders,
  });
}

// ── Route handlers ────────────────────────────────────────────────────────

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return handleProxy(request, path);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return handleProxy(request, path);
}

export async function OPTIONS(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return handleProxy(request, path);
}
