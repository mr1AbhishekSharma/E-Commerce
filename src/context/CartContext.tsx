"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Product, LocalCartItem, CartOrder } from "@/types";
import { useAuth } from "./AuthContext";
import {
  getBackendCart,
  addBackendCartItem,
  updateBackendCartItem,
  removeBackendCartItem,
  syncBackendCart,
  applyBackendCoupon,
} from "@/lib/api";

interface CartContextType {
  items: LocalCartItem[];
  cartOrder: CartOrder | null;
  isLoading: boolean;
  totalCount: number;
  subtotal: number;
  discount: number;
  total: number;
  couponCode: string | null;
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  removeFromCart: (productId: number, slug?: string) => Promise<void>;
  updateQuantity: (productId: number, quantity: number, slug?: string) => Promise<void>;
  clearCart: () => void;
  applyCoupon: (code: string) => Promise<{ success: boolean; error?: string }>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [items, setItems] = useState<LocalCartItem[]>([]);
  const [cartOrder, setCartOrder] = useState<CartOrder | null>(null);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("vibe_cart");
      if (savedCart) {
        setItems(JSON.parse(savedCart));
      }
    } catch (e) {
      console.error("Failed to parse cart from storage", e);
    }
  }, []);

  const saveGuestCart = (newItems: LocalCartItem[]) => {
    setItems(newItems);
    try {
      localStorage.setItem("vibe_cart", JSON.stringify(newItems));
    } catch (e) {
      console.error("Failed to save cart to storage", e);
    }
  };

  const mapBackendOrderToItems = (order: CartOrder): LocalCartItem[] => {
    if (!order || !order.items) return [];
    return order.items.map((orderItem) => ({
      product: orderItem.item,
      quantity: orderItem.quantity,
    }));
  };

  const refreshCart = useCallback(async () => {
    if (!token) {
      setCartOrder(null);
      return;
    }

    setIsLoading(true);
    try {
      const localGuestCart = localStorage.getItem("vibe_cart");
      if (localGuestCart) {
        const guestItems: LocalCartItem[] = JSON.parse(localGuestCart);
        if (guestItems.length > 0) {
          const syncPayload = guestItems.map((gi) => ({
            slug: gi.product.slug,
            quantity: gi.quantity,
          }));
          const syncedOrder = await syncBackendCart(token, syncPayload);
          if (syncedOrder) {
            setCartOrder(syncedOrder);
            setItems(mapBackendOrderToItems(syncedOrder));
            localStorage.removeItem("vibe_cart");
            setIsLoading(false);
            return;
          }
        }
      }

      const order = await getBackendCart(token);
      if (order) {
        setCartOrder(order);
        setItems(mapBackendOrderToItems(order));
        if (order.coupon) {
          setCouponCode(order.coupon.code);
          setCouponDiscount(order.coupon.amount);
        }
      }
    } catch (err) {
      console.error("Error refreshing cart:", err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (product: Product, quantity: number = 1) => {
    if (token) {
      setIsLoading(true);
      try {
        let updatedOrder: CartOrder | null = null;
        for (let i = 0; i < quantity; i++) {
          updatedOrder = await addBackendCartItem(token, product.slug);
        }
        if (updatedOrder) {
          setCartOrder(updatedOrder);
          setItems(mapBackendOrderToItems(updatedOrder));
        } else {
          await refreshCart();
        }
      } catch (err) {
        console.error("Add to cart error:", err);
      } finally {
        setIsLoading(false);
      }
    } else {
      const existingIndex = items.findIndex((i) => i.product.id === product.id);
      let updated: LocalCartItem[];
      if (existingIndex > -1) {
        updated = [...items];
        updated[existingIndex].quantity += quantity;
      } else {
        updated = [...items, { product, quantity }];
      }
      saveGuestCart(updated);
    }
  };

  const removeFromCart = async (productId: number, slug?: string) => {
    if (token && slug) {
      setIsLoading(true);
      try {
        const updatedOrder = await removeBackendCartItem(token, slug);
        if (updatedOrder) {
          setCartOrder(updatedOrder);
          setItems(mapBackendOrderToItems(updatedOrder));
        } else {
          await refreshCart();
        }
      } catch (err) {
        console.error("Remove from cart error:", err);
      } finally {
        setIsLoading(false);
      }
    } else {
      const updated = items.filter((i) => i.product.id !== productId);
      saveGuestCart(updated);
    }
  };

  const updateQuantity = async (productId: number, quantity: number, slug?: string) => {
    if (quantity <= 0) {
      await removeFromCart(productId, slug);
      return;
    }

    if (token && slug) {
      setIsLoading(true);
      try {
        const currentItem = items.find((i) => i.product.id === productId);
        const currentQty = currentItem ? currentItem.quantity : 1;
        const diff = quantity - currentQty;

        if (diff > 0) {
          for (let i = 0; i < diff; i++) {
            await updateBackendCartItem(token, slug, "increase");
          }
        } else if (diff < 0) {
          for (let i = 0; i < Math.abs(diff); i++) {
            await updateBackendCartItem(token, slug, "decrease");
          }
        }
        await refreshCart();
      } catch (err) {
        console.error("Update quantity error:", err);
      } finally {
        setIsLoading(false);
      }
    } else {
      const updated = items.map((i) =>
        i.product.id === productId ? { ...i, quantity } : i
      );
      saveGuestCart(updated);
    }
  };

  const clearCart = () => {
    setItems([]);
    setCartOrder(null);
    setCouponCode(null);
    setCouponDiscount(0);
    try {
      localStorage.removeItem("vibe_cart");
    } catch (e) {}
  };

  const applyCoupon = async (code: string): Promise<{ success: boolean; error?: string }> => {
    if (!token) {
      return { success: false, error: "Please log in to apply discount coupons." };
    }
    setIsLoading(true);
    try {
      const res = await applyBackendCoupon(token, code);
      if (res.error) {
        setIsLoading(false);
        return { success: false, error: res.error };
      }
      if (res.order) {
        setCartOrder(res.order);
        setItems(mapBackendOrderToItems(res.order));
        if (res.order.coupon) {
          setCouponCode(res.order.coupon.code);
          setCouponDiscount(res.order.coupon.amount);
        }
      }
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || "Failed to apply coupon" };
    }
  };

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = items.reduce((sum, item) => {
    const price = item.product.discount_price || item.product.price;
    return sum + price * item.quantity;
  }, 0);

  const discount = cartOrder?.coupon?.amount || couponDiscount || 0;
  const total = cartOrder?.total !== undefined ? cartOrder.total : Math.max(0, subtotal - discount);

  return (
    <CartContext.Provider
      value={{
        items,
        cartOrder,
        isLoading,
        totalCount,
        subtotal,
        discount,
        total,
        couponCode,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        applyCoupon,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
