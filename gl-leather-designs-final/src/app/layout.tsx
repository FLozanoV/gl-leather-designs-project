// src/app/layout.tsx
import './globals.css';
import { Inter } from 'next/font/google';
import { AuthProvider } from './context/AuthContext'; // Importa el AuthProvider

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'GL Leather Designs',
  description: 'Productos de cuero artesanales',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider> {/* Envuelve tu aplicación con el AuthProvider */}
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}