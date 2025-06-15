// gl-leather-designs-final/src/app/products/new/page.tsx

"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Definición de la interfaz del producto para mayor claridad y tipado
// Ajuste: price se mantiene como string para el estado inicial del input
interface Product {
  id: number;
  name: string;
  description?: string | null;
  price: number; // Esto será un número después de parseFloat antes de enviar
  stock: number;
  image_url?: string | null; // Asegúrate de que esta propiedad también esté aquí
  created_at?: string;
}

// Interfaz para la estructura de respuesta de error del backend
interface BackendErrorResponse {
  message?: string;
  error?: string; // Por si el backend envía un campo 'error' además de 'message'
}

export default function NewProductPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(''); // El input type="number" devuelve string
  const [stock, setStock] = useState(''); // El input type="number" devuelve string
  // AÑADIDO: Nuevo estado para el archivo de imagen
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Función para manejar cuando el usuario selecciona un archivo
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      console.log("Frontend: Archivo seleccionado:", event.target.files[0].name);
      setSelectedFile(event.target.files[0]);
    } else {
      console.log("Frontend: No se seleccionó ningún archivo.");
      setSelectedFile(null);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Previene el comportamiento por defecto del formulario

    console.log("Frontend: handleSubmit iniciado para nuevo producto.");

    setLoading(true);
    setError(null);
    setSuccess(null);

    // --- Validación de campos ---
    console.log("Frontend: Validando campos...");

    if (!name.trim()) {
      setError("El nombre del producto es obligatorio.");
      setLoading(false);
      return;
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setError("El precio debe ser un número válido y mayor que cero.");
      setLoading(false);
      return;
    }

    // parseInt convierte un string vacío a NaN. Si es NaN, queremos que sea 0 para el stock.
    const parsedStock = stock.trim() === '' ? 0 : parseInt(stock, 10);

    if (isNaN(parsedStock) || parsedStock < 0) {
      setError("El stock debe ser un número entero válido y no negativo, o dejarlo vacío para 0.");
      setLoading(false);
      return;
    }

    console.log("Frontend: Validación de campos completada con éxito. Preparando FormData.");

    // --- Creación de FormData para enviar datos y archivo ---
    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('description', description.trim() || ''); // Si es vacío, envía string vacío
    formData.append('price', parsedPrice.toString()); // Convertir de nuevo a string para FormData
    formData.append('stock', parsedStock.toString()); // Convertir a string para FormData

    // AÑADIDO: Adjuntar el archivo de imagen si existe
    if (selectedFile) {
      console.log(`Frontend: Adjuntando archivo de imagen: ${selectedFile.name}`);
      // 'image' debe coincidir con el nombre del campo esperado por Multer en el backend (upload.single('image'))
      formData.append('image', selectedFile);
    } else {
      console.log("Frontend: No se adjunta archivo de imagen.");
    }

    try {
      console.log(`Frontend: Enviando petición POST a ${process.env.NEXT_PUBLIC_BACKEND_URL}/api/products`);
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/products`, {
        method: 'POST',
        // IMPORTANTE: NO ESPECIFICAR 'Content-Type': 'application/json'
        // Cuando se usa FormData, el navegador se encarga automáticamente de establecer
        // el 'Content-Type' correcto como 'multipart/form-data' con el boundary adecuado.
        body: formData, // Enviar el objeto FormData directamente
      });

      console.log(`Frontend: Respuesta HTTP del backend (status): ${response.status}`);

      if (!response.ok) {
        let errorData: BackendErrorResponse | unknown = {};
        try {
          errorData = await response.json();
          console.log("Frontend: JSON de error del backend:", errorData);
        } catch (jsonError: unknown) {
          console.error("Frontend: Error al parsear el JSON de error de la respuesta:", jsonError);
          throw new Error(`Error ${response.status}: ${response.statusText || 'Error desconocido del servidor.'}`);
        }

        let errorMessage = `Error ${response.status}: ${response.statusText || 'Mensaje de error desconocido.'}`;
        if (typeof errorData === 'object' && errorData !== null) {
          const parsedErrorData = errorData as BackendErrorResponse;
          if (parsedErrorData.message) {
            errorMessage = parsedErrorData.message;
          } else if (parsedErrorData.error) {
            errorMessage = parsedErrorData.error;
          }
        }
        throw new Error(errorMessage);
      }

      const newProduct: Product = await response.json();
      console.log("Frontend: Producto creado exitosamente. Respuesta del backend:", newProduct);

      if (!newProduct || typeof newProduct.id === 'undefined' || !newProduct.name) {
        console.error("Frontend: La estructura del producto recibido no es la esperada:", newProduct);
        throw new Error("La respuesta del servidor no contiene los datos del producto esperado (nombre o ID).");
      }

      setSuccess(`Producto "${newProduct.name}" creado con éxito. ID: ${newProduct.id}`);

      // Limpiar los campos del formulario y el archivo seleccionado
      setName('');
      setDescription('');
      setPrice('');
      setStock('');
      setSelectedFile(null); // Limpiar el archivo seleccionado

      // Redireccionar después de un tiempo para que el usuario vea el mensaje de éxito
      setTimeout(() => {
        router.push('/products');
      }, 2000);

    } catch (err: unknown) {
      console.error('Frontend: Error en el proceso de creación del producto:', err);
      let errorMessage = 'Error al crear el producto. Por favor, inténtalo de nuevo más tarde.';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      setError(errorMessage);
    } finally {
      setLoading(false); // Siempre desactiva el estado de carga
    }
  };

  return (
    <main className="min-h-screen p-8 bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-10 rounded-xl shadow-lg max-w-lg w-full">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">Crear Nuevo Producto</h1>

        {/* Mensaje de éxito */}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6" role="alert">
            <strong className="font-bold">¡Éxito!</strong>
            <span className="block sm:inline ml-2">{success}</span>
          </div>
        )}

        {/* Mensaje de error */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline ml-2">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">
              Nombre del Producto:
            </label>
            <input
              type="text"
              id="name"
              className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">
              Descripción:
            </label>
            <textarea
              id="description"
              rows={4}
              className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
          </div>

          <div>
            <label htmlFor="price" className="block text-gray-700 text-sm font-bold mb-2">
              Precio (€):
            </label>
            <input
              type="number"
              id="price"
              step="0.01" // Permite decimales para el precio
              className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="stock" className="block text-gray-700 text-sm font-bold mb-2">
              Stock:
            </label>
            <input
              type="number"
              id="stock"
              className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              // `required` se ha eliminado aquí ya que el stock puede ser 0 o vacío
            />
          </div>

          {/* AÑADIDO: Campo para subir la imagen */}
          <div>
            <label htmlFor="image" className="block text-gray-700 text-sm font-bold mb-2">
              Imagen del Producto:
            </label>
            <input
              type="file"
              id="image"
              name="image" // Importante: debe coincidir con el nombre de campo de Multer en el backend
              accept="image/*" // Solo permite seleccionar archivos de imagen
              onChange={handleFileChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              // Agregado estilos Tailwind CSS para el input de tipo file para mejor visualización
            />
            {selectedFile && (
                <p className="text-gray-600 text-sm mt-2">Archivo seleccionado: {selectedFile.name}</p>
            )}
          </div>


          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 w-full flex items-center justify-center"
            disabled={loading}
          >
            {loading ? (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : null}
            {loading ? 'Creando...' : 'Crear Producto'}
          </button>
        </form>

        <div className="text-center mt-6">
          <Link href="/products" className="text-blue-600 hover:text-blue-800 transition duration-300 ease-in-out font-semibold">
            Volver a la lista de productos
          </Link>
        </div>
      </div>
    </main>
  );
}