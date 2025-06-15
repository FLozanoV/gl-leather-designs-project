// gl-leather-designs-final-frontend/src/app/products/page.tsx

"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/app/context/AuthContext';


interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  image_url: string | null;
  category: string;
  created_at: string;
}

interface RawProductData {
  _id?: string;
  id?: string;
  name?: string;
  description?: string | null;
  price?: number;
  stock?: number;
  image_url?: string | null;
  category?: string;
  created_at?: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {
    if (!backendUrl) {
      console.error('NEXT_PUBLIC_BACKEND_URL no está definido. Por favor, configura tu archivo .env.local');
      setError('Error de configuración: URL del backend no definida.');
      setLoading(false);
      return;
    }

    if (authLoading) {
      return;
    }

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${backendUrl}/api/products`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al cargar los productos.');
        }
        const data = await response.json();

        const processedProducts: Product[] = data.map((product: unknown) => {
          if (typeof product !== 'object' || product === null) {
            console.warn('Saltando datos de producto inválidos:', product);
            return null;
          }

          const p = product as RawProductData;

          const currentProcessedProduct: Product = {
            id: p._id || p.id || '',
            name: p.name || '',
            description: p.description || null,
            price: Number(p.price) || 0,
            stock: Number(p.stock) || 0,
            image_url: p.image_url || null,
            category: p.category || 'Sin categoría',
            created_at: p.created_at || new Date().toISOString(),
          };
          return currentProcessedProduct;
        }).filter(Boolean) as Product[];

        setProducts(processedProducts);
      } catch (err: unknown) {
        console.error('Error al cargar los productos:', err);
        let errorMessage = 'Error al cargar los productos. Por favor, inténtalo de nuevo más tarde.';
        if (err instanceof Error) {
          errorMessage = err.message;
        } else if (typeof err === 'string') {
          errorMessage = err;
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [backendUrl, authLoading]);

  if (loading) {
    return (
      <main className="min-h-screen p-8 flex items-center justify-center bg-gray-100">
        <p className="text-xl font-semibold text-gray-700">Cargando productos...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen p-8 flex items-center justify-center bg-gray-100">
        <div className="bg-white p-10 rounded-xl shadow-lg max-w-lg w-full text-center rounded-lg">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error al cargar los productos</h1>
          <p className="text-lg text-gray-700 mb-6">{error}</p>
          <Link href="/" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out rounded-md">
            Volver a Inicio
          </Link>
        </div>
      </main>
    );
  }

  const hasProducts = products.length > 0;

  return (
    <main className="min-h-screen p-8 bg-gray-100">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 text-center mb-8">Nuestros Productos</h1>

        {isAuthenticated && user?.role === 'admin' && (
          <div className="text-center mb-8">
            <Link href="/products/new" className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 rounded-md">
              Añadir Nuevo Producto
            </Link>
          </div>
        )}

        {!hasProducts ? (
          <div className="bg-white p-10 rounded-xl shadow-lg max-w-lg mx-auto text-center rounded-lg">
            <p className="text-xl text-gray-700">No hay productos disponibles.</p>
            {isAuthenticated && user?.role === 'admin' && (
              <p className="text-md text-gray-600 mt-4">¿Por qué no añades uno?</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col transform transition duration-300 ease-in-out hover:scale-105">
                <Link href={`/products/${product.id}`} className="block">
                  <div className="relative w-full h-48 bg-gray-200 rounded-t-xl overflow-hidden">
                    {product.image_url ? (
                      <Image
                        src={`${backendUrl}${product.image_url.startsWith('/') ? '' : '/'}${product.image_url}`}
                        alt={product.name}
                        fill // *** CAMBIADO: Usar 'fill' en lugar de 'layout="fill"' [cite: image_4431dc.png] ***
                        className="object-cover rounded-t-xl" // *** CAMBIADO: 'objectFit' ahora es una clase de Tailwind [cite: image_4431dc.png] ***
                        unoptimized
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500 bg-gray-300 rounded-t-xl">
                        No hay imagen disponible
                      </div>
                    )}
                  </div>
                  <div className="p-6 flex-grow">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-2 truncate">{product.name}</h2>
                    <p className="text-gray-600 text-lg mb-3">${product.price.toFixed(2)}</p>
                    <p className="text-gray-500 text-sm">{product.category}</p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}