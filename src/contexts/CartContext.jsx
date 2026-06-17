import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";

const CartContext = createContext();

const parsePrice = (priceStr) => {
  if (typeof priceStr === "number") return priceStr;
  return parseFloat(String(priceStr).replace(/[^0-9.]/g, "")) || 0;
};

const normalizeQuantity = (value) => {
  const quantity = Number.parseInt(value, 10);
  return Number.isInteger(quantity) && quantity > 0 ? quantity : 1;
};

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem("cart");
    return savedCart ? JSON.parse(savedCart) : [];
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
      return [...prevCart, { ...product, quantity: 1 }];
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

  const cartTotal = cart.reduce(
    (acc, item) => acc + parsePrice(item.price) * item.quantity,
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
