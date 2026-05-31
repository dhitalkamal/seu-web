import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/iam/": "http://localhost",
      "/event/": "http://localhost",
      "/org/": "http://localhost",
      "/venue/": "http://localhost",
      "/volunteer/": "http://localhost",
      "/community/": "http://localhost",
      "/marketing/": "http://localhost",
      "/participation/": "http://localhost",
      "/payment/": "http://localhost",
      "/notification/": "http://localhost",
      "/intelligence/": "http://localhost",
    },
  },
});
