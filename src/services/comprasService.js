const API_BASE_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

export const SHOPPING_ENDPOINT = `${API_BASE_URL}/shopping`;

const safeString = (val, defaultVal = "") => {
  if (val === undefined || val === null) return defaultVal;
  if (typeof val === "string") return val;
  if (typeof val === "object") {
    return (
      val.nombre_estado ??
      val.nombreEstado ??
      val.nombre ??
      val.nombre_metodo ??
      val.nombreMetodo ??
      val.descripcion ??
      val.label ??
      defaultVal
    );
  }
  return String(val);
};

const getAuthToken = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token") || null;

export const authFetch = (url, options = {}) => {
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

export const extractShoppingList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  for (const key of [
    "data",
    "shopping",
    "compras",
    "purchases",
    "items",
    "rows",
    "results",
    "content",
  ]) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") {
      const nested = extractShoppingList(value);
      if (nested.length > 0) return nested;
    }
  }

  return [];
};

const extractList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  for (const key of ["data", "suppliers", "proveedores", "items", "rows", "results"]) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
  }

  return [];
};

export const normalizeProveedor = (proveedor) => {
  const idProveedor = Number(
    proveedor.idProveedor ??
      proveedor.id_proveedor ??
      proveedor.id ??
      proveedor.value ??
      0,
  );
  const nombreEmpresa =
    proveedor.nombreEmpresa ??
    proveedor.nombre_empresa ??
    proveedor.nombre ??
    proveedor.name ??
    "";

  return {
    ...proveedor,
    idProveedor,
    nombreEmpresa,
    numeroDocumento:
      proveedor.numeroDocumento ??
      proveedor.numero_documento ??
      proveedor.nit ??
      proveedor.documento ??
      "",
  };
};

export const fetchProveedores = async () => {
  const response = await authFetch(`${API_BASE_URL}/suppliers`);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || payload.error || "Error al obtener proveedores.");
  }

  return extractList(payload)
    .map(normalizeProveedor)
    .filter((proveedor) => proveedor.idProveedor && proveedor.nombreEmpresa);
};

export const buildCompraDraftFromProduct = (product) => {
  const minimo = Number(product.minimo ?? product.stockMinimo ?? 5);
  const cantidadSugerida = Math.max(minimo * 2, 10);
  const precioUnitario = Number(product.precioCompra ?? product.precio_compra ?? 0);

  return {
    idProveedor: "",
    proveedorNombre: "",
    fechaCompra: new Date().toISOString().split("T")[0],
    numeroFactura: "",
    detalles: [
      {
        idProducto: product.idProducto ?? product.id_producto ?? product.id,
        nombreProducto: product.nombre ?? product.nombreProducto ?? product.descripcion,
        cantidad: cantidadSugerida,
        precioUnitario,
        total: cantidadSugerida * precioUnitario,
      },
    ],
  };
};

const normalizeShoppingDetail = (detail) => {
  const product = detail.producto || detail.product || {};
  const cantidad = Number(detail.cantidad ?? detail.quantity ?? detail.units ?? 0);
  const precioUnitario = Number(
    detail.precioUnitario ??
      detail.precio_unitario ??
      detail.unitPrice ??
      detail.price ??
      detail.costoUnitario ??
      0,
  );

  return {
    ...detail,
    idProducto:
      detail.idProducto ??
      detail.id_producto ??
      detail.productId ??
      product.idProducto ??
      product.id_producto ??
      product.id,
    nombreProducto:
      detail.nombreProducto ??
      detail.nombre_producto ??
      detail.productName ??
      product.nombre ??
      product.nombreProducto ??
      product.descripcion ??
      "Producto sin nombre",
    cantidad,
    precioUnitario,
    total: Number(detail.total ?? detail.subtotal ?? cantidad * precioUnitario),
  };
};

export const normalizeCompra = (compra) => {
  const proveedor = compra.proveedor || compra.supplier || {};
  const empleado = compra.empleado || compra.employee || compra.user || {};
  const estadoCompra =
    compra.estado ||
    compra.estadoCompra ||
    compra.status ||
    compra.estado_compra ||
    {};
  const idEstado =
    compra.idEstado ??
    compra.idestado ??
    compra.id_estado ??
    compra.idEstadoCompra ??
    compra.id_estado_compra ??
    estadoCompra.idEstado ??
    estadoCompra.idestado ??
    estadoCompra.id_estado ??
    estadoCompra.idEstadoCompra ??
    estadoCompra.id_estado_compra;
  const detalles =
    compra.detalles ||
    compra.detallesCompra ||
    compra.shoppingDetails ||
    compra.purchaseDetails ||
    compra.items ||
    [];
  const normalizedDetails = Array.isArray(detalles)
    ? detalles.map(normalizeShoppingDetail)
    : [];

  return {
    ...compra,
    idCompra:
      compra.idCompra ??
      compra.id_compra ??
      compra.idShopping ??
      compra.id_shopping ??
      compra.idCompraProveedor ??
      compra.id,
    idProveedor:
      compra.idProveedor ??
      compra.id_proveedor ??
      compra.providerId ??
      proveedor.idProveedor ??
      proveedor.id_proveedor ??
      proveedor.id,
    proveedorNombre:
      compra.proveedorNombre ??
      compra.proveedor_nombre ??
      compra.supplierName ??
      proveedor.nombre_empresa ??   // campo real devuelto por el backend (Sequelize)
      proveedor.nombre ??
      proveedor.nombreEmpresa ??
      proveedor.name ??
      "Proveedor pendiente",
    empleadoNombre:
      compra.empleadoNombre ??
      compra.empleado_nombre ??
      (empleado.nombre ? `${empleado.nombre} ${empleado.apellido ?? ""}`.trim() : null) ??
      (empleado.nombres ? `${empleado.nombres} ${empleado.apellidos ?? ""}`.trim() : null) ??
      "Sin empleado",
    fechaCompra:
      compra.fechaCompra ??
      compra.fecha_compra ??
      compra.purchaseDate ??
      compra.createdAt ??
      compra.created_at ??
      new Date().toISOString(),
    numeroFactura:
      compra.numeroFactura ??
      compra.numero_factura ??
      compra.invoiceNumber ??
      compra.facturaProveedor ??
      compra.factura ??
      "Sin factura",
    montoTotal: Number(
      compra.montoTotal ??
        compra.monto_total ??
        compra.total ??
        compra.totalCompra ??
        normalizedDetails.reduce((acc, item) => acc + Number(item.total || 0), 0),
    ),
    idEstado,
    id_estado: compra.id_estado ?? idEstado,
    idEstadoCompra: compra.idEstadoCompra ?? idEstado,
    id_estado_compra: compra.id_estado_compra ?? idEstado,
    estado: safeString(estadoCompra, idEstado ? `Estado ${idEstado}` : "Recibida"),
    estadoObjeto: estadoCompra,
    metodoPago: safeString(
      compra.metodoPago ??
        compra.metodo_pago ??
        compra.paymentMethod ??
        compra.payment_method ??
        compra.formaPago ??
        compra.forma_pago ??
        "",
      ""
    ),
    detalles: normalizedDetails,
  };
};

export const fetchCompras = async () => {
  const response = await authFetch(SHOPPING_ENDPOINT);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      payload.message ||
        payload.error ||
        `Error ${response.status} al consultar compras en shopping`,
    );
  }

  return extractShoppingList(payload).map(normalizeCompra);
};

export const registerCompra = async (formData) => {
  let id_empleado = 1; // Fallback default
  try {
    const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      const userId = user.idUsuario ?? user.idusuario ?? user.id_usuario ?? user.id;
      
      const empResponse = await authFetch("/api/employees");
      if (empResponse.ok) {
        const empPayload = await empResponse.json();
        const employees = Array.isArray(empPayload) ? empPayload : (empPayload.data ?? empPayload.employees ?? empPayload.empleados ?? []);
        const matchedEmployee = employees.find(emp => {
          const empUserId = emp.idUsuario ?? emp.idusuario ?? emp.id_usuario;
          return empUserId && String(empUserId) === String(userId);
        });
        if (matchedEmployee) {
          id_empleado = matchedEmployee.idEmpleado ?? matchedEmployee.idempleado ?? matchedEmployee.id_empleado ?? matchedEmployee.id;
        }
      }
    }
  } catch (e) {
    console.error("Error resolving employee ID, using fallback 1", e);
  }

  const subtotal = (formData.detalles || []).reduce((acc, curr) => acc + Number(curr.total || 0), 0);
  const total = subtotal * 1.19;

  const payload = {
    id_proveedor: parseInt(formData.idProveedor, 10) || 0,
    id_empleado: parseInt(id_empleado, 10) || 1,
    id_estado_compra: 1,
    total: parseFloat(total) || 0,
    productos: (formData.detalles || []).map(item => ({
      id_producto: parseInt(item.idProducto ?? item.id_producto ?? item.id, 10) || 0,
      cantidad: parseInt(item.cantidad, 10) || 0,
      costo_unitario: parseFloat(item.precioUnitario ?? item.costoUnitario ?? item.costo_unitario ?? 0) || 0
    }))
  };

  const response = await authFetch(SHOPPING_ENDPOINT, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const resData = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(resData.message || resData.error || resData.msg || "No se pudo registrar la compra.");
  }

  return normalizeCompra(resData.data || resData.shopping || resData.compra || resData);
};

export const fetchCompraStatuses = async () => {
  const response = await authFetch(`${SHOPPING_ENDPOINT}/statuses`);
  const payload  = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || payload.error || "Error al obtener los estados de compra.");
  }

  const raw = Array.isArray(payload) ? payload : (payload.data ?? []);
  return raw.map((s) => ({
    value:    s.idEstadoCompra ?? s.id_estado_compra,
    label:    s.nombre_estado  ?? s.nombreEstado ?? `Estado ${s.idEstadoCompra}`,
    colorHex: s.color_hex ?? null,
  }));
};

export const updateCompraStatus = async (idCompra, nextStatusId) => {
  const response = await authFetch(`${SHOPPING_ENDPOINT}/${idCompra}/status`, {
    method: "PUT",
    body: JSON.stringify({ id_estado_compra: nextStatusId }),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || payload.msg || payload.error || "No se pudo actualizar el estado.");
  }

  return payload;
};

export const isComprasAdmin = () => {
  try {
    const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      
      // Check role ID
      const rolId = user.idRol ?? user.idrol ?? user.id_rol ?? user.rol?.idRol ?? user.rol?.id_rol ?? user.id_rol_usuario;
      const rolStr = rolId !== undefined && rolId !== null ? String(rolId).trim() : "";
      
      // Check role Name
      const rolName = user.nombreRol ?? user.nombrerol ?? user.nombre_rol ?? user.rol?.nombreRol ?? user.rol?.nombrerol ?? user.rol?.nombre_rol ?? user.rol?.nombre;
      const rolNameStr = rolName !== undefined && rolName !== null ? String(rolName).trim().toLowerCase() : "";

      const usernameStr = String(user.nombreUsuario ?? user.nombre ?? "").trim().toLowerCase();

      // Grant access if the role ID, role name, or username indicates an administrator or master
      const isUserAdmin = (
        rolStr === "1" ||
        rolNameStr === "administrador" ||
        rolNameStr === "admin" ||
        rolNameStr === "master" ||
        usernameStr === "master" ||
        usernameStr === "admin" ||
        usernameStr === "administrador"
      );

      return isUserAdmin;
    }
  } catch (e) {
    console.error("Error parsing user role in isComprasAdmin:", e);
  }

  const rol = localStorage.getItem("id_rol");
  if (!rol || rol === "null" || rol === "undefined") return true;
  const rolVal = String(rol).trim().toLowerCase();
  return rolVal === "1" || rolVal === "administrador" || rolVal === "admin" || rolVal === "master";
};
