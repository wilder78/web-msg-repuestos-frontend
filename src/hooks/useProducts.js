import { useState, useEffect, useCallback } from "react";

const getAuthToken = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token") || null;

const authFetch = (url, options = {}) => {
  const token = getAuthToken();
  const isFormData = options.body instanceof FormData;

  return fetch(url, {
    ...options,
    headers: {
      ...(!isFormData ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
};

const toBackendKeys = (data) => ({
  nombre: data.nombre,
  referencia: data.referencia,
  descripcion: data.descripcion,
  marca: data.marca,
  modelo: data.modelo,
  precio_compra: data.precioCompra,
  stock_buen_estado: data.stockBuenEstado,
  stock_defectuoso: data.stockDefectuoso ?? 0,
  id_categoria: data.idCategoria,
  id_estado: data.idEstado ?? 1,
});

// ✅ Declaración separada de la exportación para evitar ambigüedades con Vite
const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryMap, setCategoryMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProductsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [resProducts, resCategories] = await Promise.all([
        authFetch("/api/products"),
        authFetch("/api/categories"),
      ]);

      if (!resProducts.ok || !resCategories.ok)
        throw new Error("Error fetching data from server");

      const dataProducts = await resProducts.json();
      const dataCategories = await resCategories.json();

      const productList =
        dataProducts.data || dataProducts.content || dataProducts || [];
      const categoryList =
        dataCategories.data || dataCategories.roles || dataCategories || [];

      setProducts(productList);
      setCategories(categoryList);

      const map = {};
      categoryList.forEach((cat) => {
        map[cat.idCategoria || cat.id_categoria] =
          cat.nombreCategoria || cat.nombre_categoria;
      });
      setCategoryMap(map);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createProduct = useCallback(async (formData, imageFile = null) => {
    const body = new FormData();
    const mapped = toBackendKeys(formData);

    Object.entries(mapped).forEach(([key, value]) => {
      if (value !== undefined && value !== null) body.append(key, value);
    });

    if (imageFile) body.append("imagen", imageFile);

    const res = await authFetch("/api/products", {
      method: "POST",
      body,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Error al crear producto");
    return data;
  }, []);

  const updateProduct = useCallback(async (id, formData, imageFile = null) => {
    const body = new FormData();
    const mapped = toBackendKeys(formData);

    Object.entries(mapped).forEach(([key, value]) => {
      if (value !== undefined && value !== null) body.append(key, value);
    });

    if (imageFile) body.append("imagen", imageFile);

    const res = await authFetch(`/api/products/${id}`, {
      method: "PUT",
      body,
    });

    const data = await res.json();
    if (!res.ok)
      throw new Error(data.message || "Error al actualizar producto");
    return data;
  }, []);

  useEffect(() => {
    fetchProductsData();
  }, [fetchProductsData]);

  return {
    products,
    setProducts,
    categories,
    categoryMap,
    loading,
    error,
    refresh: fetchProductsData,
    authFetch,
    createProduct,
    updateProduct,
  };
};

export { useProducts };
