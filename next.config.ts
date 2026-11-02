import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["web-tree-sitter", "tree-sitter-wasms", "tar"],
  outputFileTracingIncludes: {
    "/**": [
      "./node_modules/tree-sitter-wasms/out/*.wasm",
      "./node_modules/web-tree-sitter/*.wasm",
    ],
  },
};

export default nextConfig;
