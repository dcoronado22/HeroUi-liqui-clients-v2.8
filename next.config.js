/** @type {import('next').NextConfig} */
const nextConfig = {
     eslint: {
    // ❌ No fallar el build por errores de lint
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ❌ No fallar el build por errores de types
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
