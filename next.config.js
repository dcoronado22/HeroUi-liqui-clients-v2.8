/** @type {import('next').NextConfig} */
const nextConfig = {
  // Evita standalone (symlinks en Windows).
  output: undefined,

  // No bloquees el deploy por lint/TS.
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      // 🔑 Alias crítico: todo "next/document" → nuestro shim
      "next/document": require.resolve("./shims/next-document.tsx"),
    };
    return config;
  },
};

module.exports = nextConfig;
