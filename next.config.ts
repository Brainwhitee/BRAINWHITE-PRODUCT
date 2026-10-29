import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["web-tree-sitter", "tree-sitter-wasms", "tar", "typescript"],
};

export default nextConfig;
