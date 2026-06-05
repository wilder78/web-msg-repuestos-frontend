import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Forbidden403 from "./pages/Forbidden403";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import { PermissionRoute } from "./components/PermissionRoute";
import DashboardLayout from "./pages/Dashboard/DashboardLayout";
import DashboardContent from "./pages/Dashboard/DashboardContent";
import GestionUsuarios from "./pages/Users/GestionUsuarios";
import GestionZona from "./pages/Area/GestionZona";
import GestionRoles from "./pages/Roles/GestionRoles";
import GestionEmpleados from "./pages/Employees/GestionEmpleados";
import GestionClientes from "./pages/Customers/GestionClientes";
import GestionPermisos from "./pages/Permits/GestionPermisos";
import GestionProveedor from "./pages/Suppliers/GestionProveedor";
import GestionCategorias from "./pages/Category/GestionCategorias";
import GestionProductos from "./pages/Products/GestionProductos";
import GestionRutas from "./pages/FollowUp/GestionRutas";
import GestionNosotros from "./pages/WebAboutUs/GestionNosotros";
import GestionProductosWeb from "./pages/WebProducts/GestionProductosWeb";
import GestionContacto from "./pages/WebContactUs/GestionContacto";
import GestionPedidos from "./pages/Pedidos/GestionPedidos";
import GestionCreditos from "./pages/Credits/GestionCreditos";
import GestionAbonos from "./pages/Abonos/GestionAbonos";
import GestionDevoluciones from "./pages/Devoluciones/GestionDevoluciones";
import GestionCompras from "./pages/Compras/GestionCompras";
import GestionVentas from "./pages/Sales/GestionVentas";
import CartPage from "./pages/WebCart/CartPage";
import OrderHistoryPage from "./pages/OrderHistory/OrderHistoryPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/carrito" element={<CartPage />} />
      <Route path="/mi-historial" element={<OrderHistoryPage />} />
      <Route path="/login" element={<Navigate to="/?login=true" replace />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/403" element={<Forbidden403 />} />

      {/* ─── Rutas del Dashboard ─────────────────────────────────────── */}

      {/* Inicio del Dashboard */}
      <Route
        path="/dashboard"
        element={
          <DashboardLayout>
            <DashboardContent />
          </DashboardLayout>
        }
      />

      {/* Gestión de Ventas */}
      <Route
        path="/dashboard/sales"
        element={
          <PermissionRoute permission="Ver Reportes">
            <DashboardLayout>
              <GestionVentas />
            </DashboardLayout>
          </PermissionRoute>
        }
      />
      <Route
        path="/sales"
        element={<Navigate to="/dashboard/sales" replace />}
      />

      {/* Gestión de Pedidos */}
      <Route
        path="/dashboard/pedidos"
        element={
          <PermissionRoute permission="Listar Pedidos">
            <DashboardLayout>
              <GestionPedidos />
            </DashboardLayout>
          </PermissionRoute>
        }
      />
      <Route
        path="/pedidos"
        element={<Navigate to="/dashboard/pedidos" replace />}
      />

      {/* Gestión de Créditos */}
      <Route
        path="/dashboard/creditos"
        element={
          <PermissionRoute permission="Listar Créditos">
            <DashboardLayout>
              <GestionCreditos />
            </DashboardLayout>
          </PermissionRoute>
        }
      />
      <Route
        path="/creditos"
        element={<Navigate to="/dashboard/creditos" replace />}
      />

      {/* Gestión de Abonos / Pagos */}
      <Route
        path="/dashboard/abonos"
        element={
          <PermissionRoute permission="Listar Abonos">
            <DashboardLayout>
              <GestionAbonos />
            </DashboardLayout>
          </PermissionRoute>
        }
      />
      <Route
        path="/abonos"
        element={<Navigate to="/dashboard/abonos" replace />}
      />

      {/* Gestión de Devoluciones e Inventario */}
      <Route
        path="/dashboard/devoluciones"
        element={
          <PermissionRoute permission="Listar Devoluciones">
            <DashboardLayout>
              <GestionDevoluciones />
            </DashboardLayout>
          </PermissionRoute>
        }
      />
      <Route
        path="/devoluciones"
        element={<Navigate to="/dashboard/devoluciones" replace />}
      />

      {/* Gestión de Compras (Admin) */}
      <Route
        path="/dashboard/compras"
        element={
          <PermissionRoute permission="Listar Compras">
            <DashboardLayout>
              <GestionCompras />
            </DashboardLayout>
          </PermissionRoute>
        }
      />
      <Route
        path="/compras"
        element={<Navigate to="/dashboard/compras" replace />}
      />

      {/* Gestión de Usuarios */}
      <Route
        path="/dashboard/usuarios"
        element={
          <PermissionRoute permission="Gestionar Usuarios">
            <DashboardLayout>
              <GestionUsuarios />
            </DashboardLayout>
          </PermissionRoute>
        }
      />

      {/* Gestión de Zonas */}
      <Route
        path="/dashboard/zonas"
        element={
          <PermissionRoute permission="Gestionar Zonas">
            <DashboardLayout>
              <GestionZona />
            </DashboardLayout>
          </PermissionRoute>
        }
      />
      <Route
        path="/zonas"
        element={<Navigate to="/dashboard/zonas" replace />}
      />

      {/* Gestión de Rutas */}
      <Route
        path="/dashboard/rutas"
        element={
          <PermissionRoute permission="Gestionar Rutas">
            <DashboardLayout>
              <GestionRutas />
            </DashboardLayout>
          </PermissionRoute>
        }
      />
      <Route
        path="/rutas"
        element={<Navigate to="/dashboard/rutas" replace />}
      />

      {/* Gestión de Roles */}
      <Route
        path="/dashboard/roles"
        element={
          <PermissionRoute permission="Gestionar Roles">
            <DashboardLayout>
              <GestionRoles />
            </DashboardLayout>
          </PermissionRoute>
        }
      />

      {/* Gestión de Permisos */}
      <Route
        path="/dashboard/permisos"
        element={
          <PermissionRoute permission="Gestionar Permisos">
            <DashboardLayout>
              <GestionPermisos />
            </DashboardLayout>
          </PermissionRoute>
        }
      />

      {/* Gestión de Empleados */}
      <Route
        path="/dashboard/empleados"
        element={
          <PermissionRoute permission="Gestionar Empleados">
            <DashboardLayout>
              <GestionEmpleados />
            </DashboardLayout>
          </PermissionRoute>
        }
      />

      {/* Gestión de Clientes */}
      <Route
        path="/dashboard/customers"
        element={
          <PermissionRoute permission="Listar Clientes">
            <DashboardLayout>
              <GestionClientes />
            </DashboardLayout>
          </PermissionRoute>
        }
      />

      {/* Gestión de Proveedores */}
      <Route
        path="/dashboard/suppliers"
        element={
          <PermissionRoute permission="Listar Proveedores">
            <DashboardLayout>
              <GestionProveedor />
            </DashboardLayout>
          </PermissionRoute>
        }
      />
      <Route
        path="/proveedores"
        element={<Navigate to="/dashboard/suppliers" replace />}
      />

      {/* Gestión de Categorías */}
      <Route
        path="/dashboard/categorias"
        element={
          <PermissionRoute permission="Gestionar Categorías">
            <DashboardLayout>
              <GestionCategorias />
            </DashboardLayout>
          </PermissionRoute>
        }
      />
      <Route
        path="/categorias"
        element={<Navigate to="/dashboard/categorias" replace />}
      />
      {/* Gestión de Productos */}
      <Route
        path="/dashboard/productos"
        element={
          <PermissionRoute permission="Listar Productos">
            <DashboardLayout>
              <GestionProductos />
            </DashboardLayout>
          </PermissionRoute>
        }
      />
      <Route
        path="/productos"
        element={<Navigate to="/dashboard/productos" replace />}
      />

      {/* ─── Rutas Web Públicas ──────────────────────────────────────── */}
      <Route path="/nosotros" element={<GestionNosotros />} />
      <Route path="/repuestos" element={<GestionProductosWeb />} />
      <Route path="/contacto" element={<GestionContacto />} />

      {/* ─── Manejo de Error 404 ─────────────────────────────────────── */}

      <Route
        path="*"
        element={
          <div className="flex h-screen items-center justify-center text-2xl font-bold text-slate-800">
            404 - Página no encontrada
          </div>
        }
      />
    </Routes>
  );
}
