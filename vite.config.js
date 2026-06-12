import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "localhost",   // Fuerza el uso de localhost para compatibilidad con Google OAuth
    proxy: {
      "/api": {
        // Usar 127.0.0.1 en lugar de localhost:
        // En Windows, localhost resuelve a ::1 (IPv6) pero el backend
        // solo escucha en 0.0.0.0 (IPv4), causando error de conexión → 500
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
      },
    },
  },
});

