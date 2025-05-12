/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/v1/:path*',
      },
    ];
  },
  // next.config.js
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({ "firebase-admin": "commonjs firebase-admin" });
    }
    return config;
  },

};


export { nextConfig as default };