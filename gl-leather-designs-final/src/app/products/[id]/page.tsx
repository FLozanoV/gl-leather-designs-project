// gl-leather-designs-final/src/app/products/[id]/page.tsx

'use client'; // Directiva de cliente para Next.js App Router

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Importa useRouter para la redirección
import Image from 'next/image'; // Importa el componente Image de Next.js
// Si no estás usando axios para las llamadas a la API, puedes comentar o borrar la siguiente línea:
// import axios from 'axios';

// Definir la interfaz del producto para tipado seguro
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url: string | null;
  category: string;
}

// Definir las props para el componente de la página
interface ProductDetailsPageProps {
  params: {
    id: string; // El ID del producto se obtiene de la URL dinámica
  };
}

// URL base de tu API backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

// Definición del componente de la página (ya no es async aquí)
export default function ProductDetailsPage({ params }: ProductDetailsPageProps) {
  const router = useRouter(); // Inicializa el hook useRouter

  // Estados del componente
  const [product, setProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null); // Para la nueva imagen seleccionada
  const [previewImage, setPreviewImage] = useState<string | null>(null); // Para la previsualización de la nueva imagen
  const [error, setError] = useState<string | null>(null); // Para mensajes de error
  const [loading, setLoading] = useState<boolean>(true); // Para el estado de carga inicial

  // Efecto para cargar los datos del producto cuando el componente se monta o el ID cambia
  useEffect(() => {
    // Aquí es donde podemos acceder a params.id de forma segura
    const productId = params.id; // Obtiene el ID del producto de los parámetros de la URL

    const fetchProduct = async () => {
      if (!productId) { // Asegurarse de que el ID exista
        setLoading(false);
        setError('ID de producto no proporcionado.');
        return;
      }
      try {
        setLoading(true); // Inicia estado de carga
        setError(null); // Limpia errores anteriores
        console.log(`DEBUG: API_BASE_URL: ${API_BASE_URL}`); // Debugging
        console.log(`DEBUG: Product ID from params: ${productId}`); // Debugging

        const token = localStorage.getItem('token'); // Obtiene el token del localStorage
        if (!token) {
          router.push('/login'); // Redirige a login si no hay token
          return;
        }

        // Realiza la solicitud para obtener los datos del producto
        const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // Envía el token en el encabezado de autorización
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          // Lanza un error si la respuesta no es OK
          throw new Error(errorData.message || 'Error al cargar el producto.');
        }

        const data: Product = await response.json(); // Parsea la respuesta JSON con tipado 'Product'
        console.log('DEBUG: Product data successfully fetched:', data);
        setProduct(data); // Establece los datos del producto
        // Rellena el formulario con los datos del producto
        setFormData({
          name: data.name,
          description: data.description || '', // Asegura un string vacío si la descripción es null
          price: data.price.toString(),
          stock: data.stock.toString(),
          category: data.category,
        });
      } catch (err: unknown) { // Captura de error tipada como 'unknown' para seguridad
        console.error('Error fetching product:', err);
        let errorMessage = 'Error al cargar el producto.';
        if (err instanceof Error) {
            errorMessage = err.message; // Si es una instancia de Error, usa su mensaje
        } else if (typeof err === 'string') {
            errorMessage = err; // Si es un string, úsalo directamente
        }
        setError(errorMessage); // Establece el mensaje de error
      } finally {
        setLoading(false); // Finaliza estado de carga
      }
    };

    fetchProduct(); // Llama a la función para cargar el producto
  }, [params, router]); // <-- CAMBIO CLAVE AQUÍ: 'params' (el objeto completo) en lugar de 'params.id'

  // Manejador de cambios en los campos del formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Manejador de cambios en la selección de archivos de imagen
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file); // Guarda el archivo seleccionado
      setPreviewImage(URL.createObjectURL(file)); // Crea una URL para la previsualización
      console.log('DEBUG: New image selected:', file.name);
    } else {
      setSelectedImage(null); // Limpia si no hay archivo
      setPreviewImage(null); // Limpia la previsualización
    }
  };

  // Manejador del envío del formulario (actualización de producto)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Previene el comportamiento por defecto del formulario
    setError(null); // Limpia errores anteriores
    console.log('DEBUG: Submitting product data. Current productdata state: ', formData);

    // Acceder a productId aquí también (ya que es un evento de usuario, no hay problema de Next.js)
    const productId = params.id;
    if (!productId) {
      setError('ID de producto no proporcionado para la actualización.');
      return;
    }

    try {
      const token = localStorage.getItem('token'); // Obtiene el token
      if (!token) {
        router.push('/login'); // Redirige a login si no hay token
        return;
      }

      // 1. Realizar la solicitud PUT para actualizar los campos de texto
      const updateUrl = `${API_BASE_URL}/api/products/${productId}`;
      const updateResponse = await fetch(updateUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json', // Importante para enviar JSON
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ // Envía los datos del formulario como JSON
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price), // Convierte a número flotante
          stock: parseInt(formData.stock, 10), // Convierte a entero
          category: formData.category,
          image_url: product?.image_url // Mantiene la URL de la imagen actual si no se selecciona una nueva
        })
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        // Lanza un error si la actualización de datos falla
        throw new Error(errorData.message || 'Error interno del servidor al actualizar el producto.');
      }

      // 2. Si se seleccionó una nueva imagen, enviarla con una solicitud PATCH separada
      if (selectedImage) {
        const imageFormData = new FormData();
        imageFormData.append('image', selectedImage); // 'image' es el nombre de campo esperado por Multer en el backend

        const imageUploadResponse = await fetch(`${API_BASE_URL}/api/products/${productId}/image`, {
          method: 'PATCH', // Usamos PATCH para actualizar solo la imagen
          headers: {
            'Authorization': `Bearer ${token}`
            // No Content-Type aquí; Multer lo maneja automáticamente con FormData
          },
          body: imageFormData, // Envía el FormData con la imagen
        });

        if (!imageUploadResponse.ok) {
          const errorData = await imageUploadResponse.json();
          // Lanza un error si la actualización de la imagen falla
          throw new Error(errorData.message || 'Error al actualizar la imagen del producto.');
        }
        console.log('DEBUG: Image updated successfully.');
      }

      // Si ambas solicitudes (PUT y PATCH si aplica) fueron exitosas:
      alert('Producto actualizado con éxito!'); // Alerta de éxito al usuario
      router.push('/products'); // REDIRECCIÓN A LA PÁGINA DE PRODUCTOS DESPUÉS DE LA ACTUALIZACIÓN EXITOSA

    } catch (err: unknown) { // Captura de error tipada como 'unknown'
      console.error('ERROR: Error updating product data:', err);
      let errorMessage = 'Error interno del servidor al actualizar el producto.';
      if (err instanceof Error) {
        errorMessage = err.message; // Si es una instancia de Error, usa su mensaje
      } else if (typeof err === 'string') {
          errorMessage = err; // Si es un string, úsalo directamente
      }
      setError(errorMessage); // Establece el mensaje de error en el estado
    }
  };

  // Renderizado condicional mientras se carga el producto o si hay error
  if (loading) return <div className="text-center mt-8">Cargando producto...</div>;
  if (error && !product) return <div className="text-center mt-8 text-red-500">Error: {error}</div>;
  if (!product) return <div className="text-center mt-8">Producto no encontrado.</div>;

  // Renderizado del formulario de edición
  return (
    <div className="container mx-auto p-4 max-w-lg">
      <h1 className="text-3xl font-bold text-center mb-6">Editar Producto</h1>

      {/* Muestra el mensaje de error si existe */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
        {/* Campo Nombre */}
        <div className="mb-4">
          <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">Nombre:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        {/* Campo Descripción */}
        <div className="mb-4">
          <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">Descripción:</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            rows={3}
          />
        </div>
        {/* Campo Precio */}
        <div className="mb-4">
          <label htmlFor="price" className="block text-gray-700 text-sm font-bold mb-2">Precio:</label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            step="0.01"
            required
          />
        </div>
        {/* Campo Stock */}
        <div className="mb-4">
          <label htmlFor="stock" className="block text-gray-700 text-sm font-bold mb-2">Stock:</label>
          <input
            type="number"
            id="stock"
            name="stock"
            value={formData.stock}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        {/* Campo Categoría */}
        <div className="mb-4">
          <label htmlFor="category" className="block text-gray-700 text-sm font-bold mb-2">Categoría:</label>
          <input
            type="text"
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        {/* Campo Cambiar Imagen */}
        <div className="mb-4">
          <label htmlFor="image" className="block text-gray-700 text-sm font-bold mb-2">Cambiar Imagen:</label>
          <input
            type="file"
            id="image"
            name="image"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {/* Sección de Previsualización de Imágenes */}
        {(previewImage || product.image_url) && (
          <div className="mb-4">
            <h3 className="text-gray-700 text-sm font-bold mb-2">Previsualización de la Nueva Imagen:</h3>
            <div className="border border-gray-300 rounded-lg p-2 flex justify-center items-center h-64 w-64 overflow-hidden mx-auto">
              {previewImage ? (
                <Image src={previewImage} alt="Nueva imagen" width={256} height={256} objectFit="contain" />
              ) : (
                <span className="text-gray-500">No hay nueva imagen seleccionada</span>
              )}
            </div>
            {product.image_url && (
              <>
                <h3 className="text-gray-700 text-sm font-bold mb-2 mt-4">Imagen Actual:</h3>
                <div className="border border-gray-300 rounded-lg p-2 flex justify-center items-center h-64 w-64 overflow-hidden mx-auto">
                  <Image
                    src={`${API_BASE_URL}${product.image_url}`}
                    alt="Imagen actual del producto"
                    width={256}
                    height={256}
                    objectFit="contain"
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* Botón de Actualizar Producto */}
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
        >
          Actualizar Producto
        </button>
      </form>
    </div>
  );
}