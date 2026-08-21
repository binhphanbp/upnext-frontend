import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// API_PROXY_ORIGIN is a server-only var that must point to the real backend
// (e.g. https://api-staging.upnext.works). It is not wired up in Dockerfile
// or the deploy pipeline, so it is never set at runtime — falling back
// straight to localhost:3001 there means every proxied /api/v1/* call fails
// (nothing listens on that port inside the frontend container). Fall back to
// the already build-baked NEXT_PUBLIC_API_BASE_URL (stripped of its /api/v1
// suffix) before giving up and using the dev-only localhost default.
const apiProxyOrigin =
  process.env.API_PROXY_ORIGIN ??
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/api\/v1\/?$/u, "") ??
  "http://localhost:3001";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    globalNotFound: true,
    optimizePackageImports: [
      "@phosphor-icons/react",
      "@phosphor-icons/react/dist/ssr",
      "date-fns",
      "recharts",
      "@dnd-kit/core",
      "@dnd-kit/sortable",
      "@dnd-kit/utilities",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-label",
      "@radix-ui/react-popover",
      "@radix-ui/react-scroll-area",
      "@radix-ui/react-select",
      "@radix-ui/react-separator",
      "@radix-ui/react-slot",
      "@radix-ui/react-tabs",
      "@radix-ui/react-tooltip",
      "@tanstack/react-query",
      "@tanstack/react-table",
      "motion",
      "next-intl",
      "sonner",
      "sweetalert2",
      "clsx",
      "tailwind-merge",
    ],
  },
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.seed-home-test.local",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3001",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "itviec.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.itviec.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.vietqr.io",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "api.vietqr.io",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.vietqr.io",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "vietqr.co",
        port: "",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
  async rewrites() {
    const proxyOrigin = apiProxyOrigin.replace(/\/$/u, "");

    return [
      {
        source: "/api/home",
        destination: `${proxyOrigin}/api/home`,
      },
      {
        source: "/api/home/:path*",
        destination: `${proxyOrigin}/api/home/:path*`,
      },
      {
        source: "/api/v1/:path*",
        destination: `${proxyOrigin}/api/v1/:path*`,
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
