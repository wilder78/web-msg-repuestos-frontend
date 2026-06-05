import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Trash2, Plus, Minus, PackageOpen, ArrowLeft, CheckCircle2, Tag } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "../../contexts/CartContext";
import Navbar from "../../components/Navbar/PublicNavbar";
import Footer from "../../components/Footer/Footer";
import WhatsAppButton from "../../components/shared/WhatsAppButton";
import { authFetch } from "../../lib/auth-utils";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

const EMPTY_CUSTOMER_FORM = {
  id_tipo_documento: "",
  numero_documento: "",
  razon_social: "",
  direccion: "",
  telefono: "",
  email: "",
  id_departamento: "",
  municipio_id: "",
};

const parseCartPrice = (price) =>
  parseFloat(String(price).replace(/[^0-9.]/g, "")) || 0;

const extractList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  for (const key of ["data", "customers", "clientes", "content", "rows", "items", "results"]) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") {
      const nested = extractList(value);
      if (nested.length > 0) return nested;
    }
  }

  return [];
};

const unwrapEntity = (payload) =>
  payload?.data?.customer ||
  payload?.data?.cliente ||
  payload?.data ||
  payload?.customer ||
  payload?.cliente ||
  payload;

const getCustomerId = (customer) =>
  customer?.idCliente ??
  customer?.idcliente ??
  customer?.id_cliente ??
  customer?.id;

const getCustomerDocumentType = (customer) =>
  customer?.idTipoDocumento ??
  customer?.id_tipo_documento ??
  customer?.tipoDocumento?.id ??
  customer?.tipo_documento?.id ??
  customer?.tipoDocumentoId ??
  customer?.tipo_documento_id;

const getCustomerDocumentNumber = (customer) =>
  customer?.numeroDocumento ??
  customer?.numero_documento ??
  customer?.documento ??
  customer?.identificacion ??
  customer?.nit ??
  customer?.cedula;

const getCustomerName = (customer) =>
  customer?.razonSocial ??
  customer?.razon_social ??
  customer?.nombreCliente ??
  customer?.nombre_cliente ??
  customer?.nombre ??
  customer?.clienteNombre ??
  `Cliente #${getCustomerId(customer) ?? "N/A"}`;

const documentMatchesCustomer = (customer, documentTypeId, documentNumber) =>
  getCustomerDocumentType(customer)?.toString() === documentTypeId.toString() &&
  getCustomerDocumentNumber(customer)?.toString().trim() === documentNumber.trim();

const getStoredUser = () => {
  const rawUser = localStorage.getItem("user") || sessionStorage.getItem("user");
  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser);
  } catch {
    return null;
  }
};

const getStoredUserEmail = () => {
  const user = getStoredUser();
  return (
    user?.email ||
    user?.correo ||
    user?.usuario?.email ||
    user?.user?.email ||
    ""
  ).trim();
};

const hasSession = () =>
  Boolean(localStorage.getItem("token") || sessionStorage.getItem("token"));

const getStoredUserRoleId = () => {
  const user = getStoredUser();
  return Number(
    user?.idRol ??
    user?.idrol ??
    user?.id_rol ??
    user?.rol?.idRol ??
    user?.rol?.idrol ??
    user?.rol?.id_rol ??
    0
  );
};

const getStoredAuthenticatedUserId = () => {
  const user = getStoredUser();

  const userId = Number(
    user?.idUsuario ??
    user?.idusuario ??
    user?.id_usuario ??
    0
  );

  return Number.isInteger(userId) && userId > 0 ? userId : null;
};

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();
  const [quantityValue, setQuantityValue] = useState(String(item.quantity || 1));

  const unitPrice = parseCartPrice(item.price);
  const subtotal = unitPrice * item.quantity;

  useEffect(() => {
    setQuantityValue(String(item.quantity || 1));
  }, [item.quantity]);

  const commitQuantity = (value = quantityValue) => {
    const parsedQuantity = Number.parseInt(value, 10);
    const nextQuantity = Number.isInteger(parsedQuantity) && parsedQuantity > 0
      ? parsedQuantity
      : 1;

    setQuantityValue(String(nextQuantity));
    updateQuantity(item.id, nextQuantity);
  };

  const handleQuantityChange = (event) => {
    const nextValue = event.target.value;
    if (nextValue === "" || /^[0-9]+$/.test(nextValue)) {
      setQuantityValue(nextValue);
    }
  };

  const handleQuantityKeyDown = (event) => {
    if (event.key === "Enter") {
      event.currentTarget.blur();
    }
  };

  const decreaseQuantity = () => {
    const nextQuantity = Math.max(1, item.quantity - 1);
    setQuantityValue(String(nextQuantity));
    updateQuantity(item.id, nextQuantity);
  };

  const increaseQuantity = () => {
    const nextQuantity = item.quantity + 1;
    setQuantityValue(String(nextQuantity));
    updateQuantity(item.id, nextQuantity);
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      {/* Imagen */}
      <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingCart className="w-8 h-8 text-slate-300" />
          </div>
        )}
      </div>

      {/* Info del producto */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-slate-900 text-base truncate">{item.name}</p>
        <p className="text-sm text-slate-500 mt-0.5">Precio unitario: <span className="font-semibold text-blue-600">{item.price}</span></p>
        {item.discount && (
          <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
            <Tag className="w-3 h-3" />{item.discount}
          </span>
        )}
      </div>

      {/* Controles de cantidad */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={decreaseQuantity}
          disabled={item.quantity <= 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 text-slate-600 transition-all disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-slate-50 disabled:hover:border-slate-200 disabled:hover:text-slate-600"
          aria-label="Reducir cantidad"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <input
          type="number"
          min="1"
          step="1"
          inputMode="numeric"
          pattern="[0-9]*"
          value={quantityValue}
          onChange={handleQuantityChange}
          onBlur={() => commitQuantity()}
          onKeyDown={handleQuantityKeyDown}
          aria-label={`Cantidad de ${item.name}`}
          className="w-14 h-8 text-center font-bold text-slate-900 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
        />
        <button
          onClick={increaseQuantity}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 text-slate-600 transition-all"
          aria-label="Aumentar cantidad"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Subtotal por artículo */}
      <div className="flex-shrink-0 text-right hidden sm:block min-w-[90px]">
        <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">Subtotal</p>
        <p className="text-base font-extrabold text-slate-900">
          S/ {subtotal.toFixed(2)}
        </p>
      </div>

      {/* Botón eliminar */}
      <button
        onClick={() => removeFromCart(item.id)}
        className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
        aria-label="Eliminar artículo"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

const EmptyCart = () => (
  <div className="flex flex-col items-center justify-center py-24 text-center">
    <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
      <PackageOpen className="w-12 h-12 text-blue-400" />
    </div>
    <h2 className="text-2xl font-bold text-slate-800 mb-2">Tu carrito está vacío</h2>
    <p className="text-slate-500 mb-8 max-w-sm">
      No has añadido ningún repuesto aún. Explora nuestro catálogo y encuentra lo que necesitas.
    </p>
    <Link
      to="/"
      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-md shadow-blue-200"
    >
      <ArrowLeft className="w-4 h-4" />
      Ir a la Tienda
    </Link>
  </div>
);

const CustomerRegistrationModal = ({
  isOpen,
  formData,
  departments,
  municipalities,
  loadingMunicipalities,
  loading,
  documentValidation,
  onChange,
  onClose,
  onSubmit,
}) => {
  if (!isOpen) return null;

  const documentErrorId = "customer-document-error";
  const documentNumberHasError = Boolean(documentValidation.error);
  const isSubmitDisabled = loading || documentValidation.loading || documentValidation.exists;

  const updateField = (field, value) => {
    onChange({
      ...formData,
      [field]: value,
      ...(field === "id_departamento" ? { municipio_id: "" } : {}),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 px-4">
      <div className="w-full max-w-2xl max-h-[90vh] rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-y-auto">
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Completa tus datos de cliente</h2>
          <p className="text-sm text-slate-500 mt-1">
            Necesitamos vincular tu usuario a un registro de cliente antes de procesar el pedido.
          </p>
        </div>

        <form
          className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <label className="space-y-1.5 text-sm font-semibold text-slate-700">
            Tipo de documento <span className="text-blue-600">*</span>
            <select
              value={formData.id_tipo_documento}
              onChange={(event) => updateField("id_tipo_documento", event.target.value)}
              required
              className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
            >
              <option value="">Seleccionar...</option>
              <option value="1">Cedula de Ciudadania</option>
              <option value="2">NIT</option>
            </select>
          </label>

          <label className="space-y-1.5 text-sm font-semibold text-slate-700">
            Numero de documento <span className="text-blue-600">*</span>
            <input
              value={formData.numero_documento}
              onChange={(event) => updateField("numero_documento", event.target.value)}
              required
              aria-invalid={documentNumberHasError}
              aria-describedby={documentNumberHasError ? documentErrorId : undefined}
              className={`w-full h-11 rounded-xl border px-3 text-sm focus:outline-none focus:ring-2 ${
                documentNumberHasError
                  ? "border-red-300 focus:ring-red-100 focus:border-red-400"
                  : "border-slate-200 focus:ring-blue-100 focus:border-blue-400"
              }`}
              placeholder="Ej: 1020304050"
            />
            {documentValidation.loading && (
              <span className="block text-xs font-medium text-slate-400">
                Verificando documento...
              </span>
            )}
            {documentValidation.error && (
              <span id={documentErrorId} className="block text-xs font-semibold text-red-600">
                {documentValidation.error}
              </span>
            )}
          </label>

          <label className="space-y-1.5 text-sm font-semibold text-slate-700 md:col-span-2">
            Razon social / nombre completo <span className="text-blue-600">*</span>
            <input
              value={formData.razon_social}
              onChange={(event) => updateField("razon_social", event.target.value)}
              required
              className="w-full h-11 rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              placeholder="Nombre completo o razon social"
            />
          </label>

          <label className="space-y-1.5 text-sm font-semibold text-slate-700">
            Telefono <span className="text-blue-600">*</span>
            <input
              value={formData.telefono}
              onChange={(event) => updateField("telefono", event.target.value)}
              required
              className="w-full h-11 rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              placeholder="Ej: 3159876543"
            />
          </label>

          <label className="space-y-1.5 text-sm font-semibold text-slate-700">
            Email <span className="text-blue-600">*</span>
            <input
              type="email"
              value={formData.email}
              readOnly
              required
              className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 cursor-not-allowed"
            />
          </label>

          <label className="space-y-1.5 text-sm font-semibold text-slate-700 md:col-span-2">
            Direccion <span className="text-blue-600">*</span>
            <input
              value={formData.direccion}
              onChange={(event) => updateField("direccion", event.target.value)}
              required
              className="w-full h-11 rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              placeholder="Ej: Calle 45 # 12 - 30"
            />
          </label>

          <label className="space-y-1.5 text-sm font-semibold text-slate-700">
            Departamento <span className="text-blue-600">*</span>
            <select
              value={formData.id_departamento}
              onChange={(event) => updateField("id_departamento", event.target.value)}
              required
              className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
            >
              <option value="">Seleccionar...</option>
              {departments.map((department) => {
                const value = (department.id || department.idDepartamento || department.id_departamento)?.toString();
                return (
                  <option key={value} value={value}>
                    {department.name || department.nombre || department.nombreDepartamento || department.nombre_departamento}
                  </option>
                );
              })}
            </select>
          </label>

          <label className="space-y-1.5 text-sm font-semibold text-slate-700">
            Municipio <span className="text-blue-600">*</span>
            <select
              value={formData.municipio_id}
              onChange={(event) => updateField("municipio_id", event.target.value)}
              disabled={!formData.id_departamento || loadingMunicipalities}
              required
              className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="">
                {!formData.id_departamento
                  ? "Selecciona un departamento"
                  : loadingMunicipalities
                    ? "Cargando..."
                    : "Seleccionar..."}
              </option>
              {municipalities.map((municipality) => {
                const value = (municipality.id || municipality.idMunicipio || municipality.id_municipio)?.toString();
                return (
                  <option key={value} value={value}>
                    {municipality.name || municipality.nombre || municipality.nombreMunicipio || municipality.nombre_municipio}
                  </option>
                );
              })}
            </select>
          </label>

          <div className="md:col-span-2 flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-11 px-5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="h-11 px-5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500"
            >
              {loading ? "Guardando..." : "Guardar cliente y procesar pedido"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SellerCustomerSelectModal = ({
  isOpen,
  customers,
  loading,
  error,
  searchTerm,
  selectedCustomerId,
  onSearchChange,
  onSelectCustomer,
  onClose,
  onSubmit,
}) => {
  if (!isOpen) return null;

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredCustomers = customers.filter((customer) => {
    if (!normalizedSearch) return true;

    const customerName = getCustomerName(customer).toLowerCase();
    const documentNumber = String(getCustomerDocumentNumber(customer) ?? "").toLowerCase();
    return (
      customerName.includes(normalizedSearch) ||
      documentNumber.includes(normalizedSearch)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 px-4">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-100 bg-white shadow-2xl">
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-lg font-bold text-slate-900">Selecciona un cliente existente</h2>
          <p className="mt-1 text-sm text-slate-500">
            Busca por numero de documento o razon social para asociar el pedido al cliente correcto.
          </p>
        </div>

        <div className="space-y-4 px-6 py-5">
          <label className="block text-sm font-semibold text-slate-700">
            Buscar cliente
            <input
              value={searchTerm}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Ej: 1020304050 o Repuestos Gomez"
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
            />
          </label>

          <div className="max-h-[360px] overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50/70 p-2">
            {loading ? (
              <div className="px-4 py-8 text-center text-sm font-medium text-slate-400">
                Cargando clientes...
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm font-medium text-slate-400">
                No encontramos clientes con ese criterio de busqueda.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredCustomers.map((customer) => {
                  const customerId = getCustomerId(customer)?.toString();
                  const isSelected = customerId === selectedCustomerId;
                  return (
                    <button
                      key={customerId}
                      type="button"
                      onClick={() => onSelectCustomer(customerId)}
                      className={`w-full rounded-xl border px-4 py-3 text-left transition-all ${
                        isSelected
                          ? "border-blue-400 bg-blue-50 shadow-sm"
                          : "border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-900">
                            {getCustomerName(customer)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Documento: {getCustomerDocumentNumber(customer) || "No registrado"}
                          </p>
                          {customer?.email ? (
                            <p className="mt-1 truncate text-xs text-slate-400">{customer.email}</p>
                          ) : null}
                        </div>
                        {isSelected ? (
                          <span className="rounded-full bg-blue-600 px-2 py-1 text-[11px] font-bold text-white">
                            Seleccionado
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {error ? (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {error}
            </div>
          ) : null}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-11 rounded-xl border border-slate-200 px-5 font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={!selectedCustomerId || loading}
              className="h-11 rounded-xl bg-blue-600 px-5 font-bold text-white hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500"
            >
              Confirmar pedido para este cliente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function CartPage() {
  const navigate = useNavigate();
  const { cart, cartTotal, clearCart } = useCart();
  const iva = cartTotal * 0.19;
  const totalGeneral = cartTotal + iva;
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutSuccess, setCheckoutSuccess] = useState("");
  const [createdOrder, setCreatedOrder] = useState(null);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [customerForm, setCustomerForm] = useState(EMPTY_CUSTOMER_FORM);
  const [customerFormError, setCustomerFormError] = useState("");
  const lastCustomerErrorToastRef = useRef("");
  const lastDocumentValidationToastRef = useRef("");
  const [documentValidation, setDocumentValidation] = useState({
    loading: false,
    exists: false,
    error: "",
    key: "",
  });
  const [departments, setDepartments] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [loadingMunicipalities, setLoadingMunicipalities] = useState(false);
  const [sellerCustomerModalOpen, setSellerCustomerModalOpen] = useState(false);
  const [sellerCustomers, setSellerCustomers] = useState([]);
  const [sellerCustomersLoading, setSellerCustomersLoading] = useState(false);
  const [sellerCustomerError, setSellerCustomerError] = useState("");
  const [sellerCustomerSearch, setSellerCustomerSearch] = useState("");
  const [selectedSellerCustomerId, setSelectedSellerCustomerId] = useState("");
  const currentUserRoleId = getStoredUserRoleId();
  const currentUserId = getStoredAuthenticatedUserId();
  const isSellerSession = currentUserRoleId === 3;

  useEffect(() => {
    if (createdOrder) {
      const timer = setTimeout(() => {
        setCreatedOrder(null);
        setCheckoutSuccess("");
        navigate("/");
      }, 3800);
      return () => clearTimeout(timer);
    }
  }, [createdOrder, navigate]);

  const showBlockingToast = useCallback((message) => {
    toast.error("No puedes continuar", {
      description: message,
    });
  }, []);

  useEffect(() => {
    if (!customerModalOpen) return;

    authFetch(`${API_BASE_URL}/departments`)
      .then((response) => (response.ok ? response.json() : []))
      .then((payload) => setDepartments(extractList(payload)))
      .catch(() => setDepartments([]));
  }, [customerModalOpen]);

  useEffect(() => {
    if (!customerModalOpen) {
      lastCustomerErrorToastRef.current = "";
      lastDocumentValidationToastRef.current = "";
      return;
    }

    if (!customerFormError || customerFormError === lastCustomerErrorToastRef.current) return;
    if (customerFormError === documentValidation.error) return;

    lastCustomerErrorToastRef.current = customerFormError;
    showBlockingToast(customerFormError);
  }, [customerFormError, customerModalOpen, documentValidation.error, showBlockingToast]);

  useEffect(() => {
    if (!customerModalOpen) return;
    if (!documentValidation.error) return;

    const toastKey = `${documentValidation.key}:${documentValidation.error}`;
    if (toastKey === lastDocumentValidationToastRef.current) return;

    lastDocumentValidationToastRef.current = toastKey;
    showBlockingToast(documentValidation.error);
  }, [
    customerModalOpen,
    documentValidation.error,
    documentValidation.key,
    showBlockingToast,
  ]);

  useEffect(() => {
    if (!customerModalOpen || !customerForm.id_departamento) {
      setMunicipalities([]);
      return;
    }

    setLoadingMunicipalities(true);
    authFetch(`${API_BASE_URL}/municipalities/department/${customerForm.id_departamento}`)
      .then((response) => (response.ok ? response.json() : []))
      .then((payload) => setMunicipalities(extractList(payload)))
      .catch(() => setMunicipalities([]))
      .finally(() => setLoadingMunicipalities(false));
  }, [customerModalOpen, customerForm.id_departamento]);

  useEffect(() => {
    if (!sellerCustomerModalOpen) {
      setSellerCustomerSearch("");
      setSelectedSellerCustomerId("");
      setSellerCustomerError("");
      return;
    }

    let ignore = false;

    const loadCustomers = async () => {
      setSellerCustomersLoading(true);
      setSellerCustomerError("");

      try {
        const response = await authFetch(`${API_BASE_URL}/customers`);
        const payload = response.ok ? await response.json().catch(() => []) : [];
        if (ignore) return;

        const customers = extractList(payload);
        setSellerCustomers(customers);

        if (customers.length === 0) {
          setSellerCustomerError("No hay clientes disponibles para asociar este pedido.");
        }
      } catch (error) {
        if (!ignore) {
          setSellerCustomers([]);
          setSellerCustomerError(
            error.message || "No fue posible cargar los clientes para el vendedor."
          );
        }
      } finally {
        if (!ignore) {
          setSellerCustomersLoading(false);
        }
      }
    };

    loadCustomers();

    return () => {
      ignore = true;
    };
  }, [sellerCustomerModalOpen]);

  const findCustomerByEmail = async (email) => {
    const encodedEmail = encodeURIComponent(email);
    const urls = [
      `${API_BASE_URL}/customers/email/${encodedEmail}`,
      `${API_BASE_URL}/customers/by-email?email=${encodedEmail}`,
      `${API_BASE_URL}/customers?email=${encodedEmail}`,
      `${API_BASE_URL}/customers`,
    ];

    for (const url of urls) {
      const response = await authFetch(url);
      if (response.status === 404) continue;
      if (!response.ok) continue;

      const payload = await response.json().catch(() => ({}));
      const list = extractList(payload);
      if (list.length > 0) {
        const found = list.find((customer) =>
          [
            customer.email,
            customer.correo,
            customer.emailCliente,
            customer.email_cliente,
          ]
            .filter(Boolean)
            .some((value) => value.toString().toLowerCase() === email.toLowerCase())
        );
        if (found) return found;
      }

      const entity = unwrapEntity(payload);
      const entityEmail = entity?.email || entity?.correo || entity?.emailCliente || entity?.email_cliente;
      if (entityEmail?.toString().toLowerCase() === email.toLowerCase()) {
        return entity;
      }
    }

    return null;
  };

  const findCustomerByDocument = async (documentTypeId, documentNumber, options = {}) => {
    const trimmedNumber = documentNumber.trim();
    const encodedType = encodeURIComponent(documentTypeId);
    const encodedNumber = encodeURIComponent(trimmedNumber);
    const urls = [
      `${API_BASE_URL}/customers/document?tipoDocumento=${encodedType}&numeroDocumento=${encodedNumber}`,
      `${API_BASE_URL}/customers/document?idTipoDocumento=${encodedType}&numeroDocumento=${encodedNumber}`,
      `${API_BASE_URL}/customers/by-document?id_tipo_documento=${encodedType}&numero_documento=${encodedNumber}`,
      `${API_BASE_URL}/customers?tipoDocumento=${encodedType}&numeroDocumento=${encodedNumber}`,
      `${API_BASE_URL}/customers?idTipoDocumento=${encodedType}&numeroDocumento=${encodedNumber}`,
      `${API_BASE_URL}/customers`,
    ];

    for (const url of urls) {
      const response = await authFetch(url, { signal: options.signal });
      if (response.status === 404) continue;
      if (!response.ok) continue;

      const payload = await response.json().catch(() => ({}));
      if (payload?.exists === true || payload?.data?.exists === true) {
        return unwrapEntity(payload);
      }

      const list = extractList(payload);
      if (list.length > 0) {
        const found = list.find((customer) =>
          documentMatchesCustomer(customer, documentTypeId, trimmedNumber)
        );
        if (found) return found;
      }

      const entity = unwrapEntity(payload);
      if (entity && documentMatchesCustomer(entity, documentTypeId, trimmedNumber)) {
        return entity;
      }
    }

    return null;
  };

  useEffect(() => {
    const documentTypeId = customerForm.id_tipo_documento;
    const documentNumber = customerForm.numero_documento.trim();
    const validationKey = `${documentTypeId}:${documentNumber}`;

    if (!customerModalOpen || !documentTypeId || !documentNumber) {
      setDocumentValidation({
        loading: false,
        exists: false,
        error: "",
        key: "",
      });
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setDocumentValidation({
        loading: true,
        exists: false,
        error: "",
        key: validationKey,
      });

      try {
        const existingCustomer = await findCustomerByDocument(documentTypeId, documentNumber, {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;

        setDocumentValidation({
          loading: false,
          exists: Boolean(existingCustomer),
          error: existingCustomer
            ? "Este tipo y numero de documento ya pertenecen a un cliente registrado en MSG Repuestos."
            : "",
          key: validationKey,
        });
      } catch (error) {
        if (error.name === "AbortError") return;
        setDocumentValidation({
          loading: false,
          exists: false,
          error: "No fue posible validar el documento. Intenta nuevamente.",
          key: validationKey,
        });
      }
    }, 450);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [customerModalOpen, customerForm.id_tipo_documento, customerForm.numero_documento]);

  const buildOrderPayload = (customer, options = {}) => {
    const idCliente = getCustomerId(customer);
    const sellerId = options.sellerId ?? null;
    const detalles = cart.map((item) => {
      const cantidad = Number.parseInt(item.quantity, 10) || 1;
      const precioUnitario = parseCartPrice(item.price);
      return {
        id_producto: item.id,
        idProducto: item.id,
        cantidad,
        cantidad_solicitada: cantidad,
        precio_unitario: precioUnitario,
        precioVenta: precioUnitario,
        descuento_porcentaje: 0,
        descuento_aplicado: 0,
        subtotal_linea: parseFloat((cantidad * precioUnitario).toFixed(2)),
        nombreProducto: item.name,
      };
    });

      return {
        id_cliente: idCliente,
        idCliente,
        id_vendedor: sellerId,
        idVendedor: sellerId,
      id_origen_pedido: 2,
      idOrigenPedido: 2,
      id_estado_pedido: 1,
      idEstado: 1,
      subtotal: parseFloat(cartTotal.toFixed(2)),
      impuestos: parseFloat(iva.toFixed(2)),
      descuentos: 0,
      total_neto: parseFloat(totalGeneral.toFixed(2)),
      totalNeto: parseFloat(totalGeneral.toFixed(2)),
      tipo_pago: "Pendiente",
      notas: "Pedido generado desde el carrito web de MSG Repuestos.",
      detalles,
    };
  };

  const processOrder = async (customer, options = {}) => {
    const idCliente = getCustomerId(customer);
    if (!idCliente) {
      throw new Error("No fue posible identificar el cliente para crear el pedido.");
    }

    const response = await authFetch(`${API_BASE_URL}/orders`, {
      method: "POST",
      body: JSON.stringify(buildOrderPayload(customer, options)),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.message || payload.error || "No se pudo registrar el pedido.");
    }

    return unwrapEntity(payload);
  };

  const openCustomerForm = (email) => {
    setCustomerForm({
      ...EMPTY_CUSTOMER_FORM,
      email,
    });
    setCustomerFormError("");
    setDocumentValidation({
      loading: false,
      exists: false,
      error: "",
      key: "",
    });
    setCustomerModalOpen(true);
  };

  const openSellerCustomerSelector = () => {
    setSellerCustomerError("");
    setSelectedSellerCustomerId("");
    setSellerCustomerSearch("");
    setSellerCustomerModalOpen(true);
  };

  const handleConfirmOrder = async () => {
    setCheckoutError("");
    setCheckoutSuccess("");

    if (cart.length === 0) return;

    if (!hasSession()) {
      setCheckoutError("Debes iniciar sesion antes de confirmar el pedido.");
      return;
    }

    if (isSellerSession) {
      if (!currentUserId) {
        setCheckoutError("No fue posible identificar al vendedor autenticado para registrar el pedido.");
        return;
      }

      openSellerCustomerSelector();
      return;
    }

    const email = getStoredUserEmail();
    if (!email) {
      setCheckoutError("No encontramos el email del usuario autenticado. Actualiza tu perfil o inicia sesion nuevamente.");
      return;
    }

    setCheckoutLoading(true);
    try {
      const existingCustomer = await findCustomerByEmail(email);
      if (!existingCustomer) {
        openCustomerForm(email);
        return;
      }

      const order = await processOrder(existingCustomer);
      setCreatedOrder(order);
      clearCart();
      setCheckoutSuccess(`Pedido ${order?.idPedido || order?.id_pedido || order?.id || ""} registrado correctamente.`);
    } catch (error) {
      setCheckoutError(error.message || "No se pudo confirmar el pedido.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleSellerOrderSubmit = async () => {
    if (!selectedSellerCustomerId) {
      setSellerCustomerError("Debes seleccionar un cliente para continuar.");
      return;
    }

    if (!currentUserId) {
      setSellerCustomerError("No fue posible identificar al vendedor autenticado.");
      return;
    }

    const selectedCustomer = sellerCustomers.find(
      (customer) => getCustomerId(customer)?.toString() === selectedSellerCustomerId
    );

    if (!selectedCustomer) {
      setSellerCustomerError("El cliente seleccionado ya no esta disponible. Intenta nuevamente.");
      return;
    }

    setCheckoutLoading(true);
    setSellerCustomerError("");
    setCheckoutError("");

    try {
      const order = await processOrder(selectedCustomer, { sellerId: currentUserId });
      setSellerCustomerModalOpen(false);
      setCreatedOrder(order);
      clearCart();
      setCheckoutSuccess(
        `Pedido ${order?.idPedido || order?.id_pedido || order?.id || ""} registrado correctamente para ${getCustomerName(selectedCustomer)}.`
      );
    } catch (error) {
      const message = error.message || "No se pudo confirmar el pedido para el cliente seleccionado.";
      setSellerCustomerError(message);
      setCheckoutError(message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleCustomerSubmit = async () => {
    const requiredFields = [
      "id_tipo_documento",
      "numero_documento",
      "razon_social",
      "direccion",
      "telefono",
      "email",
      "id_departamento",
      "municipio_id",
    ];
    const missingField = requiredFields.find((field) => !customerForm[field]?.toString().trim());
    if (missingField) {
      setCustomerFormError("Completa todos los campos obligatorios para continuar.");
      return;
    }

    const documentKey = `${customerForm.id_tipo_documento}:${customerForm.numero_documento.trim()}`;
    if (documentValidation.loading) {
      const message = "Espera un momento mientras validamos el documento.";
      setCustomerFormError(message);
      return;
    }

    if (documentValidation.exists && documentValidation.key === documentKey) {
      const message = "No puedes guardar este cliente porque el documento ya esta registrado en MSG Repuestos.";
      setCustomerFormError(message);
      return;
    }

    setCheckoutLoading(true);
    setCustomerFormError("");
    setCheckoutError("");
    try {
      const existingCustomer = await findCustomerByDocument(
        customerForm.id_tipo_documento,
        customerForm.numero_documento
      );
      if (existingCustomer) {
        setDocumentValidation({
          loading: false,
          exists: true,
          error: "Este tipo y numero de documento ya pertenecen a un cliente registrado en MSG Repuestos.",
          key: documentKey,
        });
        const message = "No puedes guardar este cliente porque el documento ya esta registrado en MSG Repuestos.";
        throw new Error(message);
      }

      const customerPayload = {
        id_tipo_documento: parseInt(customerForm.id_tipo_documento, 10),
        idTipoDocumento: parseInt(customerForm.id_tipo_documento, 10),
        numero_documento: customerForm.numero_documento.trim(),
        numeroDocumento: customerForm.numero_documento.trim(),
        razon_social: customerForm.razon_social.trim(),
        razonSocial: customerForm.razon_social.trim(),
        direccion: customerForm.direccion.trim(),
        telefono: customerForm.telefono.trim(),
        email: customerForm.email.trim(),
        id_departamento: parseInt(customerForm.id_departamento, 10),
        idDepartamento: parseInt(customerForm.id_departamento, 10),
        municipio_id: parseInt(customerForm.municipio_id, 10),
        id_municipio: parseInt(customerForm.municipio_id, 10),
        idMunicipio: parseInt(customerForm.municipio_id, 10),
        tipoCliente: "Consumidor Final",
        tipo_cliente: "Consumidor Final",
        cupoCredito: 0,
        cupo_credito: 0,
        idEstado: 1,
        id_estado: 1,
      };

      const response = await authFetch(`${API_BASE_URL}/customers`, {
        method: "POST",
        body: JSON.stringify(customerPayload),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.message || payload.error || "No se pudo registrar el cliente.");
      }

      const savedCustomer = unwrapEntity(payload);
      const order = await processOrder(savedCustomer);
      setCustomerModalOpen(false);
      setCreatedOrder(order);
      clearCart();
      setCheckoutSuccess(`Cliente registrado y pedido ${order?.idPedido || order?.id_pedido || order?.id || ""} creado correctamente.`);
    } catch (error) {
      setCustomerFormError(error.message || "No se pudo completar el registro del cliente.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="flex-1">
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Encabezado */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Seguir comprando
            </Link>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Carrito de Compras
            </h1>
            {cart.length > 0 && (
              <p className="text-slate-500 mt-1">
                {cart.length} {cart.length === 1 ? "artículo" : "artículos"} en tu carrito
              </p>
            )}
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              Vaciar carrito
            </button>
          )}
        </div>

        {/* Removed flat static checkoutSuccess banner */}

        {cart.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Lista de productos */}
            <div className="lg:col-span-2 space-y-3">
              {cart.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>

            {/* Panel de Resumen */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sticky top-24">
                <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                  Resumen del Pedido
                </h2>

                <div className="space-y-3 mb-5">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-semibold">S/ {cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>IVA (19%)</span>
                    <span className="font-semibold">S/ {iva.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-400 italic">
                    <span>Envío</span>
                    <span>A calcular</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-bold text-slate-900">Total</span>
                    <span className="text-2xl font-extrabold text-blue-600">
                      S/ {totalGeneral.toFixed(2)}
                    </span>
                  </div>
                </div>

                {checkoutError && (
                  <div className="mb-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
                    {checkoutError}
                  </div>
                )}

                {/* Removed secondary flat checkoutSuccess status */}

                <button
                  onClick={handleConfirmOrder}
                  disabled={checkoutLoading}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-200 flex items-center justify-center gap-2 text-base disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  {checkoutLoading ? "Procesando..." : "Confirmar Pedido"}
                </button>

                <p className="text-[11px] text-slate-400 text-center mt-3 leading-relaxed">
                  Al confirmar, un asesor de MSG Repuestos revisará tu pedido y se pondrá en contacto contigo.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <CustomerRegistrationModal
        isOpen={customerModalOpen}
        formData={customerForm}
        departments={departments}
        municipalities={municipalities}
        loadingMunicipalities={loadingMunicipalities}
        loading={checkoutLoading}
        documentValidation={documentValidation}
        onChange={setCustomerForm}
        onClose={() => {
          if (!checkoutLoading) setCustomerModalOpen(false);
        }}
        onSubmit={handleCustomerSubmit}
      />

      <SellerCustomerSelectModal
        isOpen={sellerCustomerModalOpen}
        customers={sellerCustomers}
        loading={sellerCustomersLoading || checkoutLoading}
        error={sellerCustomerError}
        searchTerm={sellerCustomerSearch}
        selectedCustomerId={selectedSellerCustomerId}
        onSearchChange={setSellerCustomerSearch}
        onSelectCustomer={setSelectedSellerCustomerId}
        onClose={() => {
          if (!checkoutLoading) setSellerCustomerModalOpen(false);
        }}
        onSubmit={handleSellerOrderSubmit}
      />

      {createdOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md px-4 animate-in fade-in duration-300">
          <style>{`
            @keyframes scaleUp {
              0% { transform: scale(0.7); opacity: 0; }
              70% { transform: scale(1.05); opacity: 1; }
              100% { transform: scale(1); opacity: 1; }
            }
            @keyframes progress {
              0% { width: 100%; }
              100% { width: 0%; }
            }
            .animate-scaleUp {
              animation: scaleUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            }
            .animate-progress {
              animation: progress 3.8s linear forwards;
            }
          `}</style>
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-2xl p-8 text-center animate-scaleUp">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-400 rounded-full blur-xl opacity-35 animate-pulse" />
                <div className="relative bg-emerald-50 rounded-full p-5 border border-emerald-100 flex items-center justify-center w-24 h-24">
                  <CheckCircle2 className="w-14 h-14 text-emerald-500 animate-[bounce_1.5s_infinite]" />
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-extrabold text-slate-900 leading-snug">
              ¡Gracias por tu compra!
            </h2>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed font-medium">
              Tu pedido ha sido registrado correctamente y está en proceso de validación.
            </p>

            <div className="mt-6 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-left space-y-2">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Número de Orden</span>
                <span className="font-bold text-slate-800">
                  #{createdOrder?.idPedido || createdOrder?.id_pedido || createdOrder?.id || "N/A"}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Total de Compra</span>
                <span className="font-extrabold text-blue-600">
                  S/ {(createdOrder?.total_neto ?? createdOrder?.totalNeto ?? totalGeneral).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 italic">
                <span>Estado de Pago</span>
                <span className="font-semibold text-slate-600">Pendiente de revisión</span>
              </div>
            </div>

            <p className="mt-6 text-xs text-slate-400 font-medium">
              Redireccionando a la Página de Inicio...
            </p>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
              <div className="bg-emerald-500 h-full rounded-full animate-progress" />
            </div>
          </div>
        </div>
      )}
      </div>

      <Footer />

      <WhatsAppButton />
    </div>
  );
}
