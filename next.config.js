/** @type {import('next').NextConfig} */

const { joinURL } = require("ufo");

const nextConfig = {
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
      ],
    };
  },
};

module.exports = nextConfig;
