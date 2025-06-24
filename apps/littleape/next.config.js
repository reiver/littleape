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

  swcMinify: false,
  webpack: (config, { isServer }) => {
    // Add SVGR loader for SVG files
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    return config;
  },
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
        {
          source: '/:roomname/conf/:timestamp',
          destination: '/log/:roomname/:timestamp',
        },
        {
          source: '/:roomname/log/:timestamp',
          destination: '/log/:roomname/:timestamp',
        },
        {
          source: '/',
          destination: '/auth/login',
        },
        {
          source:'/:hostname/host',
          destination:'/testing/:hostname/host'
        }
      ],
    };
  },
};

module.exports = nextConfig;
