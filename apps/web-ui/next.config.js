/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable standalone output for minimal production Docker images
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.panda-ng.com' },
      { protocol: 'https', hostname: 'cdn.panda-ng.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // 'unsafe-eval' and 'unsafe-inline' removed from script-src for production security.
              // Use a nonce-based CSP middleware (see Next.js docs) to allow inline scripts.
              // Note: 'unsafe-inline' is retained in style-src for CSS-in-JS compatibility.
              "script-src 'self'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https:",
              "connect-src 'self' wss: https:",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
