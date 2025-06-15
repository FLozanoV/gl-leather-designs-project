// gl-leather-designs-final-frontend/next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración para el componente Image de Next.js
  images: {
    // Define los patrones de origen remoto para las imágenes permitidas
    remotePatterns: [
      {
        protocol: 'http', // Protocolo para tu backend (cambiar a 'https' si usas HTTPS en producción)
        hostname: 'localhost', // Nombre de host de tu servidor backend
        port: '5000', // Puerto de tu servidor backend
        pathname: '/uploads/**', // Ruta dentro de tu backend donde se almacenan las imágenes cargadas
      },
    ],
  },
};

module.exports = nextConfig;