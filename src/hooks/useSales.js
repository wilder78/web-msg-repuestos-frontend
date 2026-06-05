import { useState, useEffect, useCallback } from "react";

const getAuthToken = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token") || null;

const authFetch = (url, options = {}) => {
  const token = getAuthToken();
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
};

const extractList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  for (const key of ["data", "ventas", "sales", "content", "rows", "items", "results"]) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") {
      const nested = extractList(value);
      if (nested.length > 0) return nested;
    }
  }

  return [];
};

const formatCurrency = (value) => {
  if (value === undefined || value === null) return "$0";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
};

const normalizeSale = (sale, customersMap) => {
  const id = sale.idVenta ?? sale.id_venta ?? sale.id;
  
  // Extract client name and identification
  let cliente = "Cliente Generico";
  let identificacion = "Sin Identificación";
  
  const idCliente = sale.pedido?.id_cliente ?? sale.id_cliente ?? sale.idCliente;
  const customerData = idCliente ? customersMap[idCliente] : null;

  if (customerData) {
    cliente = customerData.razonSocial ?? customerData.nombreCliente ?? customerData.nombre ?? cliente;
    const sigla = customerData.tipoDocumento?.sigla ? `${customerData.tipoDocumento.sigla}: ` : "";
    identificacion = sigla + (customerData.numeroDocumento ?? customerData.identificacion ?? customerData.nit ?? customerData.cedula ?? customerData.documento ?? identificacion);
  } else if (sale.cliente) {
    cliente = sale.cliente.razonSocial ?? sale.cliente.nombreCliente ?? sale.cliente.nombre ?? cliente;
    const sigla = sale.cliente.tipoDocumento?.sigla ? `${sale.cliente.tipoDocumento.sigla}: ` : "";
    identificacion = sigla + (sale.cliente.numeroDocumento ?? sale.cliente.identificacion ?? sale.cliente.nit ?? sale.cliente.cedula ?? sale.cliente.documento ?? identificacion);
  } else if (sale.pedido?.cliente) {
    cliente = sale.pedido.cliente.razonSocial ?? sale.pedido.cliente.nombreCliente ?? sale.pedido.cliente.nombre ?? cliente;
    const sigla = sale.pedido.cliente.tipoDocumento?.sigla ? `${sale.pedido.cliente.tipoDocumento.sigla}: ` : "";
    identificacion = sigla + (sale.pedido.cliente.numeroDocumento ?? sale.pedido.cliente.identificacion ?? sale.pedido.cliente.nit ?? sale.pedido.cliente.cedula ?? sale.pedido.cliente.documento ?? identificacion);
  } else if (sale.nombreCliente || sale.clienteNombre) {
    cliente = sale.nombreCliente ?? sale.clienteNombre;
  }

  const fechaOriginal = sale.fechaVenta ?? sale.fecha_venta ?? sale.fechaConsolidacion ?? sale.fechaCreacion;
  const fecha = formatDate(fechaOriginal);
  
  const valorNum = sale.totalVenta ?? sale.total_venta ?? sale.valorVenta ?? sale.total ?? 0;
  const valor = formatCurrency(valorNum);

  return {
    ...sale,
    id: id ? `VTA-${String(id).padStart(3, '0')}` : "VTA-000",
    idVenta: id,
    cliente,
    identificacion,
    clienteCompleto: customerData || sale.pedido?.cliente || sale.cliente,
    fecha,
    valor,
    valorOriginal: valorNum,
    fechaOriginal
  };
};

export const useSales = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSalesData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [resSales, resCustomers] = await Promise.all([
        authFetch("http://localhost:8080/api/sales"),
        authFetch("http://localhost:8080/api/customers")
      ]);

      if (!resSales.ok) {
        throw new Error("Error fetching sales from server");
      }

      const dataSales = await resSales.json();
      
      let customersMap = {};
      if (resCustomers.ok) {
        const dataCustomers = await resCustomers.json();
        const customersList = extractList(dataCustomers);
        customersMap = customersList.reduce((acc, customer) => {
          const id = customer.idCliente ?? customer.id_cliente ?? customer.id;
          if (id) acc[id] = customer;
          return acc;
        }, {});
      }

      const salesList = extractList(dataSales).map(sale => normalizeSale(sale, customersMap));

      setSales(salesList);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSalesData();
  }, [fetchSalesData]);

  return {
    sales,
    setSales,
    loading,
    error,
    refresh: fetchSalesData,
    authFetch,
  };
};
