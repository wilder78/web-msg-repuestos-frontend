import React, { useState, useEffect } from "react";
import { BaseFormModal } from "../../../components/shared/BaseFormModal";
import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import { ShoppingCart, Plus, Trash2, Hash, Calendar, FileText, User, BadgeCheck, Pencil, Check, Info } from "lucide-react";
import { useProducts } from "../../../hooks/useProducts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Textarea } from "../../../components/ui/textarea";

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

export default function PedidoCreateModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSubmit,
  loading,
  onSaveSuccess,
  onSelectChange,
  submitError // Nuevo prop
}) {
  const [saveSuccess, setSaveSuccess] = useState(false);
  const { products, loading: productsLoading } = useProducts();
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [sellers, setSellers] = useState([]);
  const [sellersLoading, setSellersLoading] = useState(true);
  const [credits, setCredits] = useState([]);
  const [catalogError, setCatalogError] = useState("");

  // Detalle actual en construccion
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

  useEffect(() => {
    if (isOpen) {
      setSaveSuccess(false);
      fetchCatalogs();
    } else {
      setCurrentDetail({ id_producto: "", cantidad: 1, precio_unitario: 0, descuento_porcentaje: 0, nombreProducto: "", referenciaProducto: "" });
      setEditingDetailIndex(null);
      setShowPriceList(false);
    }
  }, [isOpen]);

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

      if (customerResult.status === "rejected" && userResult.status === "rejected") {
        throw customerResult.reason || userResult.reason;
      }
      
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

  const getCustomerId = (customer) => customer.idCliente || customer.id_cliente || customer.id;
  const getUserId = (user) => user.idUsuario || user.id_usuario || user.id;

  const getCustomerName = (customer) =>
    customer.razonSocial ||
    customer.clienteNombre ||
    customer.nombreCliente ||
    customer.nombre ||
    customer.numeroDocumento ||
    `Cliente ID: ${getCustomerId(customer)}`;

  const getCustomerAddress = (customer) =>
    customer.direccion ||
    customer.address ||
    "Sin dato";

  const getCustomerCity = (customer) =>
    customer.municipio?.nombre ||
    customer.municipio?.name ||
    customer.ciudad ||
    customer.city ||
    customer.nombreMunicipio ||
    customer.municipioNombre ||
    "Sin dato";

  const getUserName = (user) =>
    user.nombreUsuario ||
    user.nombre ||
    user.name ||
    user.email ||
    `Vendedor ID: ${getUserId(user)}`;

  const getRoleName = (role) => role.nombreRol || role.nombre_rol || role.nombre || "";
  const getRoleId = (role) => role.idRol || role.id_rol || role.id;
  const getUserRoleId = (user) => user.id_rol || user.idRol || user.id_rol_usuario || user.rol?.idRol || user.rol?.id_rol;

  const selectedCustomer = customers.find((customer) => getCustomerId(customer)?.toString() === formData.id_cliente?.toString());
  const selectedSeller = sellers.find((seller) => seller.idVendedor?.toString() === formData.id_vendedor?.toString());
  const selectedCredit = credits.find(c => (c.idCliente || c.id_cliente || c.id)?.toString() === formData.id_cliente?.toString());

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

  const handleCreateSubmit = async () => {
    // Si no hay detalles, no dejar pasar
    if (!formData.id_cliente || !formData.id_vendedor || !formData.detalles || formData.detalles.length === 0) return;
    const result = await onSubmit();
    if (result) {
      setSaveSuccess(true);
      setTimeout(() => {
        onSaveSuccess(typeof result === "boolean" ? "Nuevo" : result); 
        onClose();
        setSaveSuccess(false);
      }, 1500);
    }
  };

  const handleAddDetail = () => {
    if (!currentDetail.id_producto || currentDetail.cantidad <= 0 || currentDetail.precio_unitario <= 0) return;
    
    const newDetalles = [...(formData.detalles || [])];

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
    
    // Reset current
    setCurrentDetail({
      id_producto: "",
      cantidad: 1,
      precio_unitario: 0,
      descuento_porcentaje: 0,
      nombreProducto: "",
      referenciaProducto: ""
    });
    setEditingDetailIndex(null);
  };

  const handleRemoveDetail = (index) => {
    const updated = [...(formData.detalles || [])];
    updated.splice(index, 1);
    setFormData(prev => ({ ...prev, detalles: updated }));

    if (editingDetailIndex === index) {
      setEditingDetailIndex(null);
      setCurrentDetail({ id_producto: "", cantidad: 1, precio_unitario: 0, descuento_porcentaje: 0, nombreProducto: "", referenciaProducto: "" });
    } else if (editingDetailIndex > index) {
      setEditingDetailIndex(editingDetailIndex - 1);
    }
  };

  const handleEditDetail = (index) => {
    const detail = formData.detalles?.[index];
    if (!detail) return;

    setCurrentDetail({
      id_producto: detail.id_producto,
      cantidad: detail.cantidad,
      precio_unitario: detail.precio_unitario,
      descuento_porcentaje: detail.descuento_porcentaje || 0,
      nombreProducto: detail.nombreProducto || "",
      referenciaProducto: detail.referenciaProducto || detail.referencia || ""
    });
    setEditingDetailIndex(index);
  };

  const getProductPrice = (product) => {
    const customerType = (selectedCustomer?.tipo_cliente || selectedCustomer?.tipoCliente || "").toString().toLowerCase().trim();

    if (customerType === "mayorista") {
      const p = Number(product.precio_mayorista || product.precioMayorista || 0);
      if (p > 0) return p;
    } else if (customerType === "minorista") {
      const p = Number(product.precio_minorista || product.precioMinorista || 0);
      if (p > 0) return p;
    } else if (customerType === "consumidor final") {
      const p = Number(product.precio_publico || product.precioPublico || 0);
      if (p > 0) return p;
    }

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

  const onProductSelect = (idProductoStr) => {
    const selectedProd = products.find(p => (p.idProducto === parseInt(idProductoStr) || p.id_producto === parseInt(idProductoStr)));
    if (selectedProd) {
      setCurrentDetail(prev => ({
        ...prev,
        id_producto: selectedProd.idProducto || selectedProd.id_producto,
        nombreProducto: selectedProd.nombre || selectedProd.referencia || "Producto G.",
        referenciaProducto: selectedProd.referencia || selectedProd.codigo || selectedProd.sku || "",
        precio_unitario: getProductPrice(selectedProd)
      }));
      setShowPriceList(false);
    }
  };

  const getDetailSubtotal = (detail) => {
    const base = Number(detail.cantidad || 0) * Number(detail.precio_unitario || 0);
    const discount = Math.min(Math.max(Number(detail.descuento_porcentaje || 0), 0), 100);
    return base - (base * discount / 100);
  };

  // ── Stock validation ────────────────────────────────────────────────
  const selectedProduct = currentDetail.id_producto
    ? products.find(
        (p) =>
          (p.idProducto || p.id_producto) ===
          (typeof currentDetail.id_producto === "string"
            ? parseInt(currentDetail.id_producto, 10)
            : currentDetail.id_producto)
      )
    : null;

  const stockDisponible = selectedProduct
    ? Number(
        selectedProduct.stockBuenEstado ??
        selectedProduct.stock_buen_estado ??
        selectedProduct.stock ??
        9999
      )
    : 9999;

  const cantidadExcedeStock =
    !!currentDetail.id_producto &&
    Number(currentDetail.cantidad) > stockDisponible;
  // ─────────────────────────────────────────────────────────────────────

  const getDetailDiscount = (detail) => {
    const base = Number(detail.cantidad || 0) * Number(detail.precio_unitario || 0);
    const discount = Math.min(Math.max(Number(detail.descuento_porcentaje || 0), 0), 100);
    return base * discount / 100;
  };

  const subtotalBruto = (formData.detalles || []).reduce(
    (acc, current) => acc + (Number(current.cantidad || 0) * Number(current.precio_unitario || 0)),
    0
  );
  const descuentosProductos = (formData.detalles || []).reduce((acc, current) => acc + getDetailDiscount(current), 0);
  const descuentos = descuentosProductos;
  const subtotalNeto = subtotalBruto - descuentosProductos;
  const impuestos = subtotalNeto * 0.19;
  const totalPedido = subtotalNeto + impuestos;

  return (
    <BaseFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Nuevo Pedido"
      subtitle="Requerimientos Obligatorios: Cliente registrado y Lista de Productos"
      icon={ShoppingCart}
      loading={loading}
      saveSuccess={saveSuccess}
      maxWidthClass="sm:max-w-[92vw] lg:max-w-[980px] xl:max-w-[1120px]"
      onSubmit={handleCreateSubmit}
      isSubmitDisabled={
        !formData.id_cliente ||
        !formData.id_vendedor ||
        !formData.tipo_pago ||
        !formData.detalles || 
        formData.detalles.length === 0 ||
        (formData.tipo_pago === "Credito" && (!selectedCredit || (Number(selectedCredit.cupoAprobado || selectedCredit.cupo_aprobado || 0) - Number(selectedCredit.saldoPendiente || selectedCredit.saldo_pendiente || 0) < totalPedido)))
      }
    >
        <div className="space-y-6">
          {/* Header Info - Generado automaticamente */}
          <div className="flex gap-4 p-4 bg-slate-50 dark:bg-zinc-950/40 rounded-xl border border-slate-100 dark:border-zinc-800">
            <div className="flex-1">
              <Label className="text-xs font-semibold text-slate-500 dark:text-zinc-400 mb-1 flex items-center gap-1">
                 <Hash className="w-3 h-3 text-slate-400 dark:text-zinc-500"/> Identificador Único
              </Label>
              <p className="text-sm font-bold text-slate-800 dark:text-zinc-200">Generado Automáticamente</p>
            </div>
            <div className="flex-1">
              <Label className="text-xs font-semibold text-slate-500 dark:text-zinc-400 mb-1 flex items-center gap-1">
                 <Calendar className="w-3 h-3 text-slate-400 dark:text-zinc-500"/> Fecha y Hora
              </Label>
              <p className="text-sm font-bold text-slate-800 dark:text-zinc-200">Se registrará automáticamente</p>
            </div>
          </div>

          {/* MENSAJE DE ERROR INLINE */}
          {submitError && (
             <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl flex items-start gap-3">
               <span className="text-red-500 mt-0.5">!</span>
               <div className="flex-1">
                 <p className="text-sm font-bold">Error al procesar la solicitud en el Backend</p>
                 <p className="text-xs mt-1">{submitError}</p>
                 <p className="text-[10px] opacity-70 mt-2 font-mono">Consejo: Abre la consola de tu navegador (F12) para ver la respuesta completa de red.</p>
               </div>
             </div>
          )}

          {catalogError && (
             <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400 px-4 py-3 rounded-xl text-sm">
               {catalogError}
             </div>
          )}

          {/* Formulario Cliente y Pago */}
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <div className="flex flex-col gap-1.5 col-span-2">
              <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Cliente Asociado <span className="text-[#10b981]">*</span>
              </Label>
              <Select 
                value={formData.id_cliente?.toString() || ""} 
                onValueChange={handleCustomerSelect}
              >
                <SelectTrigger className="h-[42px] border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white">
                  <SelectValue placeholder={customersLoading ? "Cargando clientes..." : "Selecciona un cliente de la lista"} />
                </SelectTrigger>
                <SelectContent>
                  {!customersLoading && customers.length === 0 && (
                    <SelectItem value="__no_customers__" disabled>
                      No hay clientes disponibles
                    </SelectItem>
                  )}
                  {customers
                    .filter((c) => getCustomerId(c))
                    .map((c) => (
                      <SelectItem key={getCustomerId(c)} value={getCustomerId(c).toString()}>
                        {getCustomerName(c)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {selectedCustomer && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2 mt-2 text-xs">
                  <div className="rounded-lg border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/40 px-3 py-2">
                    <span className="block text-slate-400 dark:text-zinc-500 font-semibold">Documento</span>
                    <span className="text-slate-700 dark:text-zinc-300">{selectedCustomer.numeroDocumento || selectedCustomer.documento || "Sin dato"}</span>
                  </div>
                  <div className="rounded-lg border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/40 px-3 py-2">
                    <span className="block text-slate-400 dark:text-zinc-500 font-semibold">Email</span>
                    <span className="text-slate-700 dark:text-zinc-300 break-all">{selectedCustomer.email || "Sin dato"}</span>
                  </div>
                  <div className="rounded-lg border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/40 px-3 py-2">
                    <span className="block text-slate-400 dark:text-zinc-500 font-semibold">Telefono</span>
                    <span className="text-slate-700 dark:text-zinc-300">{selectedCustomer.telefono || selectedCustomer.celular || "Sin dato"}</span>
                  </div>
                  <div className="rounded-lg border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/40 px-3 py-2">
                    <span className="block text-slate-400 dark:text-zinc-500 font-semibold">Ciudad</span>
                    <span className="text-slate-700 dark:text-zinc-300">{getCustomerCity(selectedCustomer)}</span>
                  </div>
                  <div className="rounded-lg border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/40 px-3 py-2 md:col-span-2 lg:col-span-1">
                    <span className="block text-slate-400 dark:text-zinc-500 font-semibold">Direccion</span>
                    <span className="text-slate-700 dark:text-zinc-300 break-words">{getCustomerAddress(selectedCustomer)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5 col-span-2 md:col-span-1">
              <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Vendedor <span className="text-[#10b981]">*</span>
              </Label>
              <Select
                value={formData.id_vendedor?.toString() || ""}
                onValueChange={handleSellerSelect}
              >
                <SelectTrigger className="h-[42px] border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white">
                  <SelectValue placeholder={sellersLoading ? "Cargando vendedores..." : "Selecciona un vendedor registrado"} />
                </SelectTrigger>
                <SelectContent>
                  {!sellersLoading && sellers.length === 0 && (
                    <SelectItem value="__no_sellers__" disabled>
                      No hay vendedores disponibles
                    </SelectItem>
                  )}
                  {sellers
                    .filter((seller) => seller.idVendedor)
                    .map((seller) => (
                      <SelectItem key={seller.idVendedor} value={seller.idVendedor.toString()}>
                        {seller.nombreVendedor} {seller.tipoVendedor ? `(${seller.tipoVendedor})` : ""}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {!sellersLoading && sellers.length === 0 && (
                <p className="text-xs text-amber-600">No hay usuarios o empleados activos con cargo de ventas.</p>
              )}
              {selectedSeller && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  <span>Vendedor asignado: {selectedSeller.nombreVendedor}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Tipo de Pago <span className="text-[#10b981]">*</span>
              </Label>
              <Select 
                value={formData.tipo_pago || ""} 
                onValueChange={(val) => onSelectChange("tipo_pago", val)}
              >
                <SelectTrigger className="h-[42px] border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white">
                  <SelectValue placeholder="Selecciona" />
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
                      const cupo = Number(selectedCredit.cupoAprobado || selectedCredit.cupo_aprobado || 0);
                      const saldo = Number(selectedCredit.saldoPendiente || selectedCredit.saldo_pendiente || 0);
                      const disponible = cupo - saldo;
                      const hasEnough = disponible >= totalPedido;
                      return (
                        <div className={`flex flex-col gap-1 rounded-lg border px-3 py-2 ${hasEnough ? 'border-emerald-100 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400' : 'border-red-100 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400'}`}>
                          <span className="font-semibold flex items-center gap-1">
                            <BadgeCheck className="w-3.5 h-3.5"/> Crédito Autorizado
                          </span>
                          <span className="flex justify-between w-full">
                            <span>Cupo: ${cupo.toFixed(2)}</span>
                            <span>Disponible: <strong className={hasEnough ? 'text-emerald-800 dark:text-emerald-300' : 'text-red-800 dark:text-red-300'}>${disponible.toFixed(2)}</strong></span>
                          </span>
                          {!hasEnough && (
                            <span className="font-bold mt-1 border-t border-red-200 dark:border-red-900/40 pt-1">
                              ⚠ El total del pedido supera el cupo disponible.
                            </span>
                          )}
                        </div>
                      );
                    })()
                  ) : (
                    <div className="flex flex-col gap-1 rounded-lg border border-red-100 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 px-3 py-2 text-red-700 dark:text-red-400">
                      <span className="font-semibold flex items-center gap-1">⚠ Sin Crédito</span>
                      <span>Este cliente no tiene un crédito asignado en el sistema.</span>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

          <div className="border-t border-slate-100 dark:border-zinc-800 my-4" />

          {/* Lista de Productos */}
          <div>
             <Label className="text-sm font-bold text-slate-800 dark:text-zinc-200 mb-3 block">
                Lista de Productos Incluidos <span className="text-[#10b981]">*</span>
             </Label>
             
             {/* Agregar Producto Builder */}
             <div className="flex items-end gap-3 mb-4 p-4 bg-slate-50 dark:bg-zinc-950/40 border border-slate-100 dark:border-zinc-800 rounded-xl">
                <div className="flex-1 flex flex-col gap-1.5">
                   <Label className="text-xs font-semibold text-slate-600 dark:text-zinc-400 flex items-center justify-between">
                     <span>Catálogo de Productos</span>
                     {currentDetail.id_producto && (
                       <span
                         className={`font-semibold text-[10px] px-1.5 py-0.5 rounded-md transition-colors ${
                           cantidadExcedeStock
                             ? "bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400"
                             : "bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-555"
                         }`}
                       >
                         {cantidadExcedeStock ? `⚠ Supera stock` : `Disponibles: ${stockDisponible}`}
                       </span>
                     )}
                   </Label>
                   <Select 
                      value={currentDetail.id_producto?.toString()} 
                      onValueChange={onProductSelect}
                   >
                     <SelectTrigger className="h-9 bg-white dark:bg-zinc-800 text-xs border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white">
                       <SelectValue placeholder={productsLoading ? "Cargando..." : "Buscar producto..."} />
                     </SelectTrigger>
                     <SelectContent>
                        {products.map(p => {
                           const cleanName = p.nombre?.replace(/\s*\(.*?\)/g, '')?.replace(/\s*\[.*?\]/g, '')?.trim() || "Producto";
                           const ref = p.referencia || p.codigo;
                           const stock = p.stockBuenEstado ?? p.stock_buen_estado ?? 0;
                           return (
                             <SelectItem key={p.idProducto || p.id_producto} value={(p.idProducto || p.id_producto).toString()}>
                                <div className="flex items-center justify-between w-full gap-4">
                                   <span className="font-medium truncate text-slate-800">{cleanName}</span>
                                   <div className="flex items-center gap-1.5 shrink-0">
                                      {ref && (
                                         <span className="bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 text-[10px] px-1.5 py-0.5 rounded border border-slate-200 dark:border-zinc-700">
                                            Ref: {ref}
                                         </span>
                                      )}
                                      <span className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-[10px] px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-900/50">
                                         Disp: {stock}
                                      </span>
                                   </div>
                                </div>
                             </SelectItem>
                           );
                        })}
                     </SelectContent>
                   </Select>
                </div>
                
                <div className="w-20 flex flex-col gap-1.5 relative">
                   <Label className="text-xs font-semibold text-slate-600 dark:text-zinc-400">Cant.</Label>
                   <Input 
                      type="number" min="1" step="1"
                      value={currentDetail.cantidad} 
                      onChange={(e) => {
                         const val = e.target.value.replace(/[^0-9]/g, '');
                         setCurrentDetail(prev => ({...prev, cantidad: val ? parseInt(val, 10) : ''}))
                      }}
                      onKeyDown={(e) => {
                         if (['.', ',', '-', 'e', 'E'].includes(e.key)) e.preventDefault();
                      }}
                      onBlur={(e) => {
                         if (!currentDetail.cantidad || currentDetail.cantidad < 1) {
                            setCurrentDetail(prev => ({...prev, cantidad: 1}));
                          }
                      }}
                      className={`h-9 text-center bg-white dark:bg-zinc-800 text-slate-900 dark:text-white border-slate-200 dark:border-zinc-700 transition-all ${
                        cantidadExcedeStock
                          ? "border-2 border-red-400 dark:border-red-500 focus-visible:ring-red-300 text-red-700 dark:text-red-400"
                          : ""
                      }`}
                   />
                    {cantidadExcedeStock && (
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
                        <div className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap shadow-lg">
                          Máx: {stockDisponible}
                          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-red-600" />
                        </div>
                      </div>
                    )}
                </div>

                <div className="w-28 flex flex-col gap-1.5 relative">
                    <div className="flex items-center justify-between">
                       <Label className="text-xs font-semibold text-slate-600 dark:text-zinc-400">Precio Unit.</Label>
                       {selectedProduct && (
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
                                <>
                                   <div
                                      className="fixed inset-0 z-40"
                                      onClick={() => setShowPriceList(false)}
                                   />
                                   <div className="absolute right-0 top-6 z-50 w-52 p-3 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-slate-100 dark:border-zinc-800 text-xs text-slate-700 dark:text-zinc-300 animate-in fade-in slide-in-from-top-1 duration-150">
                                      <div className="font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-zinc-800 pb-1 mb-2 flex items-center justify-between">
                                         <span>Precios Vigentes</span>
                                         <span className="text-[9px] text-[#10b981] dark:text-[#34d399] font-normal uppercase">Aplicar</span>
                                      </div>
                                      <div className="space-y-1.5">
                                         <button
                                            type="button"
                                            onClick={() => {
                                               const val = Number(selectedProduct.precioPublico ?? selectedProduct.precio_publico ?? 0);
                                               setCurrentDetail(prev => ({ ...prev, precio_unitario: val }));
                                               setShowPriceList(false);
                                            }}
                                            className="w-full text-left px-1.5 py-1 rounded hover:bg-slate-50 dark:hover:bg-zinc-800 flex justify-between items-center transition-colors group"
                                         >
                                            <span className="font-medium text-slate-400 dark:text-zinc-550 group-hover:text-[#10b981] dark:group-hover:text-[#34d399]">Al Detal / Público:</span>
                                            <span className="font-semibold text-slate-700 dark:text-zinc-300 group-hover:text-[#10b981] dark:group-hover:text-[#34d399]">
                                               ${Number(selectedProduct.precioPublico ?? selectedProduct.precio_publico ?? 0).toFixed(2)}
                                            </span>
                                         </button>
                                         <button
                                            type="button"
                                            onClick={() => {
                                               const val = Number(selectedProduct.precioMinorista ?? selectedProduct.precio_minorista ?? 0);
                                               setCurrentDetail(prev => ({ ...prev, precio_unitario: val }));
                                               setShowPriceList(false);
                                            }}
                                            className="w-full text-left px-1.5 py-1 rounded hover:bg-slate-50 dark:hover:bg-zinc-800 flex justify-between items-center transition-colors group"
                                         >
                                            <span className="font-medium text-slate-400 dark:text-zinc-555 group-hover:text-[#10b981] dark:group-hover:text-[#34d399]">Minorista:</span>
                                            <span className="font-semibold text-slate-700 dark:text-zinc-300 group-hover:text-[#10b981] dark:group-hover:text-[#34d399]">
                                               ${Number(selectedProduct.precioMinorista ?? selectedProduct.precio_minorista ?? 0).toFixed(2)}
                                            </span>
                                         </button>
                                         <button
                                            type="button"
                                            onClick={() => {
                                               const val = Number(selectedProduct.precioMayorista ?? selectedProduct.precio_mayorista ?? 0);
                                               setCurrentDetail(prev => ({ ...prev, precio_unitario: val }));
                                               setShowPriceList(false);
                                            }}
                                            className="w-full text-left px-1.5 py-1 rounded hover:bg-slate-50 dark:hover:bg-zinc-800 flex justify-between items-center transition-colors group"
                                         >
                                            <span className="font-medium text-slate-400 dark:text-zinc-555 group-hover:text-[#10b981] dark:group-hover:text-[#34d399]">Mayorista:</span>
                                            <span className="font-semibold text-slate-700 dark:text-zinc-300 group-hover:text-[#10b981] dark:group-hover:text-[#34d399]">
                                               ${Number(selectedProduct.precioMayorista ?? selectedProduct.precio_mayorista ?? 0).toFixed(2)}
                                            </span>
                                         </button>
                                      </div>
                                   </div>
                                </>
                             )}
                          </div>
                       )}
                    </div>
                    <Input 
                       type="number" step="0.01" min="0" 
                       value={currentDetail.precio_unitario} 
                       onChange={(e) => setCurrentDetail(prev => ({...prev, precio_unitario: e.target.value}))}
                       className="h-9 text-right bg-white dark:bg-zinc-800 text-slate-900 dark:text-white border-slate-200 dark:border-zinc-700"
                    />
                 </div>

                <div className="w-24 flex flex-col gap-1.5">
                   <Label className="text-xs font-semibold text-slate-600 dark:text-zinc-400">Desc. %</Label>
                   <Input 
                      type="number" step="1" min="0" max="100"
                      value={currentDetail.descuento_porcentaje} 
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        const parsed = val ? parseInt(val, 10) : 0;
                        const value = Math.min(Math.max(parsed, 0), 100);
                        setCurrentDetail(prev => ({...prev, descuento_porcentaje: value}));
                      }}
                      onKeyDown={(e) => {
                        if (['.', ',', '-', 'e', 'E'].includes(e.key)) e.preventDefault();
                      }}
                      className="h-9 text-right bg-white dark:bg-zinc-800 text-slate-900 dark:text-white border-slate-200 dark:border-zinc-700"
                   />
                </div>
                
                <button 
                  type="button"
                  onClick={handleAddDetail}
                  disabled={!currentDetail.id_producto || currentDetail.precio_unitario <= 0 || cantidadExcedeStock}
                  className="h-9 px-3 bg-[#10b981] hover:bg-emerald-600 text-white rounded-lg disabled:opacity-50 flex items-center justify-center transition-colors"
                  title={
                    cantidadExcedeStock
                      ? `Cantidad supera el stock disponible (${stockDisponible})`
                      : editingDetailIndex !== null
                      ? "Guardar cambios del producto"
                      : "Agregar producto"
                  }
                >
                   {editingDetailIndex !== null ? <Check size={16} /> : <Plus size={16} />}
                </button>
             </div>

             {/* Tabla de Productos Agregados */}
             <div className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-zinc-800/40 text-slate-600 dark:text-zinc-200 text-xs uppercase border-b border-slate-200 dark:border-zinc-800">
                     <tr>
                        <th className="px-4 py-2">Producto</th>
                        <th className="px-4 py-2 text-center">Cant.</th>
                        <th className="px-4 py-2 text-right">Vr. Unit</th>
                        <th className="px-4 py-2 text-center">Desc.</th>
                        <th className="px-4 py-2 text-right">Subtotal</th>
                        <th className="px-4 py-2 text-center w-20"></th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                     {(!formData.detalles || formData.detalles.length === 0) && (
                        <tr><td colSpan="6" className="px-4 py-6 text-center text-slate-400 dark:text-zinc-500 italic bg-white dark:bg-zinc-900">No hay productos agregados al pedido</td></tr>
                     )}
                     {(formData.detalles || []).map((det, idx) => (
                        <tr key={idx} className={`border-b last:border-0 border-slate-100 dark:border-zinc-800 hover:bg-slate-50/50 dark:hover:bg-zinc-800/35 ${editingDetailIndex === idx ? "bg-emerald-50/60 dark:bg-emerald-950/20" : ""}`}>
                           <td className="px-4 py-2.5">
                              <div className="font-medium text-slate-700 dark:text-zinc-200">{det.nombreProducto}</div>
                              {(det.referenciaProducto || det.referencia) && (
                                <div className="text-[11px] text-slate-400 dark:text-zinc-500 font-semibold uppercase tracking-wide">
                                  Ref: {det.referenciaProducto || det.referencia}
                                </div>
                              )}
                           </td>
                           <td className="px-4 py-2.5 text-center text-slate-700 dark:text-zinc-300">{det.cantidad}</td>
                           <td className="px-4 py-2.5 text-right font-medium text-slate-900 dark:text-zinc-100">${parseFloat(det.precio_unitario).toFixed(2)}</td>
                           <td className="px-4 py-2.5 text-center text-slate-700 dark:text-zinc-300">{parseFloat(det.descuento_porcentaje || 0).toFixed(2)}%</td>
                           <td className="px-4 py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">${(Number(det.cantidad || 0) * Number(det.precio_unitario || 0)).toFixed(2)}</td>
                           <td className="px-4 py-2.5 text-center">
                              <button type="button" onClick={() => handleEditDetail(idx)} className="text-blue-400 hover:text-blue-600 dark:text-blue-500 dark:hover:text-blue-400 p-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-950/30" title="Editar producto">
                                 <Pencil size={14} />
                              </button>
                              <button type="button" onClick={() => handleRemoveDetail(idx)} className="text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30" title="Eliminar producto">
                                 <Trash2 size={14} />
                              </button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
                  {(formData.detalles?.length > 0) && (
                     <tfoot className="bg-slate-50 dark:bg-zinc-950/65 border-t border-slate-200 dark:border-zinc-800">
                        <tr>
                           <td colSpan="4" className="px-4 py-2 text-right font-medium text-slate-500 dark:text-zinc-400">Subtotal (Sin descuento):</td>
                           <td className="px-4 py-2 text-right font-medium text-slate-700 dark:text-zinc-300">${subtotalBruto.toFixed(2)}</td>
                           <td></td>
                        </tr>
                        <tr>
                           <td colSpan="4" className="px-4 py-2 text-right font-medium text-slate-500 dark:text-zinc-400">Total Descuentos (-):</td>
                           <td className="px-4 py-2 text-right font-medium text-blue-600 dark:text-blue-400">-${descuentos.toFixed(2)}</td>
                           <td></td>
                        </tr>
                        <tr>
                           <td colSpan="4" className="px-4 py-2 text-right font-medium text-slate-500 dark:text-zinc-400">Subtotal Neto:</td>
                           <td className="px-4 py-2 text-right font-medium text-slate-700 dark:text-zinc-300">${subtotalNeto.toFixed(2)}</td>
                           <td></td>
                        </tr>
                        <tr>
                           <td colSpan="4" className="px-4 py-2 text-right font-medium text-slate-500 dark:text-zinc-400">IVA (19%):</td>
                           <td className="px-4 py-2 text-right font-medium text-amber-600 dark:text-amber-400">${impuestos.toFixed(2)}</td>
                           <td></td>
                        </tr>
                        <tr className="border-t border-slate-200 dark:border-zinc-800 bg-emerald-50/50 dark:bg-emerald-950/10">
                           <td colSpan="4" className="px-4 py-3 text-right font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-widest text-xs">TOTAL A PAGAR:</td>
                           <td className="px-4 py-3 text-right font-bold text-xl text-emerald-700 dark:text-emerald-400">${totalPedido.toFixed(2)}</td>
                           <td></td>
                        </tr>
                     </tfoot>
                  )}
                </table>
             </div>
          </div>

          <div className="border-t border-slate-100 dark:border-zinc-800 my-2" />

          {/* Campos Opcionales */}
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
             <div className="flex flex-col gap-1.5 col-span-2">
                <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                   <FileText className="w-3.5 h-3.5 text-slate-400" /> Notas o Comentarios <span className="font-normal text-slate-400 dark:text-zinc-500 font-mono text-[10px]">(Opcional)</span>
                </Label>
                <Textarea 
                   name="notas"
                   value={formData.notas || ""}
                   onChange={(e) => onSelectChange("notas", e.target.value)}
                   placeholder="Escribe alguna indicación especial para el despacho o facturación..."
                   className="resize-none h-[60px] rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus-visible:ring-[#10b981] focus:border-[#10b981]"
                />
             </div>
          </div>
        </div>
    </BaseFormModal>
  );
}
