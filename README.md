# MSG Repuestos — Frontend

Ecosistema de interfaces del sistema de gestión y comercio electrónico de **MSG Repuestos**. Este repositorio contiene el código fuente de la plataforma web pública orientada al cliente (catálogo de productos, carrito de compras, historial de pedidos) y de la aplicación web administrativa para la gestión operativa en campo (rutas de vendedores, control de créditos, abonos, seguimiento de pedidos en bodega y administración de inventario).

---

## Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework base | **React 19** | ^19.0.0 |
| Lenguaje | **JavaScript (ES2022+)** | — |
| Empaquetador | **Vite** | ^7.3.0 |
| Enrutamiento | **React Router DOM** | ^7.5.0 |
| Estilos | **Tailwind CSS 4** (utility-first) | ^4.1.0 |
| Iconos | **Lucide React** | ^0.485.0 |
| Estado global | **React Context API** (`useContext` + `useReducer`) | — |
| Notificaciones | **Sonner** (toast) | ^2.0.0 |
| Formateo | **Prettier** | — |
| Linting | **ESLint** con plugin React | — |

- **Gestión de estado global**: `src/contexts/` centraliza los contextos de autenticación (`AuthContext`), carrito de compras (`CartContext`) y cualquier estado transversal del aplicativo.
- **Asistencia de desarrollo**: Extensiones ESLint + Prettier integradas en el flujo de trabajo del editor para formateo automático y análisis estático en tiempo real.

---

## Arquitectura de Software

El proyecto adopta el patrón **Arquitectura basada en Componentes con Separación por Capacidades (Feature‑first)**. El código se organiza en torno a las responsabilidades del dominio del negocio, no del tipo de archivo.

### Árbol de directorios

```
src/
├── api/              # Cliente HTTP preconfigurado (axios)
├── assets/           # Recursos multimedia estáticos (imágenes, fuentes)
├── components/       # Componentes genéricos y reutilizables
│   ├── Footer/       #   Pie de página global
│   ├── Navbar/       #   Barras de navegación (pública y admin)
│   ├── shared/       #   Componentes compartidos (modales, botones, tablas, PDF)
│   └── ui/           #   Componentes base (shadcn/ui adaptados)
├── contexts/         # Proveedores de estado global (Auth, Cart)
├── hooks/            # Hooks personalizados para lógica reutilizable
├── lib/              # Utilidades y funciones helper
├── pages/            # Vistas organizadas por módulo funcional
│   ├── Home.jsx      #   Página principal (pública)
│   ├── Abonos/       #   Gestión de abonos
│   ├── Area/         #   Gestión de zonas
│   ├── Category/     #   Gestión de categorías
│   ├── Compras/      #   Órdenes de compra
│   ├── Credits/      #   Control de créditos
│   ├── Customers/    #   Administración de clientes
│   ├── Dashboard/    #   Layout del panel de control
│   ├── Devoluciones/ #   Devoluciones e inventario
│   ├── Employees/    #   Gestión de empleados
│   ├── FollowUp/     #   Rutas de vendedores
│   ├── OrderHistory/ #   Historial de pedidos (cliente)
│   ├── Pedidos/      #   Seguimiento de pedidos en bodega
│   ├── Permits/      #   Gestión de permisos
│   ├── Products/     #   Administración de productos
│   ├── Roles/        #   Roles y permisos
│   ├── Sales/        #   Gestión de ventas
│   ├── Suppliers/    #   Proveedores
│   ├── Users/        #   Usuarios del sistema
│   ├── WebAboutUs/   #   Página "Nosotros" (pública)
│   ├── WebCart/      #   Carrito de compras (pública)
│   ├── WebContactUs/ #   Página "Contacto" (pública)
│   └── WebProducts/  #   Catálogo de productos (pública)
└── services/         # Consumo de API REST (servicios HTTP dedicados)
```

- **`components/shared/`**: Alberga todos los componentes reutilizables (modales de confirmación, tablas paginadas, PDF imprimibles, indicadores de estado, menú de perfil de usuario, etc.).
- **`components/ui/`**: Componentes de interfaz genéricos como botones, inputs, badges y avatares (adaptación de shadcn/ui).
- **`pages/`**: Cada subdirectorio representa un módulo funcional del negocio y contiene la vista principal (`Gestion*.jsx`) junto con sus subcomponentes específicos en `components/`.
- **`hooks/`**: Contiene hooks personalizados que encapsulan lógica de negocio y efectos secundarios (autenticación, navegación, productos, etc.), manteniendo las vistas limpias de lógica imperativa.
- **`services/`**: Clientes HTTP especializados para el consumo de endpoints REST específicos del backend.
- **`lib/`**: Utilidades transversales como formateo de moneda, transformación de claves (`snake_case` ↔ `camelCase`), y helpers de autenticación.

---

## Aprovisionamiento Local

### Prerrequisitos

- **Node.js** ≥ 18.x (LTS recomendada)
- **npm** ≥ 9.x
- **Git**

### Instalación y ejecución

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd msg-repuestos-frondend

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
npm run dev
```

El servidor se iniciará en `http://localhost:5173` por defecto.

### Variables de entorno

Crear un archivo `.env` en la raíz del proyecto (junto a `vite.config.js`) con el siguiente contenido mínimo:

```env
# URL base del backend (el proxy de Vite redirige /api a esta dirección)
VITE_API_URL=http://127.0.0.1:8080/api

# Temporizador global para cierre de sesión por inactividad (ms)
VITE_SESSION_TIMEOUT=3600000

# Temporizador de redirección post-confirmación de pedido (ms)
VITE_REDIRECT_DELAY=3500
```

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `VITE_API_URL` | URL base de la API REST del backend | `http://127.0.0.1:8080/api` |
| `VITE_SESSION_TIMEOUT` | Tiempo de inactividad antes de cerrar sesión (ms) | `3600000` (1 hora) |
| `VITE_REDIRECT_DELAY` | Tiempo de espera post-pedido antes de redirigir (ms) | `3500` |

---

## Características y Mejoras Recientes

A lo largo de las últimas actualizaciones, se han incorporado múltiples mejoras de usabilidad, estética y capacidades operativas en la aplicación web administrativa:

1. **Soporte Completo de Modo Oscuro (Dark Mode):**
   - Configurado nativamente con Tailwind CSS v4 mediante la inyección del selector `@custom-variant dark` en `index.css`.
   - Interruptor flotante interactivo (`DarkModeFAB.jsx`) y botón integrado en la cabecera superior (`DarkModeToggle.jsx`).
   - Estandarización visual rigurosa (fondos, bordes, hovers, inputs y textos legibles con alto contraste) adaptada al modo oscuro en los módulos principales.

2. **Estandarización de Interfaces Administrativas (Estilo Permits):**
   - Sincronización visual simétrica ("diseño espejo") del pie de página (`TablePagination.jsx`) con la cabecera del buscador (`TableToolbar.jsx`) en todas las tablas administrativas.
   - Migración completa a estilos oscuros simétricos y eliminación de clases de color no estándar (como `zinc-850` reemplazado por `zinc-800`).
   - Módulos estandarizados bajo este patrón:
     - **Permits** (Permisos)
     - **Products** (Productos)
     - **Sales** (Ventas)
     - **Devoluciones** (Devoluciones)
     - **Credits** (Créditos)
     - **Pedidos** (Pedidos)
     - **Customers** (Clientes)

3. **Buscador Global Inteligente en Tiempo Real:**
   - Campo de búsqueda interactivo en el Navbar superior administrativo con sugerencias autocompletables agrupadas por categorías (Clientes, Pedidos y Productos).
   - Filtrado rápido que detecta búsquedas a partir del 3er carácter e integra redirección con parámetros URL (`?search=...`) para la carga directa de filtros.

4. **Centro de Notificaciones Integrado:**
   - Registro automático de alertas del sistema (alertas por stock bajo en inventario de repuestos, cambios de estado en el procesamiento de pedidos, registro de nuevos clientes).
   - Interfaz interactiva de campana de notificaciones con conteo dinámico (*badge*), listado de scroll responsivo y opción para marcar notificaciones individuales o generales como leídas.

5. **Mejoras del Editor de Pedidos:**
   - Selector emergente rápido (Popover) con los tres precios base de repuestos (Al Detal, Minorista, Mayorista) integrado en los modales de creación y edición.
   - Edición manual del campo `Precio Unit.` con recálculo dinámico en tiempo real de subtotales, IVA y total de la orden.
   - Adaptación en modo oscuro de modales de edición, abonos y de restauración de estados de pedidos.

---

## Estándares de UI/UX — Reglas Obligatorias

### 1. Carruseles y visores continuos — Bucle infinito obligatorio

Todo carrusel o visor continuo de productos en la interfaz pública **debe** configurarse con un bucle infinito fluido. Queda **estrictamente prohibido** implementar saltos abruptos o retrocesos visuales al llegar al final del listado. La transición desde la última posición visible hacia la primera debe realizarse mediante un snap invisible tras mostrar los clones de los primeros elementos, garantizando una experiencia de desplazamiento continua y unidireccional.

### 2. Confirmación de pedido — Pantalla de éxito con retención controlada

Tras confirmarse un pedido exitosamente, la interfaz **debe** desplegar un componente animado de confirmación dedicado. Este componente debe retener al usuario mediante un temporizador asíncrono controlado de **3 a 4 segundos** (configurable vía `VITE_REDIRECT_DELAY`) antes de ejecutar la redirección automática hacia la pantalla principal. Durante este intervalo se debe mostrar una animación de éxito y un resumen visual del pedido.

### 3. Barra de navegación del Dashboard — Alineación horizontal estricta

Los elementos principales de interacción de la barra de navegación del Dashboard (buscador global, alertas y menú de perfil de usuario) **deben** centrarse y alinearse horizontalmente de forma estricta. Se prohíben desalineaciones o distribuciones asimétricas que incrementen la fatiga visual del operador administrativo.

---

## Pipeline de Calidad

Antes de integrar cualquier cambio al repositorio principal, ejecutar los siguientes comandos:

```bash
# Análisis estático (lint)
npm run lint

# Construcción de producción (valida compilación sin errores)
npm run build
```

La construcción **debe** completarse con **0 errores** y **0 advertencias** (exceptuando el warning preexistente de tamaño de chunk, que es una limitación conocida de Vite y no bloqueante). Cualquier error de compilación o violación de lint **bloquea** la integración.

> **Nota**: Este proyecto no incluye actualmente un framework de pruebas automatizadas de interfaz. La validación de calidad se realiza mediante el análisis estático (ESLint) y la compilación exitosa con Vite.
