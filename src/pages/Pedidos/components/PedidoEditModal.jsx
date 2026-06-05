import React, { useEffect, useMemo, useRef, useState } from "react";
import { BaseFormModal } from "../../../components/shared/BaseFormModal";
import {
  Box,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  DollarSign,
  Edit2,
  Package,
  Plus,
  Trash2,
  User,
  XCircle,
  Info,
} from "lucide-react";
import PreciosVigentesPopover from "../../../components/feedback/PreciosVigentesPopover";
import { useProducts } from "../../../hooks/useProducts";

const getAuthToken = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token") || null;

const extractList = (payload, keys = []) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  for (const key of ["data", "content", ...keys, "rows", "items", "results"]) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") {
      const nested = extractList(value, keys);
      if (nested.length > 0) return nested;
    }
  }

  return [];
};

const fetchApiList = async (resource, keys = []) => {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const urls = [`/api/${resource}`, `http://localhost:8080/api/${resource}`];
  let lastError = null;

  for (const url of urls) {
    try {
      const response = await fetch(url, { headers });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        lastError = new Error(payload?.message || payload?.error || `Error ${response.status} al cargar ${resource}`);
        continue;
      }

      return extractList(payload, keys);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error(`No se pudo cargar ${resource}`);
};

const fetchProductById = async (productId) => {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const urls = [`/api/productos/${productId}`, `http://localhost:8080/api/productos/${productId}`];
  let lastError = null;
  for (const url of urls) {
    try {
      const response = await fetch(url, { headers });
      if (!response.ok) {
        lastError = new Error(response.statusText || `Error ${response.status}`);
        continue;
      }
      const data = await response.json();
      return data?.data ?? data;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error(`No se pudo obtener el producto #${productId}`);
};

const moneyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const getPedidoId = (pedido) => pedido?.idPedido ?? pedido?.id_pedido ?? pedido?.id;

const formatPedidoCode = (pedido) => {
  const id = getPedidoId(pedido);
  return id ? `PED-${String(id).padStart(3, "0")}` : "PED-000";
};

const formatDate = (value) => {
  if (!value) return "No registrada";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No registrada";

  return date.toLocaleDateString("es-CO", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const formatMoney = (value) => moneyFormatter.format(Number(value || 0));

const getStatusMeta = (statusId) => {
  const status = Number(statusId);
  if (status === 2) return { label: "Despachado", icon: Package,      className: "border-emerald-200 bg-emerald-100 text-emerald-700" };
  if (status === 3) return { label: "Cancelado",  icon: XCircle,      className: "border-red-200    bg-red-100    text-red-700"    };
  if (status === 4) return { label: "Entregado",  icon: CheckCircle2, className: "border-blue-200   bg-blue-100   text-blue-700"   };
  if (status === 5) return { label: "Pagado",     icon: DollarSign,   className: "border-violet-200 bg-violet-100 text-violet-700" };
  return { label: "En Proceso", icon: Clock3, className: "border-amber-200 bg-amber-100 text-amber-700" };
};

const getDetailValues = (detalle) => {
  const quantity = Number(detalle.cantidad ?? detalle.cantidad_solicitada ?? 0);
  const unitPrice = Number(detalle.precio_unitario ?? detalle.precio_venta ?? 0);
  const subtotal = quantity * unitPrice;
  const discountPercent = Math.min(
    Math.max(Number(detalle.descuento_porcentaje ?? 0), 0),
    100
  );
  const discount = subtotal * (discountPercent / 100);
  const total = Math.max(subtotal - discount, 0);

  return { quantity, unitPrice, subtotal, discountPercent, discount, total };
};

const emptyProduct = {
  id_producto: "",
  codigo: "",
  nombreProducto: "",
  cantidad: "1",
  precio_unitario: "0",
  descuento_porcentaje: "0",
};

const getUserId = (user) => user.idUsuario || user.idusuario || user.id_usuario || user.id;
const getUserName = (user) =>
  user.nombreUsuario ||
  user.nombreusuario ||
  user.nombre_usuario ||
  user.nombre ||
  user.name ||
  user.email ||
  `Vendedor ID: ${getUserId(user)}`;
const getRoleName = (role) => role.nombreRol || role.nombre_rol || role.nombre || role.name || "";
const getRoleId = (role) => role.idRol || role.idrol || role.id_rol || role.id;
const getUserRoleId = (user) =>
  user.idRol || user.idrol || user.id_rol || user.id_rol_usuario || user.rol?.idRol || user.rol?.id_rol;

const isActiveRecord = (record) => {
  const activeState = record.idEstado ?? record.idestado ?? record.id_estado ?? record.activo;
  return ![false, 0, 2, "0", "2", "inactivo", "inactive"].includes(
    typeof activeState === "string" ? activeState.toLowerCase().trim() : activeState
  );
};

export default function PedidoEditModal({
  isOpen,
  onClose,
  pedido,
  formData,
  onInputChange,
  onSelectChange,
  onSubmit,
  loading,
  onSaveSuccess,
}) {
  const [newProduct, setNewProduct] = useState(emptyProduct);
  const priceManuallySet = useRef(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showPriceList, setShowPriceList] = useState(false);
  const [sellers, setSellers] = useState([]);
  const [sellersLoading, setSellersLoading] = useState(false);
  const [sellerError, setSellerError] = useState("");
  const initialData = useRef(null);
  const isInitializing = useRef(false);
  const formDataRef = useRef(formData);
  const { products, loading: productsLoading } = useProducts();

  // Mantener formDataRef siempre actualizado
  useEffect(() => {
    formDataRef.current = formData;
  });

  const detalles = Array.isArray(formData?.detalles) ? formData.detalles : [];
  const statusMeta = getStatusMeta(formData?.id_estado_pedido ?? pedido?.id_estado_pedido ?? pedido?.idEstado);

  const totals = useMemo(() => {
    return detalles.reduce(
      (acc, detalle) => {
        const values = getDetailValues(detalle);
        acc.subtotal += values.subtotal;
        acc.discount += values.discount;
        acc.total += values.total;
        return acc;
      },
      { subtotal: 0, discount: 0, total: 0 }
    );
  }, [detalles]);

  const iva = totals.total * 0.19;
  const totalPedido = totals.total + iva;
  const newProductPreview = getDetailValues(newProduct).total;

  const setField = (name, value) => {
    if (onSelectChange) {
      onSelectChange(name, value);
      return;
    }
    onInputChange({ target: { name, value } });
  };

  const buildSellerList = (userList = [], roleList = [], employeeList = []) => {
    const roleById = roleList.reduce((map, role) => {
      const id = getRoleId(role);
      if (id) map[id.toString()] = getRoleName(role);
      return map;
    }, {});

    const mappedUsers = userList.map((user) => {
      const id = getUserId(user);
      const roleId = getUserRoleId(user);
      const roleName =
        user.nombreRol ||
        user.nombre_rol ||
        user.rol?.nombreRol ||
        user.rol?.nombre_rol ||
        roleById[roleId?.toString()] ||
        "";
      const sellerText = `${roleName} ${user.cargo || ""} ${user.rolOperativo || ""}`.toLowerCase();

      return {
        ...user,
        idVendedor: id,
        nombreVendedor: getUserName(user),
        tipoVendedor: roleName || "Usuario",
        isSeller: sellerText.includes("vendedor") || sellerText.includes("ventas") || sellerText.includes("venta"),
        isActive: isActiveRecord(user),
      };
    });

    const mappedEmployees = employeeList.map((employee) => {
      const employeeUserRoleId = getUserRoleId(employee.usuario || employee);
      const roleName =
        employee.usuario?.rol?.nombreRol ||
        employee.usuario?.rol?.nombre ||
        roleById[employeeUserRoleId?.toString()] ||
        employee.rolOperativo ||
        employee.rol_operativo ||
        employee.nombreRol ||
        employee.cargo ||
        "";
      const sellerText = roleName.toLowerCase();
      const employeeId =
        employee.idEmpleado ||
        employee.idempleado ||
        employee.id_empleado ||
        employee.id;
      const firstName = employee.nombre || employee.nombres || "";
      const lastName = employee.apellido || employee.apellidos || "";

      return {
        ...employee,
        idVendedor: employeeId,
        nombreVendedor:
          `${firstName} ${lastName}`.trim() ||
          employee.usuario?.nombreUsuario ||
          employee.usuario?.email ||
          `Vendedor ID: ${employeeId}`,
        tipoVendedor: roleName || "Empleado",
        isSeller: sellerText.includes("vendedor") || sellerText.includes("ventas") || sellerText.includes("venta"),
        isActive: isActiveRecord(employee),
      };
    });

    const sellerMap = new Map();
    mappedEmployees
      .filter((seller) => seller.idVendedor && seller.isActive && seller.isSeller)
      .forEach((seller) => sellerMap.set(seller.idVendedor.toString(), seller));

    const currentSellerId = formData?.id_vendedor || pedido?.id_vendedor || pedido?.idVendedor;
    const currentSellerName = formData?.nombreVendedor || pedido?.nombreVendedor || pedido?.vendedorNombre;
    if (currentSellerId && currentSellerName && !sellerMap.has(currentSellerId.toString())) {
      sellerMap.set(currentSellerId.toString(), {
        idVendedor: currentSellerId,
        nombreVendedor: currentSellerName,
        tipoVendedor: "Vendedor actual",
        isSeller: true,
        isActive: true,
      });
    }

    return Array.from(sellerMap.values()).sort((a, b) =>
      a.nombreVendedor.localeCompare(b.nombreVendedor, "es", { sensitivity: "base" })
    );
  };

  const fetchSellers = async () => {
    setSellersLoading(true);
    setSellerError("");

    try {
      const [userResult, roleResult, employeeResult] = await Promise.allSettled([
        fetchApiList("users", ["users", "usuarios"]),
        fetchApiList("roles", ["roles"]),
        fetchApiList("employees", ["employees", "empleados"]),
      ]);
      const userList = userResult.status === "fulfilled" ? userResult.value : [];
      const roleList = roleResult.status === "fulfilled" ? roleResult.value : [];
      const employeeList = employeeResult.status === "fulfilled" ? employeeResult.value : [];

      setSellers(buildSellerList(userList, roleList, employeeList));
    } catch (error) {
      setSellerError(error.message || "No se pudieron cargar los vendedores.");
      setSellers([]);
    } finally {
      setSellersLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && formData) {
      // Marca que estamos inicializando para ignorar cambios automáticos
      isInitializing.current = true;
      initialData.current = null;
      setHasChanges(false);
      setSaveSuccess(false);
      setNewProduct(emptyProduct);
      setShowPriceList(false);
      fetchSellers();

      // Captura el estado inicial después de que React haya procesado
      // todos los batch updates del padre (mapeado de detalles, etc.)
      const timer = setTimeout(() => {
        if (formDataRef.current) {
          initialData.current = JSON.stringify(formDataRef.current);
        }
        isInitializing.current = false;
      }, 150);

      return () => clearTimeout(timer);
    }
    if (!isOpen) {
      initialData.current = null;
      isInitializing.current = false;
      setHasChanges(false);
      setShowPriceList(false);
      priceManuallySet.current = false;
    }
  }, [isOpen, pedido]);

  useEffect(() => {
    // Ignorar cambios durante la inicialización o si no hay estado inicial
    if (isInitializing.current || !initialData.current || !formData) return;
    setHasChanges(JSON.stringify(formData) !== initialData.current);
  }, [formData]);

  const handleProductFieldChange = (name, value) => {
    if (name === "precio_unitario") {
      priceManuallySet.current = true;
    }
    setNewProduct((prev) => ({ ...prev, [name]: value }));
  };

  const selectedSeller = sellers.find((seller) =>
    seller.idVendedor?.toString() === formData?.id_vendedor?.toString()
  );
  const currentSellerName =
    selectedSeller?.nombreVendedor ||
    formData?.nombreVendedor ||
    pedido?.nombreVendedor ||
    pedido?.vendedorNombre ||
    (formData?.id_vendedor ? `Vendedor ID: ${formData.id_vendedor}` : "Sin vendedor asignado");

  const handleSellerSelect = (value) => {
    const seller = sellers.find((item) => item.idVendedor?.toString() === value);
    setField("id_vendedor", value);
    setField("nombreVendedor", seller?.nombreVendedor || "");
  };

  const getProductId = (product) => product.idProducto ?? product.id_producto ?? product.id;

  const getProductName = (product) => {
    const raw = product.nombre ||
      product.nombreProducto ||
      product.descripcion ||
      product.referencia ||
      `Producto #${getProductId(product)}`;
    return raw.replace(/\s*\(.*?\)/g, '').replace(/\s*\[.*?\]/g, '').trim();
  };

  const getProductReference = (product) =>
    product.referencia || product.codigo || product.sku || product.codigoProducto || "";

  const getProductPrice = (product) => {
    const priceOptions = [
      product.precio_publico,
      product.precioPublico,
      product.precio_mayorista,
      product.precioMayorista,
      product.precio_minorista,
      product.precioMinorista,
      product.precio_venta,
      product.precioVenta,
      product.precio_compra,
      product.precioCompra,
    ];

    const validPrice = priceOptions
      .map((value) => Number(value || 0))
      .find((value) => value > 0);

    return validPrice || 0;
  };

  const handleProductSelect = async (productId) => {
    priceManuallySet.current = false;
    const selectedProduct = products.find((product) => getProductId(product)?.toString() === productId);
    if (!selectedProduct) {
      setNewProduct(emptyProduct);
      return;
    }

    setNewProduct((prev) => ({
      ...prev,
      id_producto: getProductId(selectedProduct),
      codigo: getProductReference(selectedProduct),
      nombreProducto: getProductName(selectedProduct),
      precio_unitario: getProductPrice(selectedProduct),
      producto: selectedProduct,
    }));

    try {
      const freshProduct = await fetchProductById(productId);
      if (freshProduct) {
        setNewProduct((prev) => ({
          ...prev,
          producto: freshProduct,
          ...(!priceManuallySet.current
            ? { precio_unitario: getProductPrice(freshProduct) }
            : {}),
        }));
      }
    } catch {
      // Keep cached data
    }
  };

  const handleAddProduct = () => {
    const name = newProduct.nombreProducto.trim();
    const code = newProduct.codigo.trim();
    if (!name && !code) return;

    const detail = {
      id_producto: newProduct.id_producto,
      codigo: code,
      nombreProducto: name || code,
      cantidad: Number(newProduct.cantidad || 0),
      precio_unitario: Number(newProduct.precio_unitario || 0),
      descuento_porcentaje: Math.min(Math.max(Number(newProduct.descuento_porcentaje || 0), 0), 100),
      producto: newProduct.producto || undefined,
    };

    setField("detalles", [...detalles, detail]);
    setNewProduct(emptyProduct);
  };

  const handleRemoveProduct = (indexToRemove) => {
    setField(
      "detalles",
      detalles.filter((_, index) => index !== indexToRemove)
    );
  };

  const handleDetailChange = (indexToUpdate, field, value) => {
    const numericFields = ["cantidad", "precio_unitario", "descuento_porcentaje"];
    const parsedValue = Math.max(Number(value || 0), 0);
    const nextValue = field === "descuento_porcentaje"
      ? Math.min(parsedValue, 100)
      : numericFields.includes(field)
        ? parsedValue
        : value;

    setField(
      "detalles",
      detalles.map((detalle, index) =>
        index === indexToUpdate
          ? {
              ...detalle,
              [field]: nextValue,
              ...(field === "cantidad" ? { cantidad_solicitada: nextValue } : {}),
              ...(field === "precio_unitario" ? { precio_venta: nextValue } : {}),
            }
          : detalle
      )
    );
  };

  const handleSave = async () => {
    const result = await onSubmit();
    if (result) {
      setSaveSuccess(true);
      setTimeout(() => {
        onClose();
        setTimeout(() => {
          if (onSaveSuccess) onSaveSuccess();
          setSaveSuccess(false);
        }, 250);
      }, 500);
    }
  };

  if (!pedido) return null;

  return (
    <BaseFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Pedido"
      subtitle="Modifica la información completa del pedido y su lista de productos"
      icon={Edit2}
      loading={loading}
      saveSuccess={saveSuccess}
      isEditing
      isSubmitDisabled={!hasChanges}
      maxWidthClass="sm:max-w-[1020px]"
      onSubmit={handleSave}
    >
        <div className="text-slate-900 dark:text-slate-100 bg-white dark:bg-zinc-900">
          <section className="flex flex-col gap-4 border-b border-slate-200 dark:border-zinc-800 pb-6 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-black dark:text-white">
                Pedido {formatPedidoCode(pedido)}
              </h2>
              <p className="mt-2 text-base text-slate-600 dark:text-zinc-400">
                {formatDate(pedido.fechaPedido ?? pedido.fecha_pedido)}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:min-w-40">
              {(() => {
                const StatusIcon = statusMeta.icon;
                return (
                  <span
                    className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold ${statusMeta.className}`}
                  >
                    {StatusIcon && <StatusIcon className="h-4 w-4" />}
                    {statusMeta.label}
                  </span>
                );
              })()}
            </div>
          </section>

          <section className="mt-6 border-b border-slate-200 dark:border-zinc-800 pb-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-black dark:text-white">
              <BadgeCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              Vendedor del Pedido
            </h3>

            <div className="mt-4 rounded-lg border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/70 dark:bg-emerald-950/20 p-4">
              <div className="grid gap-2">
                <Field label="Vendedor asignado">
                  <select
                    value={formData.id_vendedor || ""}
                    onChange={(e) => handleSellerSelect(e.target.value)}
                    className="h-10 w-full rounded-lg border border-transparent dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="">
                      {sellersLoading ? "Cargando vendedores..." : "Seleccionar vendedor"}
                    </option>
                    {sellers.map((seller) => (
                      <option key={seller.idVendedor} value={seller.idVendedor}>
                        {seller.nombreVendedor} {seller.tipoVendedor ? `- ${seller.tipoVendedor}` : ""}
                      </option>
                    ))}
                  </select>
                </Field>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  {currentSellerName} · ID vendedor: {formData.id_vendedor || pedido.id_vendedor || "Sin asignar"}
                </p>
              </div>
              {sellerError && (
                <p className="mt-3 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 text-sm text-amber-800 dark:text-amber-450">
                  {sellerError}
                </p>
              )}
            </div>
          </section>

          <section className="mt-6 border-b border-slate-200 dark:border-zinc-800 pb-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-black dark:text-white">
              <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Informacion del Cliente
            </h3>

            <div className="mt-4 rounded-lg border border-blue-200 dark:border-blue-900/40 bg-blue-50/70 dark:bg-blue-950/20 p-4">
              <div className="grid gap-x-4 gap-y-4 md:grid-cols-2">
                <Field label="Nombre / Razon Social">
                  <input
                    name="nombreCliente"
                    value={formData.nombreCliente || ""}
                    onChange={onInputChange}
                    className="h-10 w-full rounded-lg border border-transparent dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                </Field>
                <Field label="NIT / Cedula">
                  <input
                    name="numeroDocumento"
                    value={formData.numeroDocumento || ""}
                    onChange={onInputChange}
                    className="h-10 w-full rounded-lg border border-transparent dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                </Field>
                <Field label="Telefono">
                  <input
                    name="telefono"
                    value={formData.telefono || ""}
                    onChange={onInputChange}
                    className="h-10 w-full rounded-lg border border-transparent dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                </Field>
                <Field label="Email">
                  <input
                    name="email"
                    value={formData.email || ""}
                    onChange={onInputChange}
                    className="h-10 w-full rounded-lg border border-transparent dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                </Field>
                <Field label="Direccion" className="md:col-span-2">
                  <input
                    name="direccion"
                    value={formData.direccion || ""}
                    onChange={onInputChange}
                    className="h-10 w-full rounded-lg border border-transparent dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                </Field>
                <Field label="Condicion de Pago">
                  <select
                    value={formData.tipo_pago || ""}
                    onChange={(e) => setField("tipo_pago", e.target.value)}
                    className="h-10 w-full rounded-lg border border-transparent dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Seleccionar</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Contado">Contado</option>
                    <option value="Credito">Credito</option>
                    <option value="Transferencia">Transferencia</option>
                  </select>
                </Field>
              </div>
            </div>
          </section>

          <section className="mt-6 border-b border-slate-200 dark:border-zinc-800 pb-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-black dark:text-white">
              <Box className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              Productos del Pedido
            </h3>

            <div className="mt-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950/40 p-4">
              <div className="grid items-end gap-3 md:grid-cols-[minmax(0,1fr)_80px_120px_104px_48px]">
                <LabeledControl label="Catalogo de Productos">
                  <select
                    value={newProduct.id_producto?.toString() || ""}
                    onChange={(e) => handleProductSelect(e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="">
                      {productsLoading ? "Cargando productos..." : "Buscar producto..."}
                    </option>
                    {products
                      .filter((product) => getProductId(product))
                      .map((product) => {
                        const reference = getProductReference(product);
                        const stock = product.stockBuenEstado ?? product.stock_buen_estado ?? 0;
                        return (
                          <option key={getProductId(product)} value={getProductId(product)}>
                            {getProductName(product)} {reference ? `| Ref: ${reference}` : ""} | Disp: {stock}
                          </option>
                        );
                      })}
                  </select>
                </LabeledControl>

                <LabeledControl label="Cant.">
                  <input
                    value={newProduct.cantidad}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      handleProductFieldChange("cantidad", val ? parseInt(val, 10) : "");
                    }}
                    onKeyDown={(e) => {
                      if (['.', ',', '-', 'e', 'E'].includes(e.key)) e.preventDefault();
                    }}
                    onBlur={(e) => {
                      if (!newProduct.cantidad || newProduct.cantidad < 1) {
                         handleProductFieldChange("cantidad", 1);
                      }
                    }}
                    type="number"
                    min="1"
                    step="1"
                    className="h-9 w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-center text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                  />
                </LabeledControl>

                <div className="flex flex-col gap-1.5 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Precio Unit.</span>
                    {newProduct.producto && (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowPriceList(!showPriceList)}
                          className="text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-350 p-0.5 rounded transition-colors focus:outline-none"
                          title="Ver precios de base de datos"
                        >
                          <Info size={14} className="cursor-pointer" />
                        </button>

                        {showPriceList && (
                          <PreciosVigentesPopover
                            precios={newProduct.producto}
                            onSelectPrice={(val) => handleProductFieldChange("precio_unitario", val)}
                            onClose={() => setShowPriceList(false)}
                          />
                        )}
                      </div>
                    )}
                  </div>
                  <input
                    value={newProduct.precio_unitario}
                    onChange={(e) => handleProductFieldChange("precio_unitario", e.target.value)}
                    type="number"
                    min="0"
                    step="0.01"
                    className="h-9 w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-right text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <LabeledControl label="Desc. %">
                  <input
                  value={newProduct.descuento_porcentaje}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    const parsed = val ? parseInt(val, 10) : 0;
                    handleProductFieldChange("descuento_porcentaje", Math.min(Math.max(parsed, 0), 100));
                  }}
                  onKeyDown={(e) => {
                    if (['.', ',', '-', 'e', 'E'].includes(e.key)) e.preventDefault();
                  }}
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    className="h-9 w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-right text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                  />
                </LabeledControl>

                <button
                  type="button"
                  onClick={handleAddProduct}
                  className="inline-flex h-9 w-12 items-center justify-center rounded-lg bg-emerald-300 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white transition hover:bg-emerald-400"
                  title={`Agregar producto - subtotal ${formatMoney(newProductPreview)}`}
                  aria-label="Agregar producto"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>

              {(newProduct.codigo || newProduct.nombreProducto) && (
                <div className="mt-3 grid gap-2 text-xs text-slate-500 dark:text-zinc-400 md:grid-cols-2">
                  <span>
                    Ref: <strong className="text-slate-700 dark:text-zinc-200">{newProduct.codigo || "Sin referencia"}</strong>
                  </span>
                  <span>
                    Producto: <strong className="text-slate-700 dark:text-zinc-200">{newProduct.nombreProducto || "Sin nombre"}</strong>
                  </span>
                </div>
              )}
            </div>

            <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 dark:border-zinc-800">
              <table className="w-full text-sm">
                <thead className="bg-violet-50 dark:bg-zinc-800/40 text-left text-slate-900 dark:text-zinc-200">
                  <tr>
                    <th className="px-3 py-3 font-semibold">Codigo</th>
                    <th className="px-3 py-3 font-semibold">Descripcion</th>
                    <th className="px-3 py-3 text-center font-semibold">Cantidad</th>
                    <th className="px-3 py-3 text-right font-semibold">Precio Unit.</th>
                    <th className="px-3 py-3 text-right font-semibold">Subtotal</th>
                    <th className="px-3 py-3 text-right font-semibold">Desc. %</th>
                    <th className="px-3 py-3 text-right font-semibold">Total</th>
                    <th className="px-3 py-3 text-right font-semibold"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                  {detalles.length > 0 ? (
                    detalles.map((detalle, index) => {
                      const values = getDetailValues(detalle);
                      const code =
                        detalle.codigo ||
                        detalle.producto?.referencia ||
                        detalle.referenciaProducto ||
                        detalle.id_producto ||
                        "-";
                      const name =
                        detalle.nombreProducto ||
                        detalle.producto?.nombre ||
                        detalle.descripcion ||
                        "Producto sin nombre";

                      return (
                        <tr key={detalle.idDetallePedido || detalle.id_detalle_pedido || index}>
                          <td className="px-3 py-3">
                            <input
                              value={code}
                              onChange={(e) => handleDetailChange(index, "codigo", e.target.value)}
                              className="h-9 w-full min-w-28 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 text-sm font-semibold text-violet-700 dark:text-violet-400 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                            />
                          </td>
                          <td className="px-3 py-3">
                            <input
                              value={name}
                              onChange={(e) => handleDetailChange(index, "nombreProducto", e.target.value)}
                              className="h-9 w-full min-w-48 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                            />
                          </td>
                          <td className="px-3 py-3 text-center">
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={values.quantity}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                handleDetailChange(index, "cantidad", val ? parseInt(val, 10) : "");
                              }}
                              onKeyDown={(e) => {
                                if (['.', ',', '-', 'e', 'E'].includes(e.key)) e.preventDefault();
                              }}
                              onBlur={(e) => {
                                if (!values.quantity || values.quantity < 1) {
                                  handleDetailChange(index, "cantidad", 1);
                                }
                              }}
                              className="h-9 w-20 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 text-center text-sm text-slate-900 dark:text-white outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                            />
                          </td>
                          <td className="px-3 py-3 text-right">
                            <input
                              type="number"
                              min="0"
                              value={values.unitPrice}
                              onChange={(e) => handleDetailChange(index, "precio_unitario", e.target.value)}
                              className="h-9 w-28 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 text-right text-sm text-slate-900 dark:text-white outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                            />
                          </td>
                          <td className="px-3 py-3 text-right text-slate-900 dark:text-zinc-150">{formatMoney(values.subtotal)}</td>
                          <td className="px-3 py-3 text-right">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="1"
                              value={values.discountPercent}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                const parsed = val ? parseInt(val, 10) : 0;
                                handleDetailChange(index, "descuento_porcentaje", Math.min(Math.max(parsed, 0), 100));
                              }}
                              onKeyDown={(e) => {
                                if (['.', ',', '-', 'e', 'E'].includes(e.key)) e.preventDefault();
                              }}
                              className="h-9 w-28 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 text-right text-sm text-red-600 dark:text-red-400 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                            />
                          </td>
                          <td className="px-3 py-3 text-right font-semibold text-emerald-700 dark:text-emerald-400">{formatMoney(values.total)}</td>
                          <td className="px-3 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveProduct(index)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-600 dark:text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950/30"
                              title="Eliminar producto"
                              aria-label="Eliminar producto"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td className="px-3 py-6 text-center text-slate-550 dark:text-zinc-400" colSpan={8}>
                        No hay productos registrados en este pedido.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="ml-auto mt-6 w-full max-w-[480px] space-y-3">
              <SummaryRow label="Subtotal con Descuento:" value={formatMoney(totals.total)} />
              <SummaryRow label="Descuento Total:" value={totals.discount > 0 ? `-${formatMoney(totals.discount)}` : formatMoney(0)} danger />
              <SummaryRow label="IVA Total (19%):" value={formatMoney(iva)} warning />
              <div className="flex items-center justify-between rounded-lg border border-violet-300 dark:border-violet-900/60 bg-violet-50 dark:bg-violet-950/20 px-4 py-4">
                <span className="text-base font-semibold text-violet-900 dark:text-violet-300">Total del Pedido:</span>
                <strong className="text-xl font-semibold text-violet-800 dark:text-violet-400">{formatMoney(totalPedido)}</strong>
              </div>
            </div>
          </section>
        </div>
    </BaseFormModal>
  );
}

const Field = ({ label, className = "", children }) => (
  <label className={`block ${className}`}>
    <span className="mb-1.5 block text-sm font-semibold text-black dark:text-zinc-300">{label}</span>
    {children}
  </label>
);

const LabeledControl = ({ label, children }) => (
  <label className="flex min-w-0 flex-col gap-1.5">
    <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">{label}</span>
    {children}
  </label>
);

const SummaryRow = ({ label, value, danger = false, warning = false }) => (
  <div className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-zinc-950/40 px-4 py-3 text-sm">
    <span className="text-slate-600 dark:text-zinc-400">{label}</span>
    <strong className={danger ? "text-red-600 dark:text-red-400" : warning ? "text-amber-700 dark:text-amber-400" : "text-slate-950 dark:text-zinc-200"}>
      {value}
    </strong>
  </div>
);
