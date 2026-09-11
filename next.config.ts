import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev-only: izinkan akses JS bundle dari LAN IP (HP/laptop Aul di WiFi yang sama)
  // dan dari localhost/127.0.0.1 (uji lokal di VM ini).
  // Hanya memengaruhi `next dev`; produksi (Vercel) tidak terpengaruh.
  allowedDevOrigins: ["192.168.1.26", "127.0.0.1", "localhost"],
};

export default nextConfig;
