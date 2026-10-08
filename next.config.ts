import type { NextConfig } from 'next';
const config: NextConfig = {
 poweredByHeader: false,
 allowedDevOrigins: process.env.APP_ORIGIN ? [new URL(process.env.APP_ORIGIN).hostname] : [],
 async headers() { return [{source: '/(.*)', headers: [
  {key: 'X-Content-Type-Options', value: 'nosniff'},
  {key: 'X-Frame-Options', value: 'DENY'},
  {key: 'Referrer-Policy', value: 'same-origin'},
  {key: 'Content-Security-Policy', value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'"}
 ]}]; }
};
export default config;