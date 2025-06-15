// gl-leather-designs-final-frontend/src/app/context/AuthContext.tsx

"use client"; // Marca este componente como un "Client Component"

import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { useRouter } from 'next/navigation'; // Importa useRouter para la redirección

// Interfaz para el objeto de usuario. Asegúrate de que 'id' coincida con tu backend (ej. MongoDB _id es string).
interface User {
  id: string; // Asumo que el _id de MongoDB es un string
  email: string;
  role: string; // Ej: 'admin', 'user'
}

// Interfaz para el valor del contexto de autenticación
interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean; // Indica si el contexto está cargando (ej. desde localStorage)
  isAuthenticated: boolean; // Propiedad derivada para verificar la autenticación
  login: (token: string, user: User) => void;
  logout: () => void;
}

// Crea el contexto. Inicializa con `undefined` para que TypeScript sepa que debe ser usado dentro de un Provider.
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // Estado de carga inicial
  const router = useRouter();

  useEffect(() => {
    const loadAuthData = () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          // Opcional: decodifica el token para verificar su validez/expiración
          // Por ahora, asumimos que si existe, es válido hasta que falle una petición.
          const parsedUser: User = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsedUser);
        }
      } catch (e: unknown) { // CORREGIDO: Tipado de 'err' a 'unknown'
        console.error("Error al cargar o parsear datos de autenticación de localStorage:", e);
        // Si hay un error (ej. JSON inválido), limpia el localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false); // La carga inicial ha terminado
      }
    };

    loadAuthData();
  }, []); // Se ejecuta solo una vez al montar

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    router.push('/login'); // Redirige al login después de cerrar sesión
  };

  // `isAuthenticated` es una propiedad derivada para mayor comodidad.
  const isAuthenticated = !!token && !!user;

  const contextValue: AuthContextType = {
    user,
    token,
    loading,
    isAuthenticated, // ¡Esta propiedad es crucial y se exporta aquí!
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el contexto, asegurando que se use dentro de AuthProvider.
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};