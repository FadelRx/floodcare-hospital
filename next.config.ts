import type { NextConfig } from "next";
export function buildSecurityHeaders(production: boolean) {
  const scriptSrc = ["'self'", "'unsafe-inline'", ...(production ? [] : ["'unsafe-eval'"])].join(" ");
  const csp = ["default-src 'self'", `script-src ${scriptSrc}`, "style-src 'self' 'unsafe-inline'", "img-src 'self' data:", "font-src 'self'", "connect-src 'self'", "worker-src 'self' blob:", "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'"].join("; ");
  return [
    { key: "Content-Security-Policy", value: csp },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  ];
}
const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() { return [{ source: "/(.*)", headers: buildSecurityHeaders(process.env.NODE_ENV === "production") }]; },
};
export default config;
