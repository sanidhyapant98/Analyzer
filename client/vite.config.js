import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // During development, React runs on 5173 and Express on 5000.
    // Any request to /api/... is forwarded to Express automatically,
    // so the frontend code can just use "/api/analyze" with no URL juggling.
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
