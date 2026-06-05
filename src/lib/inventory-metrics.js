export const getProductStock = (product) =>
  Number(product.stockBuenEstado ?? product.stock_buen_estado ?? 0);

export const getProductDefective = (product) =>
  Number(product.stockDefectuoso ?? product.stock_defectuoso ?? 0);

export const getProductMinStock = (product) =>
  Number(product.stockMinimo ?? product.stock_minimo ?? 5);

export const getProductPrice = (product) =>
  Number(product.precioCompra ?? product.precio_compra ?? 0);

export const isProductActive = (product) => {
  const estado = product.idEstado ?? product.id_estado;
  return estado === undefined || estado === null || estado === 1;
};

export const normalizeProductRecord = (product) => ({
  idProducto: product.idProducto ?? product.id_producto ?? product.id,
  nombre: product.nombre || product.referencia || "Producto",
  referencia: product.referencia || "—",
  marca: product.marca || "—",
  stock: getProductStock(product),
  minimo: getProductMinStock(product),
  precioCompra: getProductPrice(product),
  stockDefectuoso: getProductDefective(product),
});

export const computeInventoryMetricsFromProducts = (products = []) => {
  const activeProducts = products.filter(isProductActive);

  let valorTotalInventario = 0;
  let productosAgotadosCriticos = 0;
  let mermaStockDefectuoso = 0;

  activeProducts.forEach((product) => {
    const stock = getProductStock(product);
    const minimo = getProductMinStock(product);
    const precio = getProductPrice(product);
    const defectuoso = getProductDefective(product);

    valorTotalInventario += stock * precio;
    mermaStockDefectuoso += defectuoso;

    if (stock === 0 || stock < minimo) {
      productosAgotadosCriticos += 1;
    }
  });

  const topMayorStock = activeProducts
    .map((product) => {
      const normalized = normalizeProductRecord(product);
      return {
        ...normalized,
        nombreCorto:
          normalized.nombre.length > 28
            ? `${normalized.nombre.slice(0, 28)}…`
            : normalized.nombre,
      };
    })
    .sort((a, b) => b.stock - a.stock)
    .slice(0, 10);

  const alertasReabastecimiento = activeProducts
    .filter((product) => getProductStock(product) === 0)
    .map(normalizeProductRecord)
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  return {
    valorTotalInventario,
    productosAgotadosCriticos,
    mermaStockDefectuoso,
    topMayorStock,
    alertasReabastecimiento,
    productosActivos: activeProducts.length,
  };
};

export const mergeBackendInventorySummary = (computed, backendPayload) => {
  if (!backendPayload || typeof backendPayload !== "object") return computed;

  const valor =
    backendPayload.valorTotalInventario ??
    backendPayload.valor_total_inventario ??
    backendPayload.totalValor ??
    backendPayload.total_valor;

  const agotados =
    backendPayload.productosAgotadosCriticos ??
    backendPayload.productos_agotados_criticos ??
    backendPayload.agotadosCriticos;

  const merma =
    backendPayload.mermaStockDefectuoso ??
    backendPayload.merma_stock_defectuoso ??
    backendPayload.totalDefectuoso ??
    backendPayload.total_defectuoso;

  return {
    ...computed,
    valorTotalInventario: valor !== undefined ? Number(valor) : computed.valorTotalInventario,
    productosAgotadosCriticos:
      agotados !== undefined ? Number(agotados) : computed.productosAgotadosCriticos,
    mermaStockDefectuoso: merma !== undefined ? Number(merma) : computed.mermaStockDefectuoso,
    fromBackend: true,
  };
};
