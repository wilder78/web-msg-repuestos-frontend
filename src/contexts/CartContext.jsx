import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";

const CartContext = createContext();

/**
 * parsePrice — convierte CUALQUIER representación de precio a Number puro.
 * Soporta:
 *   - Número nativo:  15000        → 15000
 *   - String entero: "15000"       → 15000
 *   - Punto de miles: "15.000"     → 15000
 *   - Coma decimal:  "15.000,50"   → 15000.50
 *   - Moneda:        "$ 15.000"    → 15000
 *   - Punto decimal: "15000.50"    → 15000.50
 */
const parsePrice = (price) => {
  if (typeof price === "number" && !Number.isNaN(price)) return price;
  const str = String(price ?? "").trim();
  // Eliminar símbolos de moneda y espacios
  const stripped = str.replace(/[^0-9.,]/g, "");
  if (!stripped) return 0;

  const hasComma = stripped.includes(",");
  const hasDot   = stripped.includes(".");

  if (hasComma && hasDot) {
    // Formato europeo/colombiano: "15.000,50" → punto=miles, coma=decimal
    const normalized = stripped.replace(/\./g, "").replace(",", ".");
    return parseFloat(normalized) || 0;
  }
  if (hasComma && !hasDot) {
    // Coma única: puede ser miles ("15,000") o decimal ("15,50")
    // Si hay más de 3 dígitos tras la coma, es miles; si son 2, es decimal
    const parts = stripped.split(",");
    if (parts[1]?.length !== 2) {
      // "15,000" → miles
      return parseFloat(stripped.replace(/,/g, "")) || 0;
    }
    // "15,50" → decimal
    return parseFloat(stripped.replace(",", ".")) || 0;
  }
  if (hasDot && !hasComma) {
    const parts = stripped.split(".");
    if (parts.length === 2 && parts[1].length === 3) {
      // "15.000" → punto de miles, NO decimal
      return parseFloat(stripped.replace(/\./g, "")) || 0;
    }
    // "15000.50" → punto decimal normal
    return parseFloat(stripped) || 0;
  }
  return parseFloat(stripped) || 0;
};

const normalizeQuantity = (value) => {
  const quantity = Number.parseInt(value, 10);
  return Number.isInteger(quantity) && quantity > 0 ? quantity : 1;
};

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        // Garantizar que el estado inicial tenga precios estrictamente numéricos
        return Array.isArray(parsed) 
          ? parsed.map(item => ({ ...item, price: parsePrice(item.price) }))
          : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingProduct = prevCart.find((item) => item.id === product.id);
      const stockLimit = Number(product.stock ?? product.stockBuenEstado ?? product.stock_buen_estado ?? 9999);
      if (existingProduct) {
        const nextQuantity = existingProduct.quantity + 1;
        if (nextQuantity > stockLimit) {
          toast.error(`Lo sentimos, no puedes agregar más unidades. El stock disponible es ${stockLimit}.`);
          return prevCart;
        }
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: nextQuantity }
            : item
        );
      }
      // Mantener el estado con el precio estrictamente numérico
      const numericPrice = parsePrice(product.price);
      return [...prevCart, { ...product, price: numericPrice, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    const safeQuantity = normalizeQuantity(newQuantity);
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.id === productId) {
          const stockLimit = Number(item.stock ?? item.stockBuenEstado ?? item.stock_buen_estado ?? 9999);
          if (safeQuantity > stockLimit) {
            toast.error(`Lo sentimos, no puedes solicitar más de ${stockLimit} unidades. Stock insuficiente.`);
            return { ...item, quantity: stockLimit };
          }
          return { ...item, quantity: safeQuantity };
        }
        return item;
      })
    );
  };

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Almacenar el total calculado estrictamente sobre los valores numéricos
  const cartTotal = cart.reduce(
    (acc, item) => acc + (typeof item.price === "number" ? item.price : parsePrice(item.price)) * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, cartTotal }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart debe ser usado dentro de un CartProvider");
  }
  return context;
};
