// gl-leather-designs-final-frontend/app/login/page.tsx

'use client';

import React, { useState, useContext } from 'react';
import axios, { AxiosError } from 'axios';
// import { useRouter } from 'next/navigation'; // Eliminado para resolver error de compilación
import { AuthContext } from '../context/AuthContext'; // Importado AuthContext

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // const router = useRouter(); // Eliminado para resolver error de compilación
  const authContext = useContext(AuthContext); // Accede al contexto de autenticación

  // Asegúrate de que authContext no sea null antes de desestructurar
  if (!authContext) {
    // Esto debería ser manejado por un AuthProvider envolviendo el árbol de la app
    // Si llegamos aquí, es un error de configuración en el _app.tsx o layout.tsx
    console.error("AuthContext no disponible. Asegúrate de que AuthProvider esté envolviendo tu aplicación.");
    return <div className="flex items-center justify-center min-h-screen">Error de Configuración de Autenticación</div>;
  }

  const { login } = authContext; // Obtiene la función login del contexto

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const { data } = await axios.post(`${backendUrl}/api/login`, {
        email,
        password,
      });

      const { token, user } = data;

      // Usar la función login del contexto para actualizar el estado global y localStorage
      login(token, user);

      setSuccess('¡Inicio de sesión exitoso!');
      // router.push('/products'); // Reemplazado por window.location.href
      window.location.href = '/products';

    } catch (err: unknown) {
      console.error('Error durante el login:', err);
      if (axios.isAxiosError(err) && err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Correo o contraseña incorrectos.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">Iniciar Sesión</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
              Correo Electrónico:
            </label>
            <input
              type="email"
              id="email"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-label="Correo electrónico"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
              Contraseña:
            </label>
            <input
              type="password"
              id="password"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              aria-label="Contraseña"
            />
          </div>
          {error && (
            <p className="text-red-500 text-xs italic mb-4">{error}</p>
          )}
          {success && (
            <p className="text-green-500 text-xs italic mb-4">{success}</p>
          )}
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
            </button>
            <a
              href="/register"
              className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800"
            >
              ¿No tienes cuenta? Regístrate
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;