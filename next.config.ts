import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Indicador de rota do Next em dev (canto inferior esquerdo) desligado —
  // não faz parte da UI real do experimento, só polui prints/telas.
  devIndicators: false,
};

export default nextConfig;
