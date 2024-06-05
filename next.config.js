/** @type {import('next').NextConfig} */

const { joinURL } = require("ufo");

const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  swcMinify: true,
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/u/:path*",
          has: [
            {
              type: "header",
              key: "accept",
              value: "application/activity\\+json",
            },
          ],
          destination: joinURL(process.env.NEXT_PUBLIC_HOST, "/u/:path*"),
        },
        {
          source: "/u/:username/follow",
          destination: joinURL(process.env.NEXT_PUBLIC_HOST, "/u/:username/follow"),
        },
      ],
    };
  },
};

module.exports = nextConfig;
