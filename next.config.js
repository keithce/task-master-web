/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  distDir: "out",
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Ensure consistent behavior across environments
  env: {
    NEXT_PUBLIC_IS_STATIC_EXPORT: "true",
  },
  // Configure output file tracing to handle workspace structure
  outputFileTracingRoot: __dirname,
  // Disable features that require server runtime
  poweredByHeader: false,
  // Ensure static generation
  generateEtags: false,
};

module.exports = nextConfig;
