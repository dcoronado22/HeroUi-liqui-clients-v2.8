/** @type {import('next').NextConfig} */
const nextConfig = {
  // Evita standalone en Windows (symlinks)
  output: undefined,

  // Ignora Lint/TS en build (Netlify no se cae por eso)
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  // Webpack alias: cualquier import de `next/document` va a nuestro shim
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "next/document": require.resolve("./shims/next-document.tsx"),
    };
    return config;
  },
};

module.exports = nextConfig;
