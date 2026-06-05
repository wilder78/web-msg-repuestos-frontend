import React, { useState, useEffect, useRef, useMemo } from "react";
import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { ShoppingCart, Plus, Trash2, Hash, Calendar, FileText, User, BadgeCheck, Pencil, Check, Info, Box, AlertCircle } from "lucide-react";
import { useProducts } from "../../../hooks/useProducts";
import PreciosVigentesPopover from "../../../components/feedback/PreciosVigentesPopover";

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

export function PedidoForm({
  formData,
  setFormData,
  isEditing = false,
  pedido = null,
  submitError = null,
  onValidityChange,
}) {
  const { products, loading: productsLoading } = useProducts();
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [sellers, setSellers] = useState([]);
  const [sellersLoading, setSellersLoading] = useState(true);
  const [credits, setCredits] = useState([]);
  const [catalogError, setCatalogError] = useState("");

  const [currentDetail, setCurrentDetail] = useState({
    id_producto: "",
    cantidad: 1,
    precio_unitario: 0,
    descuento_porcentaje: 0,
    nombreProducto: "",
    referenciaProducto: ""
  });
  const [editingDetailIndex, setEditingDetailIndex] = useState(null);
  const [showPriceList, setShowPriceList] = useState(false);
  const priceManuallySet = useRef(false);

  useEffect(() => {
    fetchCatalogs();
  }, []);

  const fetchCatalogs = async () => {
    setCustomersLoading(true);
    setSellersLoading(true);
    setCatalogError("");

    try {
      const [customerResult, userResult, roleResult, employeeResult, creditResult] = await Promise.allSettled([
        fetchApiList("customers", ["customers", "clientes"]),
        fetchApiList("users", ["users", "usuarios"]),
        fetchApiList("roles", ["roles"]),
        fetchApiList("employees", ["employees", "empleados"]),
        fetchApiList("credits", ["credits", "data"]),
      ]);

      const customerList = customerResult.status === "fulfilled" ? customerResult.value : [];
      const userList = userResult.status === "fulfilled" ? userResult.value : [];
      const roleList = roleResult.status === "fulfilled" ? roleResult.value : [];
      const employeeList = employeeResult.status === "fulfilled" ? employeeResult.value : [];
      const creditList = creditResult.status === "fulfilled" ? creditResult.value : [];
      
      setCredits(creditList);

      const mappedCustomers = customerList.map(c => {
        const rawStatus = c.activo ?? c.idEstado ?? c.id_estado ?? c.estado?.idEstado ?? c.estado?.id_estado ?? c.estado;
        const normalizedStatus = typeof rawStatus === "string" ? rawStatus.toLowerCase().trim() : rawStatus;
        const inactiveValues = [false, 0, 2, "0", "2", "inactivo", "inactive"];

        return {
          ...c,
          idCliente: c.idCliente || c.id_cliente || c.id,
          activoNormalizado: inactiveValues.includes(normalizedStatus) ? 2 : 1
        };
      });

      const activeCustomers = mappedCustomers.filter(c => c.activoNormalizado === 1);
      setCustomers(activeCustomers.length > 0 ? activeCustomers : mappedCustomers);

      const roleById = roleList.reduce((map, role) => {
        const id = getRoleId(role);
        if (id) map[id.toString()] = getRoleName(role);
        return map;
      }, {});

      const mappedUsers = userList.map(user => {
        const id = getUserId(user);
        const roleId = getUserRoleId(user);
        const roleName = user.nombreRol || user.nombre_rol || user.rol?.nombreRol || user.rol?.nombre_rol || roleById[roleId?.toString()] || "";
        const sellerText = `${roleName} ${user.cargo || ""} ${user.rolOperativo || ""}`.toLowerCase();
        const activeState = user.idEstado ?? user.id_estado ?? user.activo;
        const isActive = ![false, 0, 2, "0", "2", "inactivo", "inactive"].includes(
          typeof activeState === "string" ? activeState.toLowerCase().trim() : activeState
        );

        return {
          ...user,
          idVendedor: id,
          nombreVendedor: getUserName(user),
          tipoVendedor: roleName || "Usuario",
          isSeller: sellerText.includes("vendedor") || sellerText.includes("ventas") || sellerText.includes("venta"),
          isActive,
        };
      });

      const mappedEmployees = employeeList.map(employee => {
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
        const employeeId = employee.idEmpleado || employee.idempleado || employee.id_empleado || employee.id || employee.idEmployee;
        const firstName = employee.nombre || employee.nombres || "";
        const lastName = employee.apellido || employee.apellidos || "";
        const activeState = employee.idEstado ?? employee.id_estado ?? employee.activo;
        const isActive = ![false, 0, 2, "0", "2", "inactivo", "inactive"].includes(
          typeof activeState === "string" ? activeState.toLowerCase().trim() : activeState
        );

        return {
          ...employee,
          idVendedor: employeeId,
          nombreVendedor: `${firstName} ${lastName}`.trim() || employee.usuario?.nombreUsuario || employee.usuario?.email || `Vendedor ID: ${employeeId}`,
          tipoVendedor: roleName || "Empleado",
          isSeller: sellerText.includes("vendedor") || sellerText.includes("ventas") || sellerText.includes("venta"),
          isActive,
        };
      });

      const sellerMap = new Map();
      mappedEmployees
        .filter((seller) => seller.idVendedor && seller.isActive && seller.isSeller)
        .forEach((seller) => sellerMap.set(seller.idVendedor.toString(), seller));

      setSellers(Array.from(sellerMap.values()));
    } catch (err) {
      setCatalogError(err.message || "No se pudieron cargar clientes y vendedores.");
      setCustomers([]);
      setSellers([]);
    } finally {
      setCustomersLoading(false);
      setSellersLoading(false);
    }
  };

  const getCustomerId = (c) => c.idCliente || c.id_cliente || c.id;
  const getCustomerName = (c) => c.razonSocial || c.clienteNombre || c.nombreCliente || c.nombre || c.numeroDocumento || `Cliente ID: ${getCustomerId(c)}`;
  const getCustomerAddress = (c) => c.direccion || c.address || "Sin dato";
  const getCustomerCity = (c) => c.municipio?.nombre || c.municipio?.name || c.ciudad || c.city || c.nombreMunicipio || c.municipioNombre || "Sin dato";

  const selectedCustomer = customers.find((c) => getCustomerId(c)?.toString() === formData.id_cliente?.toString());
  const selectedSeller = sellers.find((s) => s.idVendedor?.toString() === formData.id_vendedor?.toString());
  const selectedCredit = credits.find(c => (c.idCliente || c.id_cliente || c.id)?.toString() === formData.id_cliente?.toString());

  const details = Array.isArray(formData.detalles) ? formData.detalles : [];

  const totals = useMemo(() => {
    return details.reduce(
      (acc, d) => {
        const qty = Number(d.cantidad || 0);
        const price = Number(d.precio_unitario || 0);
        const sub = qty * price;
        const discPct = Math.min(Math.max(Number(d.descuento_porcentaje || 0), 0), 100);
        const disc = sub * (discPct / 100);
        acc.subtotal += sub;
        acc.discount += disc;
        acc.total += (sub - disc);
        return acc;
      },
      { subtotal: 0, discount: 0, total: 0 }
    );
  }, [details]);

  const iva = totals.total * 0.19;
  const totalPedido = totals.total + iva;

  const isCreditActive = selectedCredit ? ![false, 0, 2, "0", "2", "inactivo", "inactive"].includes(
    typeof (selectedCredit.estado || selectedCredit.activo || selectedCredit.idEstado || selectedCredit.id_estado) === "string" 
      ? (selectedCredit.estado || selectedCredit.activo || selectedCredit.idEstado || selectedCredit.id_estado).toLowerCase().trim() 
      : (selectedCredit.estado || selectedCredit.activo || selectedCredit.idEstado || selectedCredit.id_estado)
  ) : false;

  useEffect(() => {
    const isValid = 
      formData.id_cliente &&
      formData.id_vendedor &&
      formData.tipo_pago &&
      details.length > 0 &&
      (formData.tipo_pago !== "Credito" || (selectedCredit && isCreditActive && (Number(selectedCredit.cupoAprobado || selectedCredit.cupo_aprobado || 0) - Number(selectedCredit.saldoPendiente || selectedCredit.saldo_pendiente || selectedCredit.cupoUtilizado || selectedCredit.cupo_utilizado || 0) >= totalPedido)));
    
    if (onValidityChange) {
      onValidityChange(!!isValid);
    }
  }, [formData, details, selectedCredit, isCreditActive, totalPedido, onValidityChange]);

  const handleCustomerSelect = (value) => {
    const customer = customers.find((item) => getCustomerId(item)?.toString() === value);
    setFormData((prev) => ({
      ...prev,
      id_cliente: value,
      nombreCliente: customer ? getCustomerName(customer) : "",
      clienteDocumento: customer?.numeroDocumento || customer?.documento || "",
      clienteEmail: customer?.email || "",
      clienteTelefono: customer?.telefono || customer?.celular || "",
      clienteDireccion: customer ? getCustomerAddress(customer) : "",
      clienteCiudad: customer ? getCustomerCity(customer) : "",
    }));
  };

  const handleSellerSelect = (value) => {
    const seller = sellers.find((item) => item.idVendedor?.toString() === value);
    setFormData((prev) => ({
      ...prev,
      id_vendedor: value,
      nombreVendedor: seller?.nombreVendedor || "",
    }));
  };

  const getProductPrice = (prod) => {
    const customerType = (selectedCustomer?.tipo_cliente || selectedCustomer?.tipoCliente || "").toString().toLowerCase().trim();
    if (customerType === "mayorista") {
      const p = Number(prod.precio_mayorista || prod.precioMayorista || 0);
      if (p > 0) return p;
    } else if (customerType === "minorista") {
      const p = Number(prod.precio_minorista || prod.precioMinorista || 0);
      if (p > 0) return p;
    } else if (customerType === "consumidor final") {
      const p = Number(prod.precio_publico || prod.precioPublico || 0);
      if (p > 0) return p;
    }

    const priceOptions = [
      prod.precio_publico, prod.precioPublico,
      prod.precio_mayorista, prod.precioMayorista,
      prod.precio_minorista, prod.precioMinorista,
      prod.precio_venta, prod.precioVenta,
      prod.precio_compra, prod.precioCompra,
    ];
    return priceOptions.map(v => Number(v || 0)).find(v => v > 0) || 0;
  };

  const handleProductSelect = async (productIdStr) => {
    priceManuallySet.current = false;
    const selectedProd = products.find(p => (p.idProducto === parseInt(productIdStr) || p.id_producto === parseInt(productIdStr)));
    if (selectedProd) {
      const defaultPrice = getProductPrice(selectedProd);
      setCurrentDetail(prev => ({
        ...prev,
        id_producto: selectedProd.idProducto || selectedProd.id_producto,
        nombreProducto: selectedProd.nombre || selectedProd.referencia || "Producto G.",
        referenciaProducto: selectedProd.referencia || selectedProd.codigo || selectedProd.sku || "",
        precio_unitario: defaultPrice,
        producto: selectedProd
      }));
      setShowPriceList(false);

      try {
        const freshProd = await fetchProductById(productIdStr);
        if (freshProd && !priceManuallySet.current) {
          setCurrentDetail(prev => ({
            ...prev,
            precio_unitario: getProductPrice(freshProd),
            producto: freshProd
          }));
        }
      } catch (err) {}
    }
  };

  const handleAddDetail = () => {
    if (!currentDetail.id_producto || currentDetail.cantidad <= 0 || currentDetail.precio_unitario <= 0) return;
    const newDetalles = [...details];
    const detailToSave = {
      ...currentDetail,
      precio_unitario: parseFloat(currentDetail.precio_unitario) || 0
    };

    if (editingDetailIndex !== null) {
      newDetalles[editingDetailIndex] = detailToSave;
    } else {
      newDetalles.push(detailToSave);
    }

    setFormData(prev => ({ ...prev, detalles: newDetalles }));
    setCurrentDetail({ id_producto: "", cantidad: 1, precio_unitario: 0, descuento_porcentaje: 0, nombreProducto: "", referenciaProducto: "" });
    setEditingDetailIndex(null);
  };

  const handleRemoveDetail = (index) => {
    const updated = [...details];
    updated.splice(index, 1);
    setFormData(prev => ({ ...prev, detalles: updated }));
    if (editingDetailIndex === index) {
      setEditingDetailIndex(null);
      setCurrentDetail({ id_producto: "", cantidad: 1, precio_unitario: 0, descuento_porcentaje: 0, nombreProducto: "", referenciaProducto: "" });
    }
  };

  const handleEditDetail = (index) => {
    const d = details[index];
    if (!d) return;
    setCurrentDetail({
      id_producto: d.id_producto,
      cantidad: d.cantidad,
      precio_unitario: d.precio_unitario,
      descuento_porcentaje: d.descuento_porcentaje || 0,
      nombreProducto: d.nombreProducto || "",
      referenciaProducto: d.referenciaProducto || d.referencia || ""
    });
    setEditingDetailIndex(index);
  };

  const selectedProduct = currentDetail.id_producto
    ? products.find(p => (p.idProducto || p.id_producto) === Number(currentDetail.id_producto))
    : null;

  const stockDisponible = selectedProduct ? Number(selectedProduct.stockBuenEstado ?? selectedProduct.stock_buen_estado ?? 9999) : 9999;
  const cantidadExcedeStock = !!currentDetail.id_producto && Number(currentDetail.cantidad) > stockDisponible;

  return (
    <div className="space-y-6">
      {submitError && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl">
          <p className="text-sm font-bold">Error de solicitud</p>
          <p className="text-xs mt-1">{submitError}</p>
        </div>
      )}

      {catalogError && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400 px-4 py-3 rounded-xl text-sm">
          {catalogError}
        </div>
      )}

      {/* ─── Informacion del Cliente ─── */}
      <div className="rounded-xl border border-slate-200 dark:border-zinc-800 p-5 bg-white dark:bg-zinc-900/50 space-y-4">
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider">
          <User className="h-4 w-4 text-blue-500" />
          1. Selección y Datos del Cliente
        </h3>

        {!isEditing ? (
          <div className="flex flex-col gap-1.5 w-full">
            <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Cliente Asociado <span className="text-[#10b981]">*</span></Label>
            <Select value={formData.id_cliente?.toString() || ""} onValueChange={handleCustomerSelect}>
              <SelectTrigger className="h-[42px] border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white">
                <SelectValue placeholder={customersLoading ? "Cargando clientes..." : "Selecciona un cliente de la lista"} />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={getCustomerId(c)} value={getCustomerId(c).toString()}>
                    {getCustomerName(c)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="grid gap-x-4 gap-y-3 md:grid-cols-2 text-xs">
            <div>
              <span className="block text-slate-400 dark:text-zinc-500 font-semibold mb-1">Nombre / Razón Social</span>
              <Input value={formData.nombreCliente || ""} disabled className="h-10 bg-slate-50 dark:bg-zinc-950" />
            </div>
            <div>
              <span className="block text-slate-400 dark:text-zinc-500 font-semibold mb-1">NIT / Cédula</span>
              <Input value={formData.numeroDocumento || ""} disabled className="h-10 bg-slate-50 dark:bg-zinc-950" />
            </div>
          </div>
        )}

        {selectedCustomer && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mt-2 text-[11px]">
            <div className="rounded-lg border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 px-3 py-1.5">
              <span className="block text-slate-400 dark:text-zinc-500 font-semibold">Email</span>
              <span className="text-slate-700 dark:text-zinc-300 break-all">{selectedCustomer.email || "Sin dato"}</span>
            </div>
            <div className="rounded-lg border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 px-3 py-1.5">
              <span className="block text-slate-400 dark:text-zinc-500 font-semibold">Teléfono</span>
              <span className="text-slate-700 dark:text-zinc-300">{selectedCustomer.telefono || selectedCustomer.celular || "Sin dato"}</span>
            </div>
            <div className="rounded-lg border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 px-3 py-1.5">
              <span className="block text-slate-400 dark:text-zinc-500 font-semibold">Ciudad</span>
              <span className="text-slate-700 dark:text-zinc-300">{getCustomerCity(selectedCustomer)}</span>
            </div>
            <div className="rounded-lg border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 px-3 py-1.5">
              <span className="block text-slate-400 dark:text-zinc-500 font-semibold">Dirección</span>
              <span className="text-slate-700 dark:text-zinc-300">{getCustomerAddress(selectedCustomer)}</span>
            </div>
          </div>
        )}
      </div>

      {/* ─── Vendedor y Método de Pago ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 p-5 bg-white dark:bg-zinc-900/50 space-y-3">
          <Label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
            <BadgeCheck className="w-4 h-4 text-emerald-500" />
            2. Vendedor Asignado <span className="text-[#10b981]">*</span>
          </Label>
          <Select value={formData.id_vendedor?.toString() || ""} onValueChange={handleSellerSelect}>
            <SelectTrigger className="h-[42px] border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white">
              <SelectValue placeholder={sellersLoading ? "Cargando..." : "Selecciona un vendedor"} />
            </SelectTrigger>
            <SelectContent>
              {sellers.map((s) => (
                <SelectItem key={s.idVendedor} value={s.idVendedor.toString()}>
                  {s.nombreVendedor}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 p-5 bg-white dark:bg-zinc-900/50 space-y-3">
          <Label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
            3. Condición de Pago <span className="text-[#10b981]">*</span>
          </Label>
          <Select value={formData.tipo_pago || ""} onValueChange={(val) => setFormData(p => ({ ...p, tipo_pago: val }))}>
            <SelectTrigger className="h-[42px] border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white">
              <SelectValue placeholder="Selecciona el tipo de pago" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Efectivo">Efectivo</SelectItem>
              <SelectItem value="Transferencia">Transferencia</SelectItem>
              <SelectItem value="Tarjeta">Tarjeta de Crédito/Débito</SelectItem>
              <SelectItem value="Credito">Crédito a Plazos</SelectItem>
            </SelectContent>
          </Select>

          {formData.tipo_pago === "Credito" && formData.id_cliente && (
            <div className="mt-2 text-xs">
              {selectedCredit ? (
                (() => {
                  if (!isCreditActive) {
                    return (
                      <div className="rounded-lg border border-red-100 bg-red-50 dark:bg-red-950/20 px-3 py-2 text-red-700 dark:text-red-400 font-bold">
                        <span>⚠ El crédito de este cliente se encuentra inactivo. No se pueden procesar pedidos a crédito.</span>
                      </div>
                    );
                  }

                  const cupo = Number(selectedCredit.cupoAprobado || selectedCredit.cupo_aprobado || 0);
                  const saldo = Number(selectedCredit.saldoPendiente || selectedCredit.saldo_pendiente || selectedCredit.cupoUtilizado || selectedCredit.cupo_utilizado || 0);
                  const disponible = cupo - saldo;
                  const hasEnough = disponible >= totalPedido;
                  return (
                    <div className={`flex flex-col gap-1 rounded-lg border px-3 py-2 ${hasEnough ? 'border-emerald-100 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400' : 'border-red-100 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400'}`}>
                      <span className="font-semibold">Crédito Disponible: ${disponible.toFixed(2)}</span>
                      {!hasEnough && <span className="font-bold">⚠ Cupo insuficiente para este pedido.</span>}
                    </div>
                  );
                })()
              ) : (
                <div className="rounded-lg border border-red-100 bg-red-50 dark:bg-red-950/20 px-3 py-2 text-red-700 dark:text-red-400 font-bold">
                  <span>⚠ Este cliente no cuenta con crédito autorizado.</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── Constructor de Detalles de Productos ─── */}
      <div className="rounded-xl border border-slate-200 dark:border-zinc-800 p-5 bg-white dark:bg-zinc-900/50 space-y-4">
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider">
          <Box className="h-4 w-4 text-violet-500" />
          4. Productos del Pedido
        </h3>

        <div className="flex flex-col md:flex-row items-end gap-3 p-4 bg-slate-50 dark:bg-zinc-950/40 rounded-xl border border-slate-100 dark:border-zinc-850">
          <div className="flex-1 flex flex-col gap-1.5 w-full">
            <Label className="text-xs font-semibold text-slate-600 dark:text-zinc-400 flex justify-between">
              <span>Producto</span>
              {currentDetail.id_producto && <span className="text-[10px] text-slate-400">Disponibles: {stockDisponible}</span>}
            </Label>
            <Select value={currentDetail.id_producto?.toString() || ""} onValueChange={handleProductSelect}>
              <SelectTrigger className="h-10 bg-white dark:bg-zinc-800 text-xs border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white">
                <SelectValue placeholder={productsLoading ? "Cargando..." : "Seleccionar producto..."} />
              </SelectTrigger>
              <SelectContent>
                {products.map(p => (
                  <SelectItem key={p.idProducto || p.id_producto} value={(p.idProducto || p.id_producto).toString()}>
                    {p.nombre} (Ref: {p.referencia || "N/A"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-20 flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-slate-600 dark:text-zinc-400">Cant.</Label>
            <Input
              type="number"
              min="1"
              value={currentDetail.cantidad}
              onChange={(e) => setCurrentDetail(p => ({ ...p, cantidad: parseInt(e.target.value) || 1 }))}
              className={`h-10 text-center ${cantidadExcedeStock ? "border-red-500 focus-visible:ring-red-500" : ""}`}
            />
          </div>

          <div className="w-full md:w-28 flex flex-col gap-1.5 relative">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-semibold text-slate-600 dark:text-zinc-400">Precio Unit.</Label>
              {currentDetail.producto && (
                <button type="button" onClick={() => setShowPriceList(!showPriceList)} className="text-slate-400 hover:text-slate-600">
                  <Info size={14} />
                </button>
              )}
            </div>
            {showPriceList && currentDetail.producto && (
              <PreciosVigentesPopover
                precios={currentDetail.producto}
                onSelectPrice={(val) => {
                  setCurrentDetail(p => ({ ...p, precio_unitario: val }));
                  setShowPriceList(false);
                }}
                onClose={() => setShowPriceList(false)}
              />
            )}
            <Input
              type="number"
              value={currentDetail.precio_unitario}
              onChange={(e) => {
                priceManuallySet.current = true;
                setCurrentDetail(p => ({ ...p, precio_unitario: parseFloat(e.target.value) || 0 }));
              }}
              className="h-10 text-right"
            />
          </div>

          <div className="w-full md:w-20 flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-slate-600 dark:text-zinc-400">Desc. %</Label>
            <Input
              type="number"
              min="0"
              max="100"
              value={currentDetail.descuento_porcentaje}
              onChange={(e) => setCurrentDetail(p => ({ ...p, descuento_porcentaje: Math.min(Math.max(parseInt(e.target.value) || 0, 0), 100) }))}
              className="h-10 text-right"
            />
          </div>

          <button
            type="button"
            onClick={handleAddDetail}
            disabled={!currentDetail.id_producto || cantidadExcedeStock}
            className="h-10 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white font-bold rounded-xl transition flex items-center justify-center gap-1 w-full md:w-auto"
          >
            <Plus size={16} />
            {editingDetailIndex !== null ? "Editar" : "Agregar"}
          </button>
        </div>

        {/* Tabla de Productos Incluidos */}
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-zinc-800">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-zinc-950/80 text-slate-700 dark:text-zinc-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-zinc-800">
              <tr>
                <th className="p-3">Ref</th>
                <th className="p-3">Descripción</th>
                <th className="p-3 text-center">Cantidad</th>
                <th className="p-3 text-right">Precio Unit.</th>
                <th className="p-3 text-right">Subtotal</th>
                <th className="p-3 text-right">Desc. %</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
              {details.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 dark:text-zinc-500 italic">No hay productos agregados a la lista.</td>
                </tr>
              ) : (
                details.map((d, index) => {
                  const qty = Number(d.cantidad || 0);
                  const price = Number(d.precio_unitario || 0);
                  const baseSub = qty * price;
                  const discountPct = Number(d.descuento_porcentaje || 0);
                  const baseTotal = baseSub - (baseSub * discountPct / 100);

                  return (
                    <tr key={index} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="p-3 font-mono text-slate-500 dark:text-zinc-400">{d.referenciaProducto || d.codigo || "—"}</td>
                      <td className="p-3 font-medium text-slate-800 dark:text-zinc-200">{d.nombreProducto}</td>
                      <td className="p-3 text-center font-semibold text-slate-700 dark:text-zinc-300">{qty}</td>
                      <td className="p-3 text-right text-slate-700 dark:text-zinc-300">${price.toFixed(2)}</td>
                      <td className="p-3 text-right text-slate-700 dark:text-zinc-300">${baseSub.toFixed(2)}</td>
                      <td className="p-3 text-right text-amber-600 dark:text-amber-400 font-semibold">{discountPct}%</td>
                      <td className="p-3 text-right font-bold text-emerald-600 dark:text-emerald-400">${baseTotal.toFixed(2)}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button type="button" onClick={() => handleEditDetail(index)} className="p-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-md transition-colors"><Pencil size={13} /></button>
                          <button type="button" onClick={() => handleRemoveDetail(index)} className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Sección de Totales */}
        {details.length > 0 && (
          <div className="flex flex-col items-end gap-1.5 pt-3 text-xs border-t border-slate-200 dark:border-zinc-800">
            <div className="flex justify-between w-64 text-slate-500 dark:text-zinc-400">
              <span>Subtotal Bruto:</span>
              <span className="font-semibold text-slate-700 dark:text-zinc-300">${totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between w-64 text-amber-600 dark:text-amber-400">
              <span>Descuentos Aplicados:</span>
              <span className="font-semibold">-${totals.discount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between w-64 text-slate-500 dark:text-zinc-400">
              <span>Subtotal Neto:</span>
              <span className="font-semibold text-slate-700 dark:text-zinc-300">${totals.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between w-64 text-slate-500 dark:text-zinc-400">
              <span>Impuestos (IVA 19%):</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">${iva.toFixed(2)}</span>
            </div>
            <div className="flex justify-between w-72 text-sm font-bold text-slate-800 dark:text-zinc-100 border-t border-slate-200 dark:border-zinc-700 pt-2 mt-1">
              <span className="uppercase tracking-wide">Total Pedido:</span>
              <span className="text-emerald-600 dark:text-emerald-400 text-base">${totalPedido.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Notas del pedido */}
      <div className="rounded-xl border border-slate-200 dark:border-zinc-800 p-5 bg-white dark:bg-zinc-900/50 space-y-3">
        <Label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-slate-400" />
          Notas u Observaciones del Pedido
        </Label>
        <Textarea
          placeholder="Añade comentarios o indicaciones especiales para el despacho..."
          value={formData.notas || ""}
          onChange={(e) => setFormData(p => ({ ...p, notas: e.target.value }))}
          className="min-h-[80px] resize-none rounded-xl"
        />
      </div>
    </div>
  );
}
