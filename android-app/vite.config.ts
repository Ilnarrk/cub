import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    preserveSymlinks: true,
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "../frontend/src/shared"),
      "@widgets": path.resolve(__dirname, "../frontend/src/widgets"),
      react: path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
      three: path.resolve(__dirname, "node_modules/three"),
      "@react-three/fiber": path.resolve(
        __dirname,
        "node_modules/@react-three/fiber",
      ),
      "@react-three/drei": path.resolve(
        __dirname,
        "node_modules/@react-three/drei",
      ),
      "lucide-react": path.resolve(__dirname, "node_modules/lucide-react"),
      clsx: path.resolve(__dirname, "node_modules/clsx"),
      "tailwind-merge": path.resolve(__dirname, "node_modules/tailwind-merge"),
    },
    dedupe: ["react", "react-dom", "three"],
  },
  server: { fs: { allow: [path.resolve(__dirname, "..")] } },
  build: { target: "es2020" },
});
