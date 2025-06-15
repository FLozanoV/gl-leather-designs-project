// gl-leather-designs-final-frontend/app/products/edit/[id]/page.tsx

"use client"; // Marks this component as a Client Component in Next.js

import React, { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
// For Next.js App Router, use `useParams` to get IDs from the URL
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image'; // Import the Image component from Next.js

// Interface for product data
interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  image_url: string | null;
  category: string | null; // Added category field
}

const EditProductPage: React.FC = () => {
  const { id } = useParams(); // Get the product ID from the URL parameters
  // Ensure that productId is a string, as useParams can return string or string[]
  const productId = Array.isArray(id) ? id[0] : id; 
  const router = useRouter(); // For programmatic navigation

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null); // State for success/error messages after submission

  // Form states, initialized with default values or empty strings
  const [formName, setFormName] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formPrice, setFormPrice] = useState<number>(0);
  const [formStock, setFormStock] = useState<number>(0);
  const [formImageUrl, setFormImageUrl] = useState<string>(''); // State for the image URL
  const [formCategory, setFormCategory] = useState<string>(''); // State for category

  // Backend URL from environment variables, or fallback to localhost
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  // useEffect hook to fetch product data when the component mounts or productId changes
  useEffect(() => {
    // If productId is not available, set error and stop loading
    if (!productId) {
      setLoading(false);
      setError("No se proporcionó un ID de producto.");
      return;
    }

    const fetchProduct = async () => {
      try {
        setLoading(true); // Set loading to true before fetching
        const response = await axios.get<Product>(`${backendUrl}/api/products/${productId}`);
        const productData: Product = response.data; // Assign fetched data to Product interface

        setProduct(productData); // Set the fetched product data
        setFormName(productData.name);
        setFormDescription(productData.description || ''); // Handle null description
        setFormPrice(Number(productData.price)); // Ensure price is a number
        setFormStock(Number(productData.stock));   // Ensure stock is a number
        setFormImageUrl(productData.image_url || ''); // Set the image URL from fetched data
        setFormCategory(productData.category || ''); // Set the category from fetched data

        // --- IMAGE URL DEBUGGING IN EDIT PAGE CONSOLE ---
        console.log('EditProductPage (Console): ID del producto:', productId);
        console.log('EditProductPage (Console): URL de imagen cargada (productData.image_url):', productData.image_url);
        console.log('EditProductPage (Console): formImageUrl después de cargar:', productData.image_url || '');
        console.log('EditProductPage (Console): Categoría cargada (productData.category):', productData.category);
        console.log('EditProductPage (Console): formCategory después de cargar:', productData.category || '');
        // -----------------------------------------------------------

      } catch (err: unknown) {
        console.error('Error al obtener producto para edición:', err);
        // Handle Axios errors and display a user-friendly message
        if (axios.isAxiosError(err)) {
          if (err.response && typeof err.response.data === 'object' && err.response.data !== null && 'message' in err.response.data) {
            setError((err.response.data as { message: string }).message);
          } else {
            setError(err.message); // Fallback to generic Axios error message
          }
        } else if (err instanceof Error) {
          setError(err.message); // Handle other standard JS errors
        } else {
          setError('Error desconocido al cargar los datos del producto.'); // Generic unknown error
        }
      } finally {
        setLoading(false); // Set loading to false after fetch attempt
      }
    };

    fetchProduct(); // Call the fetch function
  }, [productId, backendUrl]); // Dependencies array: re-run if productId or backendUrl changes

  // Handle form submission for updating the product
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission
    setError(null);    // Clear previous errors
    setMessage(null);  // Clear previous messages
    setLoading(true);  // Set loading to true

    // Create the updated product data object
    const updatedProductData = {
      name: formName,
      description: formDescription,
      price: formPrice,
      stock: formStock,
      image_url: formImageUrl, // Use the image URL from the form state
      category: formCategory,  // Include the category in the update data
    };

    try {
      const token = localStorage.getItem('token'); // Get authentication token from localStorage
      // If no token is found, display error and redirect to login
      if (!token) {
        setMessage("Error: No autenticado. Por favor, inicie sesión.");
        setLoading(false);
        router.push('/login'); // Redirect to login page
        return;
      }

      // Send PUT request to update the product
      const response = await axios.put(`${backendUrl}/api/products/${productId}`, updatedProductData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Attach the Bearer token for authentication
        },
      });

      // If update is successful, display success message and redirect
      if (response.status === 200) { // Check for status 200 OK for successful update
        setMessage('Producto actualizado exitosamente.');
        setTimeout(() => {
          router.push('/products'); // Redirect to products page after a short delay
        }, 1500); // Redirect after 1.5 seconds
      } else {
        // Handle non-200 responses
        // This block might not be reached if Axios throws an error for non-2xx statuses
        const errorData = response.data; // Axios automatically parses JSON error
        setMessage(`Error al actualizar el producto: ${errorData.message || 'Error desconocido'}`);
      }

    } catch (err: unknown) {
      console.error('Error al actualizar el producto:', err);
      // Handle Axios errors and display specific error messages
      if (axios.isAxiosError(err)) {
        // 'err' is now typed as AxiosError
        if (err.response) { // Check if a response object exists
          if (err.response.status === 401) {
            setMessage('Error: Token de autenticación expirado o inválido. Por favor, inicie sesión de nuevo.');
            localStorage.removeItem('token'); // Clear invalid token
            setTimeout(() => router.push('/login'), 2000); // Redirect to login
          } else {
            // Safely access the message property from response.data
            // Ensure response.data is an object and has a 'message' property
            const responseData = err.response.data;
            let errorMessage = err.message; // Default to generic Axios error message
            if (typeof responseData === 'object' && responseData !== null && 'message' in responseData) {
              errorMessage = (responseData as { message: string }).message;
            }
            setMessage(`Error al actualizar el producto: ${errorMessage}`);
          }
        } else {
          // Network error or no response from server
          setMessage(`Error de red o del servidor: ${err.message}`);
        }
      } else if (err instanceof Error) {
        // General JavaScript error
        setMessage(`Error al actualizar el producto: ${err.message}`);
      } else {
        // Unknown error type
        setMessage('Error desconocido al actualizar el producto.');
      }
    } finally {
      setLoading(false); // Set loading to false after submission attempt
    }
  };

  // Display loading indicator
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        <p className="ml-4 text-xl text-gray-700">Cargando producto para edición...</p>
      </div>
    );
  }

  // Display error message if there was an error fetching the product
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-center" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
          <p className="text-sm mt-2">Por favor, asegúrate de que el backend esté funcionando correctamente o que el ID del producto es válido.</p>
        </div>
      </div>
    );
  }

  // If product data is not found after loading, display message
  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-lg text-gray-700">Producto no encontrado o no disponible.</p>
      </div>
    );
  }

  // Render the product edit form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg">
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-900">Editar Producto: {product.name}</h2>
        
        {/* Display general messages (success/error from form submission) */}
        {message && (
          <div className={`mt-2 p-3 rounded-md text-center text-sm font-medium ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {/* Product Name Input */}
          <div>
            <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">
              Nombre del Producto:
            </label>
            <input
              type="text"
              id="name"
              name="name" // Important for handleChange
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
              aria-label="Nombre del Producto"
            />
          </div>

          {/* Description Input */}
          <div>
            <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">
              Descripción:
            </label>
            <textarea
              id="description"
              name="description" // Important for handleChange
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-24 resize-none transition duration-150 ease-in-out"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              aria-label="Descripción del Producto"
            />
          </div>

          {/* Price Input */}
          <div>
            <label htmlFor="price" className="block text-gray-700 text-sm font-bold mb-2">
              Precio (€):
            </label>
            <input
              type="number"
              id="price"
              name="price" // Important for handleChange
              step="0.01" // Allows decimal values for price
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
              value={formPrice}
              onChange={(e) => setFormPrice(Number(e.target.value))}
              required
              aria-label="Precio del Producto"
            />
          </div>

          {/* Stock Input */}
          <div>
            <label htmlFor="stock" className="block text-gray-700 text-sm font-bold mb-2">
              Stock:
            </label>
            <input
              type="number"
              id="stock"
              name="stock" // Important for handleChange
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
              value={formStock}
              onChange={(e) => setFormStock(Number(e.target.value))}
              required
              aria-label="Stock del Producto"
            />
          </div>

          {/* Image URL Input */}
          <div>
            <label htmlFor="imageUrl" className="block text-gray-700 text-sm font-bold mb-2">
              URL de la Imagen:
            </label>
            <input
              type="text"
              id="imageUrl"
              name="image_url" // Important for handleChange
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
              value={formImageUrl}
              onChange={(e) => setFormImageUrl(e.target.value)}
              placeholder="Ej: /uploads/mi-imagen.jpg o https://..."
              aria-label="URL de la Imagen del Producto"
            />
            {/* Image Preview if URL is provided and valid */}
            {formImageUrl && (
              <div className="mt-4 text-center">
                <p className="text-gray-600 text-sm mb-2">Vista previa:</p>
                <div className="relative w-48 h-48 mx-auto border border-gray-300 rounded-lg overflow-hidden shadow-md">
                  <Image
                    src={`${backendUrl}${formImageUrl.startsWith('/') ? formImageUrl : `/${formImageUrl}`}`} 
                    alt="Vista previa de la imagen del producto"
                    fill // Image will fill the parent container
                    style={{ objectFit: 'cover' }} // Cover ensures the image fills, potentially cropping
                    sizes="200px" // Define a size for Next.js Image optimization
                    onError={(e) => { 
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://placehold.co/200x200/e0e0e0/555555?text=Error+Carga+Imagen'; // Fallback image for errors
                      target.alt = 'Error al cargar la imagen';
                    }}
                  />
                </div>
              </div>
            )}
            {!formImageUrl && (
              <div className="mt-4 text-center text-gray-500 text-sm">
                No hay URL de imagen o la URL es inválida.
              </div>
            )}
          </div>

          {/* Category Input (New field for category) */}
          <div>
            <label htmlFor="category" className="block text-gray-700 text-sm font-bold mb-2">
              Categoría:
            </label>
            <input
              type="text"
              id="category"
              name="category"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
              placeholder="Ej: Bolsos, Carteras, Accesorios"
              aria-label="Categoría del Producto"
            />
          </div>

          <div className="flex items-center justify-between mt-6">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:shadow-outline transition duration-300 transform hover:scale-105"
            >
              Actualizar Producto
            </button>
            <button
              type="button"
              onClick={() => router.push('/products')}
              className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:shadow-outline transition duration-300 transform hover:scale-105"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProductPage;