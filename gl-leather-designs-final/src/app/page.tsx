// gl-leather-designs-final-frontend/app/page.tsx

import Link from 'next/link'; // Importa el componente Link de Next.js
import React from 'react';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-300 text-gray-800 p-4">
      <h1 className="text-5xl font-extrabold text-gray-900 mb-6 drop-shadow-lg text-center">
        Bienvenido a G. L. LEATHER DESIGNS
      </h1>
      <p className="text-xl text-gray-700 mb-8 max-w-2xl text-center">
        Explora nuestros productos de cuero de alta calidad, hechos a mano con pasión y precisión.
      </p>

      <div className="flex flex-col sm:flex-row gap-6">
        {/* Enlace a la página de Productos */}
        <Link href="/products" passHref>
          <button className="px-8 py-4 bg-blue-600 text-white font-bold text-lg rounded-full shadow-xl hover:bg-blue-700 transition duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300">
            Ver Productos
          </button>
        </Link>

        {/* Enlace a la página de Iniciar Sesión */}
        <Link href="/login" passHref>
          <button className="px-8 py-4 bg-green-600 text-white font-bold text-lg rounded-full shadow-xl hover:bg-green-700 transition duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300">
            Iniciar Sesión
          </button>
        </Link>

        {/* Enlace a la página de Registro */}
        <Link href="/register" passHref>
          <button className="px-8 py-4 bg-purple-600 text-white font-bold text-lg rounded-full shadow-xl hover:bg-purple-700 transition duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-300">
            Registrarse
          </button>
        </Link>
        
        {/* Enlace a la página de Sobre Nosotros (si existe o la crearás) */}
        <Link href="/about" passHref>
          <button className="px-8 py-4 bg-indigo-600 text-white font-bold text-lg rounded-full shadow-xl hover:bg-indigo-700 transition duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-300">
            Sobre Nosotros
          </button>
        </Link>
      </div>

      <p className="mt-12 text-sm text-gray-600">
        Esta es la página de inicio del frontend.
      </p>
    </div>
  );
}