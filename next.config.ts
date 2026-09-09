import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev-only: izinkan akses JS bundle dari LAN IP (HP/laptop Aul di WiFi yang sama).
  // Hanya memengaruhi `next dev`; produksi (Vercel) tidak terpengaruh.
  allowedDevOrigins: ["192.168.1.26"],
};

export default nextConfig;
