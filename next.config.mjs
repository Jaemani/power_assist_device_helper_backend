/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
      return [
        {
          source: '/api/vehicles',
          destination: '/api/v1/vehicles', // 내부는 v1이지만 외부는 깔끔하게 유지
        },
      ];
    },
  };
  
  export default nextConfig;
  