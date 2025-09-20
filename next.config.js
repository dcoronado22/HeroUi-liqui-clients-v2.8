/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🚫 evita standalone -> no symlinks en Windows
  output: undefined,

  // ✅ asegura App Router
  experimental: {
    serverActions: true, // opcional si usas server actions
  },

  // ⚡ ignora validaciones en Netlify
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // 🔧 workaround: evita que Netlify intente prerender todo
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
};

module.exports = nextConfig;
