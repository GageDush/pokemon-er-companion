import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: process.env.GITHUB_PAGES === "1" ? "/pokemon-er-companion/" : "/",
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false
  },
  build: {
    target: "es2022"
  }
});
