import { useState, useEffect, useCallback } from "react";
import { handleUnauthorized } from "../lib/auth-utils";

// Helper interno para peticiones con Token
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

const isAuthStatus = (status) => status === 401 || status === 403;

const extractList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  for (const key of [
    "data",
    "orders",
    "pedidos",
    "users",
    "usuarios",
    "employees",
    "empleados",
    "details",
    "detalles",
    "content",
    "rows",
    "items",
    "results",
  ]) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") {
      const nested = extractList(value);
      if (nested.length > 0) return nested;
    }
  }

  return [];
};

const fetchFirstList = async (urls) => {
  for (const url of urls) {
    try {
      const response = await authFetch(url);
      if (!response.ok) continue;

      return extractList(await response.json());
    } catch {
      // Catalogs are only used to enrich the order list, so failures should not
      // block loading orders.
    }
  }

  return [];
};

const getUserId = (user) =>
  user.idUsuario ||
  user.idusuario ||
  user.id_usuario ||
  user.id ||
  user.usuario?.idUsuario ||
  user.usuario?.idusuario ||
  user.usuario?.id_usuario;

const getUserName = (user) =>
  user.nombreUsuario ||
  user.nombreusuario ||
  user.nombre_usuario ||
  user.name ||
  user.nombre ||
  user.usuario.nombreUsuario ||
  user.usuario.nombreusuario ||
  user.usuario.nombre_usuario ||
  user.email ||
  user.usuario.email ||
  "";

const getEmployeeSellerId = (employee) =>
  employee.idEmpleado || employee.idempleado || employee.id_empleado || employee.id;

const getEmployeeUserId = (employee) =>
  employee.idUsuario ||
  employee.idusuario ||
  employee.id_usuario ||
  employee.usuario?.idUsuario ||
  employee.usuario?.idusuario ||
  employee.usuario?.id_usuario;

const getEmployeeSellerName = (employee) => {
  const fullName = [
    employee.nombre || employee.nombres,
    employee.apellido || employee.apellidos,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    fullName ||
    employee.nombreUsuario ||
    employee.nombreusuario ||
    employee.usuario.nombreUsuario ||
    employee.usuario.nombreusuario ||
    employee.usuario.nombre_usuario ||
    employee.email ||
    employee.usuario.email ||
    ""
  );
};

const buildSellerMap = (users = [], employees = []) => {
  const map = new Map();

  users.forEach((user) => {
    const id = getUserId(user);
    const name = getUserName(user);
    if (id && name) map.set(id.toString(), name);
  });

  employees.forEach((employee) => {
    const id = getEmployeeSellerId(employee);
    const name = getEmployeeSellerName(employee);
    if (id && name) map.set(id.toString(), name);
  });

  employees.forEach((employee) => {
    const id = getEmployeeSellerId(employee);
    const userId = getEmployeeUserId(employee);
    const name = getEmployeeSellerName(employee);
    if (userId && name && !map.has(userId.toString())) map.set(userId.toString(), name);
    if (id && name) map.set(id.toString(), name);
  });

  return map;
};

const normalizeDetalle = (detalle) => {
  const producto = detalle.producto || {};
  const idProducto =
    detalle.idProducto ||
    detalle.id_producto ||
    producto.idProducto ||
    producto.id_producto;
  const cantidad =
    detalle.cantidad ??
    detalle.cantidad_solicitada ??
    detalle.cantidadSolicitada ??
    0;
  const precioUnitario =
    detalle.precio_unitario ??
    detalle.precioVenta ??
    detalle.precio_venta ??
    detalle.precio ??
    producto.precio_publico ??
    producto.precio_compra ??
    0;
  const descuento =
    detalle.descuento_porcentaje ??
    detalle.descuento_aplicado ??
    detalle.descuentoAplicado ??
    0;
  const subtotal =
    detalle.subtotal_linea ??
    detalle.subtotalLinea ??
    detalle.subtotal ??
    Number(cantidad || 0) * Number(precioUnitario || 0);
  const nombreProducto =
    detalle.nombreProducto ||
    producto.nombre ||
    producto.referencia ||
    (idProducto ? `Producto #${idProducto}` : "Producto");
  const referenciaProducto =
    detalle.referenciaProducto ||
    producto.referencia ||
    producto.codigo ||
    producto.sku ||
    "";

  return {
    ...detalle,
    idDetallePedido:
      detalle.idDetallePedido || detalle.id_detalle_pedido || detalle.id,
    id_detalle_pedido:
      detalle.id_detalle_pedido || detalle.idDetallePedido || detalle.id,
    id_producto: idProducto,
    cantidad,
    cantidad_solicitada: cantidad,
    precio_unitario: precioUnitario,
    precio_venta: precioUnitario,
    descuento_porcentaje: descuento,
    descuento_aplicado: descuento,
    subtotal_linea: subtotal,
    nombreProducto,
    referenciaProducto,
    producto: {
      ...producto,
      id_producto: producto.id_producto || idProducto,
      nombre: producto.nombre || nombreProducto,
      referencia: producto.referencia || referenciaProducto,
    },
  };
};

const normalizePedido = (pedido) => {
  const idPedido = pedido.idPedido || pedido.id_pedido || pedido.id;
  const idCliente =
    pedido.idCliente ||
    pedido.id_cliente ||
    pedido.cliente?.idCliente ||
    pedido.cliente?.idcliente ||
    pedido.cliente?.id_cliente;
  const idVendedor =
    pedido.idVendedor ||
    pedido.id_vendedor ||
    pedido.vendedor?.idUsuario ||
    pedido.vendedor?.idusuario ||
    pedido.vendedor?.id_usuario;
  const idEstado =
    pedido.idEstado ||
    pedido.id_estado_pedido ||
    pedido.id_estado ||
    pedido.estado?.idEstado ||
    pedido.estado?.idestado ||
    pedido.estado?.id_estado;
  const detalles = Array.isArray(pedido.detalles)
    ? pedido.detalles.map(normalizeDetalle)
    : [];

  return {
    ...pedido,
    idPedido,
    id_pedido: pedido.id_pedido || idPedido,
    id_cliente: pedido.id_cliente || idCliente,
    id_vendedor: pedido.id_vendedor || idVendedor,
    id_estado_pedido: pedido.id_estado_pedido || idEstado,
    idEstado,
    fechaPedido:
      pedido.fechaPedido ||
      pedido.fecha_pedido ||
      pedido.fecha ||
      pedido.createdAt ||
      "",
    fecha_pedido:
      pedido.fecha_pedido || pedido.fechaPedido || pedido.fecha || "",
    nombreCliente:
      pedido.nombreCliente ||
      pedido.clienteNombre ||
      pedido.cliente?.razonSocial ||
      pedido.cliente?.razonsocial ||
      pedido.cliente?.nombre ||
      (idCliente ? `Cliente #${idCliente}` : ""),
    nombreVendedor:
      pedido.nombreVendedor ||
      pedido.vendedorNombre ||
      pedido.nombreUsuario ||
      pedido.nombreusuario ||
      pedido.vendedor?.nombreUsuario ||
      pedido.vendedor?.nombreusuario ||
      pedido.vendedor?.nombre_usuario ||
      pedido.vendedor?.nombre ||
      (idVendedor ? `Vendedor #${idVendedor}` : ""),
    total_neto: pedido.total_neto ?? pedido.totalNeto ?? pedido.total ?? 0,
    tipo_pago: pedido.tipo_pago || pedido.tipoPago || pedido.formaPago || "",
    cliente: pedido.cliente || {},
    detalles,
  };
};

const withSellerName = (pedido, sellerMap) => {
  const normalized = normalizePedido(pedido);
  const sellerName = normalized.id_vendedor
    ? sellerMap.get(normalized.id_vendedor.toString())
    : "";
  const currentName = normalized.nombreVendedor || "";
  const isFallbackName = /^Vendedor #/i.test(currentName);

  if (!sellerName || (currentName && !isFallbackName)) return normalized;

  return {
    ...normalized,
    nombreVendedor: sellerName,
  };
};

export const usePedidos = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPedidosData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!getAuthToken()) {
        throw new Error("No hay sesión activa. Inicia sesión nuevamente para cargar pedidos.");
      }
      const API_URL = import.meta.env.VITE_API_URL || "/api";
      const urls = [
        `${API_URL}/orders`,
        `${API_URL}/pedidos`
      ];
      const pedidoList = [];
      let lastError = null;

      for (const url of urls) {
        try {
          const response = await authFetch(url);
          if (response.ok) {
            const payload = await response.json().catch(() => ({}));
            pedidoList.push(...extractList(payload));
            break; // Stop trying other URLs if one succeeds
          }
          if (isAuthStatus(response.status)) {
            handleUnauthorized();
            return;
          }
          lastError = new Error(`Error ${response.status} al cargar pedidos`);
        } catch (requestError) {
          if (requestError.message.includes("Sesión expirada")) throw requestError;
          lastError = requestError;
        }
      }

      if (pedidoList.length === 0) {
        throw lastError || new Error("Error fetching data from server");
      }

      const uniquePedidos = Array.from(
        pedidoList
          .reduce((map, pedido) => {
            const id = pedido.idPedido || pedido.id_pedido || pedido.id;
            if (id && !map.has(id.toString())) map.set(id.toString(), pedido);
            return map;
          }, new Map())
          .values(),
      );
      const [userList, employeeList] = await Promise.all([
        fetchFirstList([`${API_URL}/users`, `${API_URL}/usuarios`]),
        fetchFirstList([`${API_URL}/employees`, `${API_URL}/empleados`]),
      ]);
      const sellerMap = buildSellerMap(userList, employeeList);

      setPedidos(
        uniquePedidos
          .map((pedido) => withSellerName(pedido, sellerMap))
          .sort(
            (a, b) =>
              Number(b.idPedido || b.id_pedido || 0) -
              Number(a.idPedido || a.id_pedido || 0),
          ),
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPedidosData();
  }, [fetchPedidosData]);

  return {
    pedidos,
    setPedidos,
    loading,
    error,
    refresh: fetchPedidosData,
    authFetch,
  };
};
