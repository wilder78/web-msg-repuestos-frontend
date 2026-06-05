import React, { useRef, useState, useEffect } from "react";
import { useModalDock } from "../../contexts/ModalDockContext";
import { 
  Minus, X, Loader2, MonitorDot, AlertCircle, Save, 
  ShoppingCart, UserCheck, CreditCard, Wallet, Landmark, Receipt, CheckCircle2 
} from "lucide-react";
import { cn } from "../../lib/utils";
import { toast } from "sonner";

import { CustomerForm } from "../../pages/Customers/components/CustomerForm";
import { UserForm } from "../../pages/Users/components/UserForm";
import { SupplierForm } from "../../pages/Suppliers/components/SupplierForm";
import { RolForm } from "../../pages/Roles/components/RolForm";
import { ProductForm } from "../../pages/Products/components/ProductForm";
import { PermitForm } from "../../pages/Permits/components/PermitForm";
import { PedidoForm } from "../../pages/Pedidos/components/PedidoForm";
import { RouteForm } from "../../pages/FollowUp/components/RouteForm";
import { EmployeeForm } from "../../pages/Employees/components/EmployeeForm";
import { ReturnForm } from "../../pages/Devoluciones/components/ReturnForm";
import { CreditForm } from "../../pages/Credits/components/CreditForm";
import { CompraForm } from "../../pages/Compras/components/CompraForm";
import { CategoryForm } from "../../pages/Category/components/CategoryForm";
import { AreaForm } from "../../pages/Area/components/AreaForm";
import { AbonoForm } from "../../pages/Abonos/components/AbonoForm";





// Helper functions for user roles
const getCurrentUser = () => {
  const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

const isMasterUser = (user) => {
  const roleId = user?.idRol ?? user?.idrol ?? user?.id_rol ?? user?.rol?.idRol;
  const userName = (user?.nombreUsuario || user?.nombreusuario || user?.nombre || "").toLowerCase();
  const roleName = (user?.nombreRol || user?.nombrerol || user?.rol?.nombreRol || "").toLowerCase();
  return Number(roleId) === 1 || userName === "master" || roleName === "master";
};

// Helper to convert product camelCase object into snake_case FormData
const toProductFormData = (data, imageFile = null) => {
  const body = new FormData();
  const keyMap = {
    precioCompra:    "precio_compra",
    precioPublico:   "precio_publico",
    precioMayorista: "precio_mayorista",
    precioMinorista: "precio_minorista",
    stockBuenEstado: "stock_buen_estado",
    stockDefectuoso: "stock_defectuoso",
    idCategoria:     "id_categoria",
    fechaRegistro:   "fecha_registro",
  };

  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    const backendKey = keyMap[key] || key;

    if (["precio_compra", "precio_publico", "precio_mayorista", "precio_minorista"].includes(backendKey)) {
      const parsed = parseFloat(String(value).replace(",", "."));
      if (!isNaN(parsed)) body.append(backendKey, parsed.toFixed(2));
      return;
    }

    if (backendKey === "stock_buen_estado" || backendKey === "stock_defectuoso") {
      const parsed = parseInt(value, 10);
      if (!isNaN(parsed)) body.append(backendKey, parsed);
      return;
    }

    if (value !== "") body.append(backendKey, value);
  });

  if (imageFile) body.append("imagen", imageFile);
  return body;
};

// Helper de Fetch Autenticado
const authFetch = (url, options = {}) => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  const isFormData = options.body instanceof FormData;
  return fetch(url, {
    ...options,
    headers: {
      ...(!isFormData ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
};

const normalizeDetailForCompare = (detalle) => {
  const producto = detalle?.producto || {};
  const cantidad = Number(detalle?.cantidad ?? detalle?.cantidad_solicitada ?? 0);
  const precio = Number(detalle?.precio_unitario ?? detalle?.precio_venta ?? 0);
  const descuento = Number(detalle?.descuento_porcentaje ?? detalle?.descuento_aplicado ?? detalle?.descuento ?? 0);

  return {
    id_producto: String(
      detalle?.id_producto ||
      detalle?.idProducto ||
      producto.id_producto ||
      producto.idProducto ||
      producto.id ||
      ""
    ),
    cantidad,
    precio,
    descuento,
    codigo: detalle?.codigo || producto.referencia || detalle?.referenciaProducto || "",
    nombre: detalle?.nombreProducto || producto.nombre || "",
  };
};

const areDetailsEqual = (currentDetails = [], originalDetails = []) => {
  const current = currentDetails.map(normalizeDetailForCompare);
  const original = originalDetails.map(normalizeDetailForCompare);
  return JSON.stringify(current) === JSON.stringify(original);
};

// ── Renderizador de contenido dinámico según tipo de ventana ─────────────────
const WindowContent = ({ win, onClose }) => {
  const { updateWindowFormState } = useModalDock();
  const [isFormValid, setIsFormValid] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [zonas, setZonas] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [usedUserIds, setUsedUserIds] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [allSystemPermissions, setAllSystemPermissions] = useState([]);
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [productCategories, setProductCategories] = useState([]);
  const [preview, setPreview] = useState(null);
  const [initLoaded, setInitLoaded] = useState(false);
  // Ref para capturar el snapshot inicial del formulario en modo edición
  const initialFormSnapshot = useRef(null);


  // Inicializar Datos del Formulario
  const defaultFormState = win.type === "customer-create" 
    ? {
        idTipoDocumento: "",
        numeroDocumento: "",
        razonSocial: "",
        personaContacto: "",
        direccion: "",
        telefono: "",
        email: "",
        tipoCliente: "",
        cupoCredito: "",
        idZona: "",
        idDepartamento: "",
        idMunicipio: "",
      }
    : win.type === "user-create"
    ? {
        nombreUsuario: "",
        email: "",
        password: "",
        id_rol: "",
        id_estado: "1",
      }
    : win.type === "supplier-create"
    ? {
        id_tipo_documento: 2,
        numero_documento: "",
        nombre_empresa: "",
        contacto: "",
        telefono: "",
        email: "",
        direccion: "",
        condiciones_comerciales: "",
        id_estado: 1,
        id_departamento: "",
        id_municipio: "",
      }
    : win.type === "sale-create"
    ? {
        idPedido: "",
        idFormaPago: "",
      }
    : win.type === "role-create"
    ? {
        nombreRol: "",
        descripcion: "",
        color: "bg-emerald-500",
        selectedPermIds: [],
      }
    : win.type === "role-edit"
    ? {
        nombreRol: win.data.nombre || "",
        descripcion: win.data.descripcion || "",
        estado: win.data.estado || "Activo",
        selectedPermIds: [],
      }
    : win.type === "product-create"
    ? {
        referencia: "",
        nombre: "",
        descripcion: "",
        marca: "",
        modelo: "",
        precioCompra: "",
        precioPublico: "",
        precioMayorista: "",
        precioMinorista: "",
        stockBuenEstado: "",
        stockDefectuoso: 0,
        idCategoria: "",
        idEstado: 1,
        fechaRegistro: new Date().toISOString().split("T")[0],
      }
    : win.type === "product-edit"
    ? {
        nombre:          win.data.nombre              || "",
        referencia:      win.data.referencia          || "",
        idCategoria:     win.data.idCategoria?.toString()
                         || win.data.id_categoria?.toString()
                         || win.data.categoria?.idCategoria?.toString()
                         || win.data.categoria?.id_categoria?.toString()
                         || "",
        marca:           win.data.marca               || "",
        modelo:          win.data.modelo              || "",
        precioCompra:    win.data.precioCompra        ?? win.data.precio_compra ?? "",
        precioPublico:   win.data.precioPublico       ?? win.data.precio_publico ?? "",
        precioMayorista: win.data.precioMayorista     ?? win.data.precio_mayorista ?? "",
        precioMinorista: win.data.precioMinorista     ?? win.data.precio_minorista ?? "",
        stockBuenEstado: win.data.stockBuenEstado     ?? win.data.stock_buen_estado ?? 0,
        stockDefectuoso: win.data.stockDefectuoso     ?? win.data.stock_defectuoso ?? 0,
        descripcion:     win.data.descripcion         || "",
      }
    : win.type === "permit-create"
    ? {
        nombrePermiso: "",
        modulo: "",
        categoria: "",
        descripcion: "",
        idEstado: 1,
      }
    : win.type === "permit-edit"
    ? {
        nombrePermiso: win.data.nombrePermiso || "",
        modulo: win.data.modulo || "",
        categoria: win.data.categoria || "",
        descripcion: win.data.descripcion || win.data.description || "",
        idEstado: win.data.idEstado || 1,
        _initial: {
          nombrePermiso: win.data.nombrePermiso || "",
          modulo: win.data.modulo || "",
          categoria: win.data.categoria || "",
          descripcion: win.data.descripcion || win.data.description || "",
        }
      }
    : win.type === "order-create"
    ? {
        id_cliente: "",
        id_vendedor: "",
        nombreCliente: "",
        nombreVendedor: "",
        id_origen_pedido: "1",
        id_estado_pedido: "1",
        tipo_pago: "",
        notas: "",
        detalles: [],
      }
    : win.type === "order-edit"
    ? {
        id_cliente: win.data.id_cliente || win.data.cliente?.idCliente || "",
        id_vendedor:
            win.data.id_vendedor ||
            win.data.idVendedor ||
            win.data.vendedor?.idUsuario ||
            win.data.vendedor?.idusuario ||
            win.data.vendedor?.id_usuario ||
            "",
        nombreCliente: win.data.nombreCliente || win.data.cliente?.razonSocial || "",
        nombreVendedor:
            win.data.nombreVendedor ||
            win.data.vendedorNombre ||
            win.data.vendedor?.nombreUsuario ||
            win.data.vendedor?.nombreusuario ||
            win.data.vendedor?.nombre_usuario ||
            win.data.id_vendedor ||
            "",
        numeroDocumento: win.data.cliente?.numeroDocumento || win.data.numeroDocumento || "",
        telefono: win.data.cliente?.telefono || win.data.telefono || "",
        email: win.data.cliente?.email || win.data.email || "",
        direccion: win.data.cliente?.direccion || win.data.direccion || "",
        tipoCliente: win.data.cliente?.tipoCliente || win.data.tipoCliente || "",
        id_origen_pedido: win.data.id_origen_pedido || "1",
        id_estado_pedido: (win.data.id_estado_pedido ?? win.data.idEstado)?.toString() || "1",
        total_neto: win.data.total_neto || "",
        tipo_pago: win.data.tipo_pago || "",
        detalles: (Array.isArray(win.data.detalles) ? win.data.detalles : []).map((detalle) => {
            const cantidad = Number(detalle.cantidad ?? detalle.cantidad_solicitada ?? 1);
            const precio = Number(detalle.precio_unitario ?? detalle.precio_venta ?? 0);
            const base = cantidad * precio;
            const descuentoValor = Number(detalle.descuento_aplicado ?? detalle.descuento ?? 0);
            const descuentoPorcentaje = detalle.descuento_porcentaje != null
                ? Number(detalle.descuento_porcentaje)
                : base > 0
                    ? (descuentoValor / base) * 100
                    : 0;

            return {
                ...detalle,
                codigo: detalle.producto?.referencia || detalle.referenciaProducto || detalle.codigo || "",
                nombreProducto: detalle.producto?.nombre || detalle.nombreProducto || "",
                cantidad,
                precio_unitario: precio,
                descuento_porcentaje: Math.min(Math.max(descuentoPorcentaje, 0), 100),
                descuento_aplicado: descuentoValor,
            };
        }),
      }
    : win.type === "route-create"
    ? {
        nombreRuta: "",
        idZona: "",
        idEmpleado: "",
        fechaPlanificada: "",
        detalles: [],
      }
    : win.type === "route-edit"
    ? {
        nombreRuta: win.data.nombreRuta || "",
        idZona: win.data.idZona?.toString() || "",
        idEmpleado: win.data.idEmpleado?.toString() || "",
        fechaPlanificada: win.data.fechaPlanificada 
          ? (() => {
              try {
                return new Date(win.data.fechaPlanificada).toISOString().split("T")[0];
              } catch {
                return win.data.fechaPlanificada.split("T")[0];
              }
            })()
          : "",
        detalles: win.data.detalles || [],
      }
    : win.type === "employee-create"
    ? {
        idTipoDocumento: 1,
        numeroDocumento: "",
        nombre: "",
        apellido: "",
        telefono: "",
        rolOperativo: "",
        idUsuario: null,
        disponibilidad: 1,
        id_estado: 1,
      }
    : win.type === "employee-edit"
    ? {
        idTipoDocumento: (win.data.idTipoDocumento || 1).toString(),
        numeroDocumento: win.data.numeroDocumento || "",
        nombre: win.data.nombre || win.data.nombres || "",
        apellido: win.data.apellido || win.data.apellidos || "",
        telefono: win.data.telefono || "",
        rolOperativo: win.data.cargo || win.data.rolOperativo || "",
        idUsuario: win.data.idUsuario || null,
        disponibilidad: win.data.disponibilidad === true || win.data.disponibilidad === 1,
        idEstado: win.data.idEstado ?? win.data.statusId ?? 1,
      }
    : win.type === "return-create"
    ? {
        idCliente: "",
        clienteNombre: "",
        numeroDocumento: "",
        idPedido: "",
        idVenta: "",
        totalAjuste: 0,
        subtotal: 0,
        iva: 0,
        motivo: "",
        detalles: [],
      }
    : win.type === "credit-create"
    ? {
        idCliente: "",
        cupoAprobado: "",
        notas: "",
      }
    : win.type === "credit-edit"
    ? {
        cupoAprobado: String(win.data.cupoAprobado ?? win.data.montoCredito ?? ""),
        idEstado: String(win.data.idEstado ?? 1),
      }
    : win.type === "compra-create"
    ? {
        idProveedor: "",
        proveedorNombre: "",
        fechaCompra: new Date().toISOString().split("T")[0],
        numeroFactura: "",
        detalles: [],
      }
    : win.type === "category-create"
    ? {
        nombre_categoria: "",
        descripcion: "",
      }
    : win.type === "category-edit"
    ? {
        nombre_categoria: win.data.nombre || win.data.nombre_categoria || "",
        descripcion: win.data.descripcion || "",
        id_estado: win.data.statusId ?? win.data.id_estado ?? 1,
      }
    : win.type === "area-create"
    ? {
        nombreZona: "",
        descripcion: "",
      }
    : win.type === "area-edit"
    ? {
        nombreZona: win.data.name || win.data.nombreZona || "",
        descripcion: win.data.description || win.data.descripcion || "",
        idEstado: win.data.statusId ?? win.data.idEstado ?? 1,
      }
    : win.type === "abono-create"
    ? {
        idCliente: "",
        clienteNombre: "",
        idCredito: "",
        idPedido: "",
        tipoAbono: "credito",
        montoAbono: "",
        metodoPago: "",
        referencia: "",
        descripcion: "",
      }
    : { ...win.data };





  const currentFormState = { ...defaultFormState, ...win.formState };

  // Captura el snapshot inicial del formulario solo una vez al montar (para ventanas tipo -edit)
  useEffect(() => {
    if (win.type.endsWith("-edit") && !initialFormSnapshot.current) {
      initialFormSnapshot.current = JSON.stringify(currentFormState);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Cargar listas iniciales según tipo de ventana para no hacer peticiones innecesarias
    if (win.type === "user-create" || win.type === "user-edit") {
      authFetch("/api/roles")
        .then(r => r.ok ? r.json() : [])
        .then(data => {
          let list = Array.isArray(data) ? data : (data.data || data.roles || []);
          // filtrar rol Master si el usuario actual no es master
          const currentUserStr = localStorage.getItem("user");
          let currentUser = null;
          try {
            currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
          } catch (e) {}
          const isCurrentUserMaster =
            currentUser &&
            (currentUser.idUsuario === 1 ||
              currentUser.nombreUsuario?.toLowerCase() === "master" ||
              currentUser.id === 1);
          
          if (!isCurrentUserMaster) {
            list = list.filter(rol => {
              const isMasterRole = rol.idRol === 1 || rol.nombreRol?.toLowerCase() === "master" || rol.nombre_rol?.toLowerCase() === "master";
              return !isMasterRole;
            });
          }
          setRoles(list);
          setInitLoaded(true);
        })
        .catch(err => {
          console.error("Error loading roles:", err);
          setInitLoaded(true);
        });
    } else if (win.type === "supplier-create" || win.type === "supplier-edit") {
      setInitLoaded(true);
    } else if (win.type === "sale-create") {
      setLoadingOrders(true);
      Promise.all([
        authFetch("/api/orders").then(r => r.ok ? r.json() : []),
        authFetch("/api/sales").then(r => r.ok ? r.json() : [])
      ]).then(([orderData, saleData]) => {
        const orderList = Array.isArray(orderData) ? orderData : (orderData.data ?? orderData.orders ?? []);
        const saleList  = Array.isArray(saleData)  ? saleData  : (saleData.data  ?? saleData.sales  ?? []);

        const consolidatedIds = new Set(
          saleList
            .map(s => s.idPedido ?? s.pedido?.idPedido)
            .filter(Boolean),
        );

        const eligible = orderList.filter(o => {
          const stat = Number(o.id_estado_pedido ?? o.idEstado ?? 0);
          const oid  = o.idPedido ?? o.id_pedido;
          return (stat === 2 || stat === 4 || stat === 5) && !consolidatedIds.has(oid);
        });

        setSalesOrders(eligible);
        setInitLoaded(true);
      }).catch(err => {
        console.error("Error loading eligible orders:", err);
        setInitLoaded(true);
      }).finally(() => {
        setLoadingOrders(false);
      });
    } else if (win.type === "role-create" || win.type === "role-edit") {
      setLoadingPerms(true);
      const fetchList = [
        authFetch("/api/permissions").then(r => r.ok ? r.json() : [])
      ];

      if (win.type === "role-edit") {
        fetchList.push(
          authFetch("/api/role-permissions/").then(r => r.ok ? r.json() : [])
        );
      }

      Promise.all(fetchList)
        .then(([allPerms, assigned]) => {
          const perms = Array.isArray(allPerms) ? allPerms : (allPerms.data || allPerms.permissions || []);
          setAllSystemPermissions(perms);

          if (win.type === "role-edit" && assigned) {
            const assignedList = Array.isArray(assigned) ? assigned : (assigned.data || assigned.rolePermissions || []);
            const filtered = assignedList.filter(
              p => (p.idRol || p.id_rol || p.idrol) === win.data.id
            );
            const assignedIds = filtered
              .map(p => p.idPermiso || p.id_permiso || p.id)
              .filter(Boolean);
            
            updateWindowFormState(win.id, { 
              selectedPermIds: assignedIds,
              initialPermIds: assignedIds
            });
          }

          setInitLoaded(true);
        })
        .catch(err => {
          console.error("Error loading permissions for role form:", err);
          setInitLoaded(true);
        })
        .finally(() => {
          setLoadingPerms(false);
        });
    } else if (win.type === "permit-create" || win.type === "permit-edit" || win.type === "order-create" || win.type === "order-edit" || win.type === "return-create") {
      setInitLoaded(true);
    } else if (win.type === "route-create" || win.type === "route-edit") {
      setInitLoaded(false);
      Promise.all([
        authFetch("/api/zonas").then(r => r.ok ? r.json() : []),
        authFetch("/api/employees").then(r => r.ok ? r.json() : []),
        authFetch("/api/customers").then(r => r.ok ? r.json() : [])
      ]).then(([zonasData, empsData, custData]) => {
        const zoneList = Array.isArray(zonasData) ? zonasData : (zonasData.data || zonasData.zonas || []);
        setZonas(zoneList);

        const empList = Array.isArray(empsData) ? empsData : (empsData.data || empsData.empleados || []);
        const filteredEmpleados = empList
          .filter((emp) => {
            const roleId =
              emp.usuario?.idRol ||
              emp.usuario?.id_rol ||
              emp.usuario?.rol?.idRol ||
              emp.idRol ||
              emp.id_rol;
            return Number(roleId) === 3 || Number(roleId) === 2 || !roleId;
          })
          .map((emp) => ({
            ...emp,
            idEmpleado: emp.idEmpleado || emp.id_empleado || emp.idempleado || emp.id || emp.idEmployee,
          }));
        setEmployees(filteredEmpleados);

        const clientsList = Array.isArray(custData) ? custData : (custData.data || custData.customers || []);
        const normalizedClients = clientsList.map((c) => ({
          ...c,
          idCliente: c.idCliente || c.id_cliente || c.id || c.idCustomer,
        }));
        setCustomers(normalizedClients);

        setInitLoaded(true);
      }).catch(err => {
        console.error("Error loading route dependencies:", err);
        setInitLoaded(true);
      });
    } else if (win.type === "employee-create" || win.type === "employee-edit") {
      setInitLoaded(false);
      Promise.all([
        authFetch("/api/roles").then(r => r.ok ? r.json() : []),
        authFetch("/api/users").then(r => r.ok ? r.json() : []),
        authFetch("/api/customers").then(r => r.ok ? r.json() : []),
        authFetch("/api/employees").then(r => r.ok ? r.json() : [])
      ]).then(([roleData, userData, customerData, employeeData]) => {
        const rolesList = Array.isArray(roleData) ? roleData : (roleData.data || roleData.roles || []);
        const normRoles = rolesList.map(role => {
          const idRol = role.idRol ?? role.idrol ?? role.id_rol ?? role.rol?.idRol ?? role.rol?.idrol ?? role.rol?.id_rol;
          const nombreRol = role.nombreRol || role.nombrerol || role.nombre_rol || role.rol?.nombreRol || "Sin rol";
          return { ...role, idRol, nombreRol };
        });
        const filteredRoles = normRoles.filter(r => Number(r.idRol) !== 1 && Number(r.idRol) !== 4 && !r.nombreRol.toLowerCase().includes("cliente"));
        setRoles(filteredRoles);

        const custPayload = Array.isArray(customerData) ? customerData : (customerData.data || customerData.customers || []);
        const custEmails = new Set(custPayload.map(c => (c.email || c.correo || "").toLowerCase().trim()));

        const userPayload = Array.isArray(userData) ? userData : (userData.data || userData.users || []);
        const roleNameMap = normRoles.reduce((map, r) => {
          if (r.idRol) map[r.idRol.toString()] = r.nombreRol;
          return map;
        }, {});
        const normUsers = userPayload.map(user => {
          const idUsuario = user.idUsuario ?? user.idusuario ?? user.id_usuario ?? user.id;
          const nombreUsuario = user.nombreUsuario || user.nombreusuario || user.nombre_usuario || user.nombre || "";
          const idRol = user.idRol ?? user.idrol ?? user.id_rol ?? user.rol?.idRol;
          const nombreRol = user.nombreRol || user.nombrerol || user.nombre_rol || user.rol?.nombreRol || roleNameMap[idRol?.toString()] || "";
          return { ...user, idUsuario, nombreUsuario, idRol, nombreRol };
        });

        const filteredUsers = normUsers.filter((u) => {
          const userEmail = (u.email || u.correo || "").toLowerCase().trim();
          const roleId = u.idRol;
          const roleName = u.nombreRol.toLowerCase();
          const isNotACustomerEmail = !custEmails.has(userEmail);
          const hasRestrictedRole =
            Number(roleId) === 1 ||
            Number(roleId) === 4 ||
            roleName.includes("cliente") ||
            roleName.includes("proveedor") ||
            roleName.includes("externo");
          const hasExternalLink =
            (u.idProveedor && u.idProveedor !== 0) ||
            (u.id_proveedor && u.id_proveedor !== 0);

          return isNotACustomerEmail && !hasRestrictedRole && !hasExternalLink;
        });
        setAvailableUsers(filteredUsers);

        const empPayload = Array.isArray(employeeData) ? employeeData : (employeeData.data || employeeData.employees || []);
        const usedIds = empPayload.map(e => e.idUsuario ?? e.idusuario ?? e.id_usuario).filter(id => id !== null && id !== undefined);
        setUsedUserIds(usedIds);

        setInitLoaded(true);
      }).catch(err => {
        console.error("Error loading employee dependencies:", err);
        setInitLoaded(true);
      });
    } else if (win.type === "product-create" || win.type === "product-edit") {
      authFetch("/api/categories")
        .then(r => r.ok ? r.json() : [])
        .then(data => {
          const list = Array.isArray(data) ? data : (data.data || data.categories || []);
          setProductCategories(list);
          setInitLoaded(true);
        })
        .catch(err => {
          console.error("Error loading categories for product form:", err);
          setInitLoaded(true);
        });
    } else if (win.type === "credit-create") {
      setInitLoaded(false);
      Promise.all([
        authFetch("/api/customers").then(r => r.ok ? r.json() : []),
        authFetch("/api/credits").then(r => r.ok ? r.json() : [])
      ]).then(([custData, creditsData]) => {
        const getListFrom = (payload) => {
          if (Array.isArray(payload)) return payload;
          if (Array.isArray(payload?.data)) return payload.data;
          if (Array.isArray(payload?.customers)) return payload.customers;
          if (Array.isArray(payload?.content)) return payload.content;
          return [];
        };
        const normalizeCustomer = (c) => {
          const idCliente = c.idCliente ?? c.id_cliente ?? c.id;
          return {
            ...c,
            idCliente,
            displayName: c.razonSocial ?? c.razon_social ?? c.clienteNombre ?? c.nombre ?? `Cliente #${idCliente}`,
            documento: c.numeroDocumento ?? c.numero_documento ?? "",
            email: c.email ?? c.correo ?? "",
            activo: c.idEstado === 1 || c.id_estado === 1 || c.activo === true || c.activo === 1,
          };
        };
        const activeCustomers = getListFrom(custData).map(normalizeCustomer).filter(c => c.activo);
        const creditsList = Array.isArray(creditsData) ? creditsData : (creditsData?.data ?? []);
        const creditedIds = creditsList.map(cr => cr.idCliente ?? cr.id_cliente).filter(Boolean);

        setCustomers(activeCustomers);
        setUsedUserIds(creditedIds);
        setInitLoaded(true);
      }).catch(err => {
        console.error("Error loading credit dependencies:", err);
        setInitLoaded(true);
      });
    } else if (
      win.type === "credit-edit" ||
      win.type === "compra-create" ||
      win.type === "category-create" ||
      win.type === "category-edit" ||
      win.type === "area-create" ||
      win.type === "area-edit" ||
      win.type === "abono-create"
    ) {
      setInitLoaded(true);



    } else {

      Promise.all([
        authFetch("/api/zonas").then(r => r.ok ? r.json() : []),
        authFetch("/api/departments").then(r => r.ok ? r.json() : [])
      ]).then(([zonasData, deptsData]) => {
        setZonas(Array.isArray(zonasData) ? zonasData : zonasData.data || []);
        setDepartments(Array.isArray(deptsData) ? deptsData : deptsData.data || []);
        setInitLoaded(true);
      }).catch(err => {
        console.error("Error loading form dependency data:", err);
        setInitLoaded(true);
      });
    }
  }, [win.type]);

  const handleFormChange = (fields) => {
    updateWindowFormState(win.id, fields);
  };

  const handleSelectChange = (name, value) => {
    updateWindowFormState(win.id, { [name]: value });
  };

  const handleFileChange = (file) => {
    updateWindowFormState(win.id, { selectedFile: file });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let url = "";
      let method = "";
      let payload = {};

      if (win.type === "customer-create" || win.type === "customer-edit") {
        payload = {
          idTipoDocumento: parseInt(currentFormState.idTipoDocumento),
          numeroDocumento: currentFormState.numeroDocumento.trim(),
          razonSocial: currentFormState.razonSocial.trim(),
          personaContacto: currentFormState.personaContacto?.trim() || null,
          direccion: currentFormState.direccion?.trim(),
          telefono: currentFormState.telefono?.trim(),
          email: currentFormState.email?.trim(),
          tipoCliente: currentFormState.tipoCliente,
          cupoCredito: currentFormState.cupoCredito ? parseFloat(currentFormState.cupoCredito) : 0,
          idZona: currentFormState.idZona ? parseInt(currentFormState.idZona) : null,
          idDepartamento: currentFormState.idDepartamento ? parseInt(currentFormState.idDepartamento) : null,
          idMunicipio: currentFormState.idMunicipio ? parseInt(currentFormState.idMunicipio) : null,
          idEstado: win.type === "customer-create" ? 1 : currentFormState.idEstado || 1,
        };

        url = win.type === "customer-create" 
          ? "/api/customers" 
          : `/api/customers/${win.data.idCliente || win.data.id}`;
        
        method = win.type === "customer-create" ? "POST" : "PUT";
      } else if (win.type === "user-create" || win.type === "user-edit") {
        payload = {
          nombreUsuario: currentFormState.nombreUsuario,
          nombreusuario: currentFormState.nombreUsuario,
          email: currentFormState.email,
          idRol: parseInt(currentFormState.id_rol, 10),
          idrol: parseInt(currentFormState.id_rol, 10),
          id_rol: parseInt(currentFormState.id_rol, 10),
          idEstado: parseInt(currentFormState.id_estado, 10) || 1,
          idestado: parseInt(currentFormState.id_estado, 10) || 1,
          id_estado: parseInt(currentFormState.id_estado, 10) || 1,
        };

        if (win.type === "user-create") {
          payload.password = currentFormState.password;
          url = "/api/users/register";
          method = "POST";
        } else {
          const selectedUserId = win.data.idUsuario ?? win.data.idusuario ?? win.data.id;
          url = `/api/users/${selectedUserId}`;
          method = "PUT";
        }
      } else if (win.type === "supplier-create" || win.type === "supplier-edit") {
        payload = {
          id_tipo_documento: parseInt(currentFormState.id_tipo_documento),
          numero_documento: currentFormState.numero_documento.trim(),
          nombre_empresa: currentFormState.nombre_empresa.trim(),
          contacto: currentFormState.contacto.trim(),
          telefono: currentFormState.telefono.trim(),
          email: currentFormState.email.trim(),
          direccion: currentFormState.direccion.trim(),
          condiciones_comerciales: currentFormState.condiciones_comerciales || "",
          id_estado: parseInt(currentFormState.id_estado) || 1,
          id_departamento: currentFormState.id_departamento ? parseInt(currentFormState.id_departamento) : null,
          id_municipio: currentFormState.id_municipio ? parseInt(currentFormState.id_municipio) : null,
        };

        if (win.type === "supplier-create") {
          url = "/api/suppliers";
          method = "POST";
        } else {
          url = `/api/suppliers/${win.data.id}`;
          method = "PUT";
        }
      } else if (win.type === "sale-create") {
        const selectedOrder = salesOrders.find(o => String(o.idPedido ?? o.id_pedido) === String(currentFormState.idPedido));
        payload = {
          idPedido: selectedOrder.idPedido ?? selectedOrder.id_pedido,
          idFormaPago: Number(currentFormState.idFormaPago),
          totalVenta: parseFloat(selectedOrder.total_neto || selectedOrder.total || 0),
        };
        url = "/api/sales";
        method = "POST";
      } else if (win.type === "role-create" || win.type === "role-edit") {
        payload = {
          nombreRol: currentFormState.nombreRol.trim(),
          descripcion: currentFormState.descripcion.trim(),
          idEstado: win.type === "role-create" ? 1 : parseInt(win.data.idEstado || 1, 10),
        };
        if (win.type === "role-edit") {
          payload.idRol = win.data.id;
        }

        url = win.type === "role-create"
          ? "/api/roles"
          : `/api/roles/${win.data.id}`;

        method = win.type === "role-create" ? "POST" : "PUT";
      } else if (win.type === "permit-create" || win.type === "permit-edit") {
        payload = {
          nombrePermiso: currentFormState.nombrePermiso.trim(),
          modulo: currentFormState.modulo.trim(),
          categoria: currentFormState.categoria.trim(),
          descripcion: currentFormState.descripcion.trim(),
          idEstado: win.type === "permit-create" ? 1 : parseInt(win.data.idEstado || 1, 10),
        };

        url = win.type === "permit-create"
          ? "/api/permissions"
          : `/api/permissions/${win.data.idPermiso || win.data.id}`;

        method = win.type === "permit-create" ? "POST" : "PUT";
      } else if (win.type === "product-create" || win.type === "product-edit") {
        const imageFile = currentFormState.selectedFile || null;
        payload = toProductFormData(currentFormState, imageFile);

        url = win.type === "product-create"
          ? "/api/products"
          : `/api/products/${win.data.idProducto || win.data.id_producto || win.data.id}`;

        method = win.type === "product-create" ? "POST" : "PUT";
      } else if (win.type === "order-create" || win.type === "order-edit") {
        const detalles = Array.isArray(currentFormState.detalles) ? currentFormState.detalles : [];
        const subtotal = detalles.reduce(
          (acc, curr) => acc + (Number(curr.cantidad || 0) * Number(curr.precio_unitario || 0)),
          0
        );
        const descuentos = detalles.reduce((acc, curr) => {
          const base = Number(curr.cantidad || 0) * Number(curr.precio_unitario || 0);
          const pct = Math.min(Math.max(Number(curr.descuento_porcentaje || 0), 0), 100);
          return acc + (base * pct / 100);
        }, 0);
        const subtotalNeto = Math.max(subtotal - descuentos, 0);
        const impuestos = subtotalNeto * 0.19;
        const totalCalculado = subtotalNeto + impuestos;

        if (win.type === "order-create") {
          payload = {
            id_cliente: parseInt(currentFormState.id_cliente, 10),
            id_vendedor: parseInt(currentFormState.id_vendedor, 10),
            id_origen_pedido: parseInt(currentFormState.id_origen_pedido, 10) || 1,
            id_estado_pedido: 1,
            subtotal: parseFloat(subtotal.toFixed(2)),
            impuestos: parseFloat(impuestos.toFixed(2)),
            descuentos: parseFloat(descuentos.toFixed(2)),
            notas: currentFormState.notas || "",
            total_neto: parseFloat(totalCalculado.toFixed(2)),
            tipo_pago: currentFormState.tipo_pago || "Efectivo",
            detalles: currentFormState.detalles.map(d => ({
              id_producto: d.id_producto,
              cantidad: Number(d.cantidad),
              precio_unitario: parseFloat(d.precio_unitario),
              descuento_porcentaje: Math.min(Math.max(Number(d.descuento_porcentaje || 0), 0), 100)
            })),
          };
          url = "/api/orders";
          method = "POST";
        } else {
          const originalDetails = Array.isArray(win.data.detalles) ? win.data.detalles : [];
          const detailsChanged = !areDetailsEqual(detalles, originalDetails);
          const idVendedor =
            parseInt(currentFormState.id_vendedor, 10) ||
            win.data.id_vendedor ||
            win.data.idVendedor;

          const detallesPayload = detalles.map((detalle) => {
            const cantidad = Number(detalle.cantidad ?? detalle.cantidad_solicitada ?? 0);
            const precio = Number(detalle.precio_unitario ?? detalle.precio_venta ?? 0);
            const descuentoPorcentaje = Math.min(Math.max(Number(detalle.descuento_porcentaje ?? 0), 0), 100);
            const descuento = (cantidad * precio) * descuentoPorcentaje / 100;
            const subtotalLinea = Math.max(cantidad * precio - descuento, 0);
            const producto = detalle.producto || {};
            const idProducto =
              detalle.id_producto ||
              detalle.idProducto ||
              producto.id_producto ||
              producto.idProducto ||
              producto.id;

            return {
              ...detalle,
              id_producto: idProducto,
              cantidad,
              cantidad_solicitada: cantidad,
              precio_unitario: precio,
              precio_venta: precio,
              descuento_porcentaje: descuentoPorcentaje,
              descuento_aplicado: descuento,
              subtotal_linea: parseFloat(subtotalLinea.toFixed(2)),
              producto: {
                ...producto,
                id_producto: idProducto,
                referencia: detalle.codigo || producto.referencia || detalle.referenciaProducto || "",
                nombre: detalle.nombreProducto || producto.nombre || "",
              },
            };
          }).filter((detalle) => detalle.id_producto);

          payload = {
            id_cliente: parseInt(currentFormState.id_cliente, 10) || win.data.id_cliente,
            id_vendedor: idVendedor,
            nombreCliente: currentFormState.nombreCliente,
            nombreVendedor: currentFormState.nombreVendedor,
            id_origen_pedido: parseInt(currentFormState.id_origen_pedido, 10),
            id_estado_pedido: parseInt(currentFormState.id_estado_pedido, 10) || 1,
            total_neto: parseFloat(totalCalculado.toFixed(2)),
            tipo_pago: currentFormState.tipo_pago,
            notas: currentFormState.notas || "",
            cliente: {
              ...(win.data.cliente || {}),
              razonSocial: currentFormState.nombreCliente,
              numeroDocumento: currentFormState.numeroDocumento,
              telefono: currentFormState.telefono,
              email: currentFormState.email,
              direccion: currentFormState.direccion,
              tipoCliente: currentFormState.tipoCliente,
            },
          };

          if (detailsChanged) {
            payload.subtotal = parseFloat(subtotal.toFixed(2));
            payload.descuentos = parseFloat(descuentos.toFixed(2));
            payload.impuestos = parseFloat(impuestos.toFixed(2));
            payload.detalles = detallesPayload;
          }

          url = `/api/orders/${win.data.idPedido || win.data.id_pedido}`;
          method = "PUT";
        }
      } else if (win.type === "route-create" || win.type === "route-edit") {
        const detallesFormateados = (currentFormState.detalles || []).map((d) => ({
          idCliente: d.idCliente,
          idPedido: d.idPedido || null,
          estadoVisita: d.estadoVisita || "Pendiente",
        }));

        payload = {
          nombreRuta: currentFormState.nombreRuta,
          idZona: parseInt(currentFormState.idZona),
          idEmpleado: currentFormState.idEmpleado ? parseInt(currentFormState.idEmpleado) : null,
          fechaPlanificada: currentFormState.fechaPlanificada,
          idEstadoRuta: win.type === "route-create" ? 1 : win.data.idEstadoRuta || 1,
          detalles: detallesFormateados,
        };

        if (win.type === "route-create") {
          url = "/api/rutas";
          method = "POST";
        } else {
          url = `/api/rutas/${win.data.idRuta || win.data.id}`;
          method = "PUT";
        }
      } else if (win.type === "employee-create" || win.type === "employee-edit") {
        payload = {
          idTipoDocumento: parseInt(currentFormState.idTipoDocumento, 10),
          numeroDocumento: currentFormState.numeroDocumento,
          nombre: currentFormState.nombre?.trim(),
          apellido: currentFormState.apellido?.trim(),
          telefono: currentFormState.telefono?.trim(),
          rolOperativo: currentFormState.rolOperativo,
          idUsuario: currentFormState.idUsuario ? parseInt(currentFormState.idUsuario, 10) : null,
          disponibilidad: currentFormState.disponibilidad === true || currentFormState.disponibilidad === 1,
          idEstado: parseInt(currentFormState.idEstado ?? currentFormState.id_estado, 10) || 1,
        };

        if (win.type === "employee-create") {
          url = "/api/employees";
          method = "POST";
        } else {
          url = `/api/employees/${win.data.idEmpleado || win.data.id_empleado || win.data.id}`;
          method = "PUT";
        }
      } else if (win.type === "return-create") {
        const currentUser = getCurrentUser() || {};
        payload = {
          idCliente: parseInt(currentFormState.idCliente, 10),
          clienteNombre: currentFormState.clienteNombre,
          numeroDocumento: currentFormState.numeroDocumento,
          idPedido: parseInt(currentFormState.idPedido, 10),
          idVenta: parseInt(currentFormState.idVenta, 10),
          totalAjuste: currentFormState.totalAjuste,
          subtotal: currentFormState.subtotal,
          iva: currentFormState.iva,
          motivo: currentFormState.motivo,
          registradoPor: currentUser.nombre || currentUser.nombreUsuario || "Admin Usuario",
          detalles: (currentFormState.detalles || [])
            .filter(it => it.cantDevolver > 0)
            .map(it => ({
              idProducto: it.idProducto,
              nombreProducto: it.nombreProducto,
              cantidadDevuelta: it.cantDevolver,
              precioUnitario: it.precioUnitario,
              subtotalLinea: it.cantDevolver * it.precioUnitario
            })),
        };
        url = "/api/returns";
        method = "POST";
      } else if (win.type === "credit-create" || win.type === "credit-edit") {
        payload = {
          cupoAprobado: Number(currentFormState.cupoAprobado),
        };
        if (win.type === "credit-create") {
          payload.idCliente = Number(currentFormState.idCliente);
          url = "/api/credits";
          method = "POST";
        } else {
          payload.idEstado = Number(currentFormState.idEstado);
          url = `/api/credits/${win.data.idCredito}`;
          method = "PUT";
        }
      } else if (win.type === "compra-create") {
        let id_empleado = 1;
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

        const subtotal = (currentFormState.detalles || []).reduce((acc, curr) => acc + Number(curr.total || 0), 0);
        const total = subtotal * 1.19;

        payload = {
          id_proveedor: parseInt(currentFormState.idProveedor, 10) || 0,
          id_empleado: parseInt(id_empleado, 10) || 1,
          id_estado_compra: 1,
          total: parseFloat(total) || 0,
          productos: (currentFormState.detalles || []).map(item => ({
            id_producto: parseInt(item.idProducto ?? item.id_producto ?? item.id, 10) || 0,
            cantidad: parseInt(item.cantidad, 10) || 0,
            costo_unitario: parseFloat(item.precioUnitario ?? item.costoUnitario ?? item.costo_unitario ?? 0) || 0
          }))
        };
        url = "/api/shopping";
        method = "POST";
      } else if (win.type === "category-create" || win.type === "category-edit") {
        payload = {
          nombre_categoria: currentFormState.nombre_categoria.trim(),
          descripcion: currentFormState.descripcion.trim(),
        };
        if (win.type === "category-create") {
          url = "/api/categories";
          method = "POST";
        } else {
          payload.id_estado = parseInt(currentFormState.id_estado, 10) || 1;
          url = `/api/categories/${win.data.id ?? win.data.id_categoria}`;
          method = "PUT";
        }
      } else if (win.type === "area-create" || win.type === "area-edit") {
        payload = {
          nombre_zona: currentFormState.nombreZona.trim(),
          descripcion: currentFormState.descripcion.trim(),
        };
        if (win.type === "area-create") {
          payload.id_estado = 1;
          url = "/api/zonas";
          method = "POST";
        } else {
          payload.id_estado = parseInt(currentFormState.idEstado, 10) || 1;
          url = `/api/zonas/${win.data.id ?? win.data.id_zona ?? win.data.idZona}`;
          method = "PUT";
        }
      } else if (win.type === "abono-create") {
        let currentUser = null;
        try {
          const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
          if (userStr) currentUser = JSON.parse(userStr);
        } catch (e) {}

        payload = {
          id_cliente: parseInt(currentFormState.idCliente, 10),
          id_credito: currentFormState.idCredito ? parseInt(currentFormState.idCredito, 10) : null,
          id_pedido: parseInt(currentFormState.idPedido, 10),
          monto_abono: parseFloat(currentFormState.montoAbono),
          tipo_abono: currentFormState.tipoAbono,
          metodo_pago: currentFormState.metodoPago,
          referencia: currentFormState.referencia || "N/A",
          descripcion: currentFormState.descripcion || "Registro de abono a balance",
          id_usuario: currentUser?.idUsuario || 1
        };
        url = "/api/abonos";
        method = "POST";
      }





      const res = await authFetch(url, {
        method,
        body: payload instanceof FormData ? payload : JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.message || errData?.error || "Error al procesar la solicitud");
      }

      if (win.type === "role-create" || win.type === "role-edit") {
        const result = await res.json();
        const roleId = win.type === "role-create"
          ? (result.idRol || result.id || (result.data && (result.data.idRol || result.data.id)))
          : win.data.id;

        if (!roleId) {
          throw new Error("No se pudo obtener el ID del rol procesado.");
        }

        const selectedPermIds = currentFormState.selectedPermIds || [];

        if (win.type === "role-create") {
          if (selectedPermIds.length > 0) {
            const assignPromises = selectedPermIds.map((permId) =>
              authFetch("/api/role-permissions/assign", {
                method: "POST",
                body: JSON.stringify({
                  idRol: Number(roleId),
                  idPermiso: Number(permId),
                }),
              })
            );
            await Promise.all(assignPromises);
          }
        } else {
          const initialPermIds = currentFormState.initialPermIds || [];
          const idsToAdd = selectedPermIds.filter(id => !initialPermIds.includes(id));
          const idsToRemove = initialPermIds.filter(id => !selectedPermIds.includes(id));

          if (idsToRemove.length > 0) {
            await Promise.all(
              idsToRemove.map((permId) =>
                authFetch(`/api/role-permissions/revoke`, {
                  method: "DELETE",
                  body: JSON.stringify({
                    idRol: Number(roleId),
                    idPermiso: Number(permId),
                  }),
                })
              )
            );
          }

          if (idsToAdd.length > 0) {
            await Promise.all(
              idsToAdd.map((permId) =>
                authFetch("/api/role-permissions/assign", {
                  method: "POST",
                  body: JSON.stringify({
                    idRol: Number(roleId),
                    idPermiso: Number(permId),
                  }),
                })
              )
            );
          }
        }
      }

      if (win.type === "customer-create" || win.type === "customer-edit") {
        const title = win.type === "customer-create" ? "Cliente registrado" : "Cliente actualizado";
        const message = win.type === "customer-create"
          ? `Cliente "${payload.razonSocial}" registrado con éxito`
          : "Cambios del cliente guardados con éxito";
        window.dispatchEvent(new CustomEvent("customer-changed", { detail: { title, message } }));
      } else if (win.type === "user-create" || win.type === "user-edit") {
        const title = win.type === "user-create" ? "Usuario registrado" : "Usuario actualizado";
        const message = win.type === "user-create"
          ? `Usuario "${payload.nombreUsuario}" registrado con éxito`
          : "Cambios del usuario guardados con éxito";
        window.dispatchEvent(new CustomEvent("user-changed", { detail: { title, message } }));
      } else if (win.type === "supplier-create" || win.type === "supplier-edit") {
        const title = win.type === "supplier-create" ? "Proveedor registrado" : "Proveedor actualizado";
        const message = win.type === "supplier-create"
          ? `Proveedor "${payload.nombre_empresa}" registrado con éxito`
          : "Cambios del proveedor guardados con éxito";
        window.dispatchEvent(new CustomEvent("supplier-changed", { detail: { title, message } }));
      } else if (win.type === "sale-create") {
        window.dispatchEvent(new CustomEvent("sale-changed", { detail: { title: "Venta consolidada", message: "Venta consolidada con éxito" } }));
      } else if (win.type === "role-create" || win.type === "role-edit") {
        const title = win.type === "role-create" ? "Rol registrado" : "Rol actualizado";
        const message = win.type === "role-create"
          ? `Rol "${payload.nombreRol}" registrado con éxito`
          : "Cambios del rol guardados con éxito";
        window.dispatchEvent(new CustomEvent("role-changed", { detail: { title, message } }));
      } else if (win.type === "product-create" || win.type === "product-edit") {
        const title = win.type === "product-create" ? "Producto registrado" : "Producto actualizado";
        const message = win.type === "product-create"
          ? `Producto "${currentFormState.nombre}" registrado con éxito`
          : "Cambios del producto guardados con éxito";
        window.dispatchEvent(new CustomEvent("product-changed", { detail: { title, message } }));
      } else if (win.type === "permit-create" || win.type === "permit-edit") {
        const title = win.type === "permit-create" ? "Permiso registrado" : "Permiso actualizado";
        const message = win.type === "permit-create"
          ? `Permiso "${payload.nombrePermiso}" registrado con éxito`
          : "Cambios del permiso guardados con éxito";
        window.dispatchEvent(new CustomEvent("permit-changed", { detail: { title, message } }));
      } else if (win.type === "order-create" || win.type === "order-edit") {
        const title = win.type === "order-create" ? "Pedido registrado" : "Pedido actualizado";
        const message = win.type === "order-create"
          ? "Pedido registrado con éxito"
          : "Cambios del pedido guardados con éxito";
        window.dispatchEvent(new CustomEvent("order-changed", { detail: { title, message } }));
      } else if (win.type === "route-create" || win.type === "route-edit") {
        const title = win.type === "route-create" ? "Ruta registrada" : "Ruta guardada";
        const message = win.type === "route-create"
          ? `Ruta "${payload.nombreRuta}" registrada con éxito`
          : `Ruta "${payload.nombreRuta}" guardada con éxito`;
        window.dispatchEvent(new CustomEvent("route-changed", { detail: { title, message } }));
      } else if (win.type === "employee-create" || win.type === "employee-edit") {
        const title = win.type === "employee-create" ? "Empleado registrado" : "Empleado actualizado";
        const message = win.type === "employee-create"
          ? `Empleado "${payload.nombre}" registrado con éxito`
          : `Cambios del empleado "${payload.nombre}" guardados con éxito`;
        window.dispatchEvent(new CustomEvent("employee-changed", { detail: { title, message } }));
      } else if (win.type === "return-create") {
        const result = await res.json().catch(() => ({}));
        const message = `Se ha registrado el reingreso de mercancía y generado un saldo a favor de $${(payload.totalAjuste || 0).toLocaleString()}.`;
        window.dispatchEvent(new CustomEvent("return-changed", { detail: { title: "Reingreso registrado", message } }));
        if (result && result.pdfUrl) {
          window.open(result.pdfUrl, "_blank");
        }
      } else if (win.type === "credit-create" || win.type === "credit-edit") {
        const title = win.type === "credit-create" ? "Crédito asignado" : "Crédito actualizado";
        const message = win.type === "credit-create"
          ? "Crédito asignado con éxito"
          : "Crédito actualizado correctamente";
        window.dispatchEvent(new CustomEvent("credit-changed", { detail: { title, message } }));
      } else if (win.type === "compra-create") {
        window.dispatchEvent(new CustomEvent("compra-changed", { detail: { title: "Compra registrada", message: "¡Compra Registrada con Éxito!" } }));
      } else if (win.type === "category-create" || win.type === "category-edit") {
        const title = win.type === "category-create" ? "Categoría registrada" : "Categoría actualizada";
        const message = win.type === "category-create"
          ? `Categoría "${payload.nombre_categoria}" registrada con éxito`
          : "Cambios de la categoría guardados con éxito";
        window.dispatchEvent(new CustomEvent("category-changed", { detail: { title, message } }));
      } else if (win.type === "area-create" || win.type === "area-edit") {
        const title = win.type === "area-create" ? "Zona registrada" : "Zona actualizada";
        const message = win.type === "area-create"
          ? `Zona "${payload.nombre_zona}" registrada con éxito`
          : "Cambios de la zona guardados con éxito";
        window.dispatchEvent(new CustomEvent("area-changed", { detail: { title, message } }));
      } else if (win.type === "abono-create") {
        window.dispatchEvent(new CustomEvent("abono-changed", { detail: { title: "Recaudo aplicado", message: "Recaudo Aplicado Correctamente" } }));
      }





      onClose();
    } catch (err) {
      toast.error(err.message || "Error al conectar con el servidor.");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedOrderForSale = win.type === "sale-create" 
    ? salesOrders.find(o => String(o.idPedido ?? o.id_pedido) === String(currentFormState.idPedido)) 
    : null;
  const canSaveSale = win.type === "sale-create" 
    ? !!currentFormState.idPedido && !!currentFormState.idFormaPago 
    : win.type.endsWith("-edit")
    ? isFormValid && (
        initialFormSnapshot.current === null ||
        JSON.stringify(currentFormState) !== initialFormSnapshot.current
      )
    : isFormValid;

  if (!initLoaded) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        <span className="text-xs text-slate-500 dark:text-zinc-400">Preparando formulario...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full justify-between">
      <div className="p-5 overflow-y-auto max-h-[420px] flex-1">
        {win.type.startsWith("customer-") ? (
          <CustomerForm
            formData={currentFormState}
            onChange={handleFormChange}
            onValidityChange={setIsFormValid}
            zonas={zonas}
            departments={departments}
            authFetch={authFetch}
            isEditing={win.type === "customer-edit"}
          />
        ) : win.type.startsWith("user-") ? (
          <UserForm
            formData={currentFormState}
            onChange={handleFormChange}
            onSelectChange={handleSelectChange}
            onValidityChange={setIsFormValid}
            listaRoles={roles}
            isEditing={win.type === "user-edit"}
          />
        ) : win.type.startsWith("supplier-") ? (
          <SupplierForm
            formData={currentFormState}
            onChange={handleFormChange}
            onValidityChange={setIsFormValid}
            isEditing={win.type === "supplier-edit"}
            canEditIdentity={isMasterUser(getCurrentUser())}
          />
        ) : win.type === "sale-create" ? (
          <div className="space-y-6">
            {/* 1. Selección de Pedido */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-zinc-350 uppercase tracking-wider">
                <ShoppingCart className="h-4 w-4 text-blue-500" />
                1. Seleccionar Pedido de Referencia
              </label>
              <select 
                onChange={(e) => handleFormChange({ idPedido: e.target.value })} 
                value={currentFormState.idPedido || ""}
                className="w-full h-11 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white px-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{loadingOrders ? "Cargando pedidos..." : "Busca un pedido entregado o pagado"}</option>
                {salesOrders.map(o => (
                  <option key={o.idPedido ?? o.id_pedido} value={String(o.idPedido ?? o.id_pedido)}>
                    PED-{String(o.idPedido ?? o.id_pedido).padStart(3, '0')} — {
                      o.nombreCliente ||
                      o.clienteNombre ||
                      o.cliente?.razonSocial ||
                      o.cliente?.nombre ||
                      o.cliente?.nombreCliente ||
                      (o.idCliente ? `Cliente #${o.idCliente}` : "Cliente General")
                    } (${parseFloat(o.total_neto || 0).toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            {/* Info del Pedido Seleccionado */}
            {selectedOrderForSale && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-850 space-y-3 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-emerald-500" />
                    <span className="text-xs font-bold text-slate-600 dark:text-zinc-300 uppercase tracking-tighter">Cliente</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/30 text-[10px] font-black text-blue-700 dark:text-blue-400 uppercase">
                    {selectedOrderForSale.numeroFactura || `PED-${selectedOrderForSale.idPedido}`}
                  </span>
                </div>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-base">
                  {selectedOrderForSale.clienteNombre || selectedOrderForSale.nombreCliente || selectedOrderForSale.cliente?.razonSocial || selectedOrderForSale.cliente?.nombre || "Consumidor Final"}
                </p>
                <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 flex justify-between items-baseline">
                  <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">Monto a Consolidar:</span>
                  <span className="text-xl font-black text-slate-900 dark:text-white">
                    ${parseFloat(selectedOrderForSale.total_neto || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* 2. Método de Pago */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-zinc-350 uppercase tracking-wider">
                <Wallet className="h-4 w-4 text-amber-500" />
                2. Definir Método de Pago
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 1, label: "Efectivo", icon: Wallet },
                  { id: 2, label: "Transferencia Bancaria", icon: Landmark },
                  { id: 3, label: "Tarjeta Débito/Crédito", icon: CreditCard },
                  { id: 4, label: "Crédito Interno", icon: Receipt },
                ].map((method) => {
                  const Icon = method.icon;
                  const isSelected = String(currentFormState.idFormaPago) === String(method.id);
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => handleFormChange({ idFormaPago: String(method.id) })}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-200 ${
                        isSelected 
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 shadow-sm" 
                          : "border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 text-slate-500 dark:text-zinc-400 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className="h-5 w-5 mb-1.5" />
                      <span className="text-[10px] font-bold text-center leading-tight">{method.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mensaje de Confirmación Final */}
            {selectedOrderForSale && currentFormState.idFormaPago && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <p className="text-[10px] font-medium leading-normal">
                  Al confirmar, se generará el registro oficial de venta y el reporte correspondiente. El stock ya fue descontado en el despacho.
                </p>
              </div>
            )}
          </div>
        ) : win.type.startsWith("role-") ? (
          <RolForm
            formData={currentFormState}
            onChange={handleFormChange}
            onValidityChange={setIsFormValid}
            isEditing={win.type === "role-edit"}
            allPermissions={allSystemPermissions}
            loadingPerms={loadingPerms}
          />
        ) : win.type.startsWith("product-") ? (
          <ProductForm
            formData={currentFormState}
            onChange={handleFormChange}
            onFileChange={handleFileChange}
            onValidityChange={setIsFormValid}
            listaCategorias={productCategories}
            isEditing={win.type === "product-edit"}
            product={win.data}
            preview={preview}
            setPreview={setPreview}
          />
        ) : win.type.startsWith("permit-") ? (
          <PermitForm
            formData={currentFormState}
            onChange={handleFormChange}
            onValidityChange={setIsFormValid}
            isEditing={win.type === "permit-edit"}
          />
        ) : win.type.startsWith("order-") ? (
          <PedidoForm
            formData={currentFormState}
            setFormData={(val) => {
              if (typeof val === "function") {
                updateWindowFormState(win.id, val(currentFormState));
              } else {
                updateWindowFormState(win.id, val);
              }
            }}
            onValidityChange={setIsFormValid}
            isEditing={win.type === "order-edit"}
            pedido={win.type === "order-edit" ? win.data : null}
          />
        ) : win.type.startsWith("route-") ? (
          <RouteForm
            formData={currentFormState}
            onChange={(updatedData) => handleFormChange(updatedData)}
            onSelectChange={handleSelectChange}
            onValidityChange={setIsFormValid}
            listaZonas={zonas}
            listaEmpleados={employees}
            listaClientes={customers}
          />
        ) : win.type.startsWith("employee-") ? (
          <EmployeeForm
            formData={currentFormState}
            onChange={(updatedData) => handleFormChange(updatedData)}
            onSelectChange={handleSelectChange}
            onValidityChange={setIsFormValid}
            roles={roles}
            availableUsers={availableUsers}
            usedUserIds={usedUserIds}
            isEditing={win.type === "employee-edit"}
            canEditIdentity={isMasterUser(getCurrentUser())}
          />
        ) : win.type === "return-create" ? (
          <ReturnForm
            formData={currentFormState}
            onChange={(updatedData) => handleFormChange(updatedData)}
            onValidityChange={setIsFormValid}
          />
        ) : win.type === "credit-create" || win.type === "credit-edit" ? (
          <CreditForm
            formData={currentFormState}
            onChange={(updatedData) => handleFormChange(updatedData)}
            onValidityChange={setIsFormValid}
            isEditing={win.type === "credit-edit"}
            item={win.type === "credit-edit" ? win.data : null}
            customers={customers}
            creditedIds={usedUserIds}
          />
        ) : win.type === "compra-create" ? (
          <CompraForm
            formData={currentFormState}
            onChange={(updatedData) => handleFormChange(updatedData)}
            onValidityChange={setIsFormValid}
          />
        ) : win.type === "category-create" || win.type === "category-edit" ? (
          <CategoryForm
            formData={currentFormState}
            onChange={(updatedData) => handleFormChange(updatedData)}
            onValidityChange={setIsFormValid}
            isEditing={win.type === "category-edit"}
          />
        ) : win.type === "area-create" || win.type === "area-edit" ? (
          <AreaForm
            formData={currentFormState}
            onChange={(updatedData) => handleFormChange(updatedData)}
            onValidityChange={setIsFormValid}
            isEditing={win.type === "area-edit"}
            zone={win.type === "area-edit" ? win.data : null}
          />
        ) : win.type === "abono-create" ? (
          <AbonoForm
            formData={currentFormState}
            onChange={(updatedData) => handleFormChange(updatedData)}
            onValidityChange={setIsFormValid}
          />
        ) : null}




      </div>

      {/* Pie de ventana de acciones */}
      <div className="flex justify-end gap-2 px-5 py-3 bg-slate-50 dark:bg-zinc-950/80 border-t border-slate-100 dark:border-zinc-800">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={!canSaveSale || isSaving}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1.5"
        >
          {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save size={14} />}
          Guardar
        </button>
      </div>
    </div>
  );
};


// ── Ventana Flotante Arrastrable (Draggable Window) ──────────────────────────
const FloatingWindow = ({ win }) => {
  const { focusWindow, updateWindowPosition, minimizeWindow, closeWindow } = useModalDock();
  const windowRef = useRef(null);

  const handleMouseDown = (e) => {
    if (e.target.closest(".win-action-btn")) return;
    
    focusWindow(win.id);
    
    const startX = e.clientX - win.position.x;
    const startY = e.clientY - win.position.y;

    const handleMouseMove = (moveEvent) => {
      const newX = Math.max(0, Math.min(moveEvent.clientX - startX, window.innerWidth - 150));
      const newY = Math.max(0, Math.min(moveEvent.clientY - startY, window.innerHeight - 100));
      
      updateWindowPosition(win.id, { x: newX, y: newY });
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  if (win.isMinimized) return null;

  return (
    <div
      ref={windowRef}
      style={{
        left: win.position.x,
        top: win.position.y,
        width: win.size.width,
        zIndex: win.zIndex,
      }}
      onClick={() => focusWindow(win.id)}
      className="fixed bg-white/95 dark:bg-zinc-900/95 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col backdrop-blur-md transition-shadow focus-within:ring-2 focus-within:ring-blue-500/20"
    >
      {/* Cabecera de la ventana */}
      <div
        onMouseDown={handleMouseDown}
        className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-50 to-white dark:from-zinc-950 dark:to-zinc-900/40 border-b border-slate-100 dark:border-zinc-800/80 cursor-move select-none"
      >
        <span className="text-sm font-bold text-slate-800 dark:text-zinc-200 truncate pr-4">
          {win.title}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => minimizeWindow(win.id)}
            className="win-action-btn p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition animate-in duration-200"
            title="Minimizar"
          >
            <Minus size={14} />
          </button>
          <button
            onClick={() => closeWindow(win.id)}
            className="win-action-btn p-1 rounded-md text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition animate-in duration-200"
            title="Cerrar"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Contenido de la ventana */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <WindowContent win={win} onClose={() => closeWindow(win.id)} />
      </div>
    </div>
  );
};

// ── Bandeja inferior / Barra de Tareas (Taskbar) ─────────────────────────────
export const ModalDockTray = () => {
  const { windows, restoreWindow, minimizeWindow } = useModalDock();

  if (windows.length === 0) return null;

  return (
    <>
      {/* Renderizado de todas las ventanas flotantes */}
      {windows.map((win) => (
        <FloatingWindow key={win.id} win={win} />
      ))}

      {/* Barra de tareas (Taskbar) en el borde inferior centrado */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[999] flex items-center gap-2 bg-slate-900/90 dark:bg-zinc-950/95 border border-slate-800 p-2 rounded-xl shadow-xl backdrop-blur-md max-w-[90vw] overflow-x-auto custom-scrollbar">
        <div className="flex items-center gap-1.5 px-2 border-r border-slate-800 mr-1.5 text-slate-400">
          <MonitorDot size={16} />
          <span className="text-[10px] uppercase font-bold tracking-wider">Escritorio</span>
        </div>
        
        {windows.map((win) => (
          <button
            key={`tray-${win.id}`}
            onClick={() => (win.isMinimized ? restoreWindow(win.id) : minimizeWindow(win.id))}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all max-w-[180px] truncate",
              win.isMinimized
                ? "bg-slate-800 text-slate-400 hover:bg-slate-700/80 hover:text-white"
                : "bg-blue-600 text-white hover:bg-blue-500"
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", win.isMinimized ? "bg-slate-500" : "bg-emerald-400 animate-pulse")} />
            <span className="truncate">{win.title}</span>
          </button>
        ))}
      </div>
    </>
  );
};
