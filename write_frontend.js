const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = __dirname;

const files = {};

// 1. AuthContext
files['src/context/AuthContext.tsx'] = `"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "@/types";
import { loginUser, registerUser, getCurrentUser } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      try {
        const savedToken = localStorage.getItem("vibe_token");
        if (savedToken) {
          setToken(savedToken);
          const userData = await getCurrentUser(savedToken);
          if (userData) {
            setUser(userData);
          } else {
            localStorage.removeItem("vibe_token");
            localStorage.removeItem("vibe_refresh");
            setToken(null);
          }
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        setIsLoading(false);
      }
    }
    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await loginUser(username, password);
      if (res.error || !res.access) {
        setIsLoading(false);
        return { success: false, error: res.error || "Login failed" };
      }

      localStorage.setItem("vibe_token", res.access);
      if (res.refresh) localStorage.setItem("vibe_refresh", res.refresh);
      setToken(res.access);

      const userData = await getCurrentUser(res.access);
      if (userData) {
        setUser(userData);
      } else {
        setUser({ id: 0, username, email: "" });
      }

      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || "An unexpected error occurred" };
    }
  };

  const register = async (username: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await registerUser(username, email, password);
      if (res.error) {
        setIsLoading(false);
        return { success: false, error: res.error };
      }

      if (res.access) {
        localStorage.setItem("vibe_token", res.access);
        if (res.refresh) localStorage.setItem("vibe_refresh", res.refresh);
        setToken(res.access);
        if (res.user) {
          setUser(res.user);
        } else {
          const userData = await getCurrentUser(res.access);
          setUser(userData || { id: 0, username, email });
        }
      } else {
        return await login(username, password);
      }

      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || "Registration failed" };
    }
  };

  const logout = () => {
    localStorage.removeItem("vibe_token");
    localStorage.removeItem("vibe_refresh");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
`;

// 2. CartContext
files['src/context/CartContext.tsx'] = `"use client";

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
`;

// 3. Providers
files['src/components/Providers.tsx'] = `"use client";

import React from "react";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>{children}</CartProvider>
    </AuthProvider>
  );
}
`;

// 4. AddToCartButton
files['src/components/AddToCartButton.tsx'] = `"use client";

import { useState } from "react";
import { Product } from "@/types";
import { useCart } from "@/context/CartContext";
import { ShoppingBag, Check, Plus, Minus, ArrowRight } from "lucide-react";
import Link from "next/link";

interface AddToCartButtonProps {
  product: Product;
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const { addToCart, isLoading } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAddToCart = async () => {
    await addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
    }, 2500);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 overflow-hidden">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="p-3 text-gray-600 hover:text-black hover:bg-gray-100 transition disabled:opacity-40"
            disabled={quantity <= 1 || isLoading}
            aria-label="Decrease quantity"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-12 text-center text-sm font-semibold text-gray-900">
            {quantity}
          </span>
          <button
            onClick={() => setQuantity((q) => q + 1)}
            className="p-3 text-gray-600 hover:text-black hover:bg-gray-100 transition disabled:opacity-40"
            disabled={isLoading}
            aria-label="Increase quantity"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={isLoading}
          className={\`flex-1 py-3.5 px-6 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-md \${
            added
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "bg-black text-white hover:bg-neutral-800 disabled:opacity-60"
          }\`}
        >
          {added ? (
            <>
              <Check className="w-4 h-4" />
              <span>Added to Bag!</span>
            </>
          ) : (
            <>
              <ShoppingBag className="w-4 h-4" />
              <span>{isLoading ? "Adding..." : "Add to Bag"}</span>
            </>
          )}
        </button>
      </div>

      {added && (
        <div className="flex items-center justify-between p-3 bg-neutral-900 text-white rounded-xl text-xs">
          <span>Added {quantity} item(s) to your bag.</span>
          <Link
            href="/cart"
            className="inline-flex items-center gap-1 font-bold text-indigo-300 hover:underline"
          >
            <span>View Bag</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
`;

// 5. CartView
files['src/components/CartView.tsx'] = `"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { formatMediaUrl } from "@/lib/api";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag, CheckCircle2, AlertCircle } from "lucide-react";

export default function CartView() {
  const {
    items,
    isLoading,
    totalCount,
    subtotal,
    discount,
    total,
    couponCode,
    removeFromCart,
    updateQuantity,
    applyCoupon,
  } = useCart();

  const [inputCoupon, setInputCoupon] = useState("");
  const [couponMsg, setCouponMsg] = useState<{ text: string; error: boolean } | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCoupon.trim()) return;

    setApplyingCoupon(true);
    setCouponMsg(null);

    const res = await applyCoupon(inputCoupon.trim());
    if (res.success) {
      setCouponMsg({ text: \`Coupon "\${inputCoupon.toUpperCase()}" applied successfully!\`, error: false });
      setInputCoupon("");
    } else {
      setCouponMsg({ text: res.error || "Invalid coupon code", error: true });
    }
    setApplyingCoupon(false);
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-10 h-10 text-neutral-400" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-gray-900 mb-3">
          Your Shopping Bag is Empty
        </h1>
        <p className="text-gray-500 max-w-md mx-auto mb-8 text-sm">
          Looks like you haven't added any items yet. Explore our latest arrivals and elevate your wardrobe.
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-black text-white font-bold rounded-full hover:bg-neutral-800 transition shadow-lg text-sm"
        >
          <span>Explore Shop</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <div className="border-b border-gray-100 pb-6 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900">
            Shopping Bag
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {totalCount} {totalCount === 1 ? "item" : "items"} in your order
          </p>
        </div>
        <Link
          href="/shop"
          className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-black transition"
        >
          <span>Continue Shopping</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-6">
          <div className="divide-y divide-gray-100 border-t border-b border-gray-100">
            {items.map((cartItem) => {
              const { product, quantity } = cartItem;
              const unitPrice = product.discount_price || product.price;
              const lineTotal = unitPrice * quantity;

              return (
                <div key={product.id} className="py-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
                  <div className="flex gap-4 items-center">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 shrink-0 p-2 flex items-center justify-center">
                      <img
                        src={formatMediaUrl(product.image)}
                        alt={product.title}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div className="space-y-1">
                      <Link
                        href={\`/product/\${product.slug}\`}
                        className="font-bold text-gray-900 hover:underline line-clamp-1 text-base"
                      >
                        {product.title}
                      </Link>
                      {product.category_title && (
                        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                          {product.category_title}
                        </p>
                      )}
                      <div className="text-sm font-semibold text-gray-900 pt-0.5">
                        \${unitPrice.toFixed(2)}
                        {product.discount_price && (
                          <span className="text-xs text-gray-400 line-through ml-2">
                            \${product.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full sm:w-auto gap-6">
                    <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 overflow-hidden">
                      <button
                        onClick={() => updateQuantity(product.id, quantity - 1, product.slug)}
                        disabled={isLoading}
                        className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 transition disabled:opacity-40"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-10 text-center text-sm font-semibold text-gray-900">
                        {quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(product.id, quantity + 1, product.slug)}
                        disabled={isLoading}
                        className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 transition disabled:opacity-40"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-right min-w-[70px]">
                      <span className="text-base font-bold text-gray-900">
                        \${lineTotal.toFixed(2)}
                      </span>
                    </div>

                    <button
                      onClick={() => removeFromCart(product.id, product.slug)}
                      disabled={isLoading}
                      className="p-2 text-gray-400 hover:text-red-600 transition rounded-lg hover:bg-red-50"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-gray-50 rounded-3xl p-6 sm:p-8 border border-gray-200/80 space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Order Summary</h2>

            <form onSubmit={handleApplyCoupon} className="space-y-2">
              <label htmlFor="coupon" className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Discount Coupon
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
                  <input
                    id="coupon"
                    type="text"
                    placeholder="e.g. SAVE10"
                    value={inputCoupon}
                    onChange={(e) => setInputCoupon(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm uppercase font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <button
                  type="submit"
                  disabled={applyingCoupon || !inputCoupon.trim()}
                  className="px-4 py-2.5 bg-black text-white text-xs font-bold rounded-xl hover:bg-neutral-800 disabled:opacity-50 transition"
                >
                  {applyingCoupon ? "..." : "Apply"}
                </button>
              </div>

              {couponMsg && (
                <div
                  className={\`flex items-center gap-1.5 text-xs p-2 rounded-lg mt-1 \${
                    couponMsg.error
                      ? "bg-red-50 text-red-700 border border-red-200"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }\`}
                >
                  {couponMsg.error ? (
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span>{couponMsg.text}</span>
                </div>
              )}

              {couponCode && !couponMsg && (
                <div className="flex items-center justify-between text-xs bg-emerald-50 text-emerald-800 p-2 rounded-lg border border-emerald-200">
                  <span className="font-semibold">Coupon applied: {couponCode}</span>
                  <span className="font-bold">-\${discount.toFixed(2)}</span>
                </div>
              )}
            </form>

            <div className="space-y-3 pt-4 border-t border-gray-200 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-900">\${subtotal.toFixed(2)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Coupon Discount</span>
                  <span>-\${discount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-600">
                <span>Estimated Shipping</span>
                <span className="text-emerald-600 font-semibold">FREE</span>
              </div>

              <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-black text-gray-900">
                <span>Total</span>
                <span>\${total.toFixed(2)}</span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="w-full bg-black text-white py-4 rounded-xl font-bold text-sm hover:bg-neutral-800 transition flex items-center justify-center gap-2 shadow-lg"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <p className="text-[11px] text-gray-500 text-center leading-relaxed">
              Taxes calculated during checkout. By proceeding, you agree to The Vibe Terms & Conditions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
`;

// 6. CheckoutView
files['src/components/CheckoutView.tsx'] = `"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { submitCheckout, submitPayment, formatMediaUrl } from "@/lib/api";
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShoppingBag,
  Lock,
} from "lucide-react";

const COUNTRY_OPTIONS = [
  { code: "US", name: "United States" },
  { code: "IN", name: "India" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "SG", name: "Singapore" },
];

export default function CheckoutView() {
  const router = useRouter();
  const { items, subtotal, discount, total, clearCart } = useCart();
  const { user, token } = useAuth();

  const [formData, setFormData] = useState({
    street_address: "",
    apartment_address: "",
    country: "US",
    zip: "",
  });

  const [cardNumber, setCardNumber] = useState("4242 •••• •••• 4242");
  const [expiry, setExpiry] = useState("12/28");
  const [cvc, setCvc] = useState("123");

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<{
    ref_code: string;
    total: number;
  } | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setErrorMsg("Please sign in or create an account to complete checkout.");
      return;
    }

    if (!formData.street_address || !formData.zip || !formData.country) {
      setErrorMsg("Please fill in all required shipping address fields.");
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const checkoutRes = await submitCheckout(token, {
        street_address: formData.street_address,
        apartment_address: formData.apartment_address,
        country: formData.country,
        zip: formData.zip,
      });

      if (checkoutRes.error || !checkoutRes.order) {
        setIsProcessing(false);
        setErrorMsg(checkoutRes.error || "Failed to save shipping address.");
        return;
      }

      const paymentRes = await submitPayment(token, "tok_visa");

      if (paymentRes.error) {
        setIsProcessing(false);
        setErrorMsg(paymentRes.error || "Payment transaction declined.");
        return;
      }

      const finalOrder = paymentRes.order || checkoutRes.order;
      setOrderSuccess({
        ref_code: finalOrder.ref_code || "VIBE-" + Math.random().toString(36).substring(2, 9).toUpperCase(),
        total: finalOrder.total || total,
      });
      clearCart();
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred during checkout.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
          Payment Verified
        </span>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 mt-2 mb-4">
          Thank you for your order!
        </h1>
        <p className="text-gray-600 text-sm max-w-md mx-auto mb-6 leading-relaxed">
          Your order has been placed and is being prepared. You will receive an email confirmation with tracking details.
        </p>

        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 max-w-md mx-auto mb-8 text-left space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 font-medium">Order Reference:</span>
            <span className="font-mono font-bold text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200">
              {orderSuccess.ref_code}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 font-medium">Amount Paid:</span>
            <span className="font-bold text-gray-900">\${orderSuccess.total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 font-medium">Payment Status:</span>
            <span className="text-emerald-700 font-semibold">Completed (Stripe Verified)</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/orders"
            className="px-8 py-3.5 bg-black text-white font-bold rounded-full hover:bg-neutral-800 transition text-sm flex items-center justify-center gap-2"
          >
            <span>View My Orders</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/shop"
            className="px-8 py-3.5 border border-gray-300 text-gray-800 font-bold rounded-full hover:bg-gray-100 transition text-sm flex items-center justify-center"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Bag is Empty</h2>
        <p className="text-sm text-gray-500 mb-6">
          Add items to your bag before proceeding to checkout.
        </p>
        <Link
          href="/shop"
          className="px-6 py-3 bg-black text-white rounded-full font-bold text-sm hover:bg-neutral-800 transition inline-block"
        >
          Return to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <div className="border-b border-gray-100 pb-6 mb-8">
        <h1 className="text-3xl font-black tracking-tight text-gray-900">
          Secure Checkout
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Complete your shipping and payment information below.
        </p>
      </div>

      {!user && (
        <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-900">
                You are currently checking out as a guest.
              </p>
              <p className="text-xs text-amber-700">
                Sign in to link this order to your account and track its shipping status.
              </p>
            </div>
          </div>
          <Link
            href={\`/login?redirect=/checkout\`}
            className="px-4 py-2 bg-black text-white text-xs font-bold rounded-xl hover:bg-neutral-800 transition shrink-0"
          >
            Sign In Now
          </Link>
        </div>
      )}

      {errorMsg && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/80 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-black text-white text-xs flex items-center justify-center">
                  1
                </span>
                Shipping Address
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                  Street Address *
                </label>
                <input
                  type="text"
                  name="street_address"
                  required
                  placeholder="123 Main St"
                  value={formData.street_address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                  Apartment, Suite, Unit (Optional)
                </label>
                <input
                  type="text"
                  name="apartment_address"
                  placeholder="Apt 4B"
                  value={formData.apartment_address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                    Country *
                  </label>
                  <select
                    name="country"
                    required
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    {COUNTRY_OPTIONS.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                    Postal / ZIP Code *
                  </label>
                  <input
                    type="text"
                    name="zip"
                    required
                    placeholder="10001"
                    value={formData.zip}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/80 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-black text-white text-xs flex items-center justify-center">
                  2
                </span>
                Payment Information
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>256-bit Encrypted</span>
              </div>
            </div>

            <div className="p-4 bg-neutral-900 text-white rounded-2xl space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-indigo-400" />
                  <span className="text-xs font-bold tracking-wider uppercase text-neutral-300">
                    Stripe Test Card
                  </span>
                </div>
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-semibold">
                  Test Gateway Active
                </span>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                  Card Number
                </label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm font-mono tracking-wider focus:outline-none focus:border-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                    Expires
                  </label>
                  <input
                    type="text"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm font-mono tracking-wider focus:outline-none focus:border-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                    CVC
                  </label>
                  <input
                    type="text"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value)}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm font-mono tracking-wider focus:outline-none focus:border-white"
                  />
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-500">
              Note: This test checkout automatically simulates a successful Stripe token capture (<code>tok_visa</code>). No real credit card charge occurs.
            </p>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-gray-50 rounded-3xl p-6 sm:p-8 border border-gray-200/80 space-y-6 sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-3">
              Order Review
            </h2>

            <div className="max-h-60 overflow-y-auto divide-y divide-gray-200 pr-1">
              {items.map((cartItem) => (
                <div key={cartItem.product.id} className="py-3 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 p-1 flex items-center justify-center shrink-0">
                      <img
                        src={formatMediaUrl(cartItem.product.image)}
                        alt={cartItem.product.title}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 line-clamp-1">
                        {cartItem.product.title}
                      </p>
                      <p className="text-xs text-gray-500">Qty: {cartItem.quantity}</p>
                    </div>
                  </div>
                  <span className="font-bold text-gray-900">
                    \$
                    {(
                      (cartItem.product.discount_price || cartItem.product.price) *
                      cartItem.quantity
                    ).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-3 border-t border-gray-200 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-medium text-gray-900">\${subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Coupon Discount</span>
                  <span>-\${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="text-emerald-600 font-semibold">FREE</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between text-xl font-black text-gray-900">
                <span>Total</span>
                <span>\${total.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full bg-black text-white py-4 rounded-xl font-bold text-sm hover:bg-neutral-800 transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            >
              {isProcessing ? (
                <span>Processing Order...</span>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Place Order • \${total.toFixed(2)}</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-gray-500 text-center">
              By placing your order, you agree to our Terms of Use and Privacy Policy.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
`;

// 7. OrdersView
files['src/components/OrdersView.tsx'] = `"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getUserOrders, formatMediaUrl } from "@/lib/api";
import { CartOrder } from "@/types";
import { Package, Truck, CheckCircle2, RotateCcw, ArrowRight, Clock } from "lucide-react";

export default function OrdersView() {
  const { user, token, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<CartOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      if (!token) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const data = await getUserOrders(token);
        setOrders(data);
      } catch (err) {
        console.error("Failed to fetch user orders:", err);
      } finally {
        setIsLoading(false);
      }
    }

    if (!authLoading) {
      fetchOrders();
    }
  }, [token, authLoading]);

  if (authLoading || isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-black border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-sm text-gray-500">Loading your orders...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in to view orders</h2>
        <p className="text-sm text-gray-500 mb-6">
          You must be logged in to view your past orders and request refunds.
        </p>
        <Link
          href="/login?redirect=/orders"
          className="px-6 py-3 bg-black text-white rounded-full font-bold text-sm hover:bg-neutral-800 transition inline-block"
        >
          Sign In
        </Link>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Package className="w-10 h-10 text-neutral-400" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-gray-900 mb-3">
          No Orders Yet
        </h1>
        <p className="text-gray-500 max-w-md mx-auto mb-8 text-sm">
          You haven't placed any orders with this account yet. Discover our latest collection and make your first order today!
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-black text-white font-bold rounded-full hover:bg-neutral-800 transition shadow-lg text-sm"
        >
          <span>Start Shopping</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <div className="border-b border-gray-100 pb-6 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900">
            Order History
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Review past orders, tracking statuses, and refunds.
          </p>
        </div>
        <Link
          href="/shop"
          className="text-sm font-semibold text-gray-600 hover:text-black transition"
        >
          Back to Shop
        </Link>
      </div>

      <div className="space-y-6">
        {orders.map((order) => {
          const dateStr = order.ordered_date
            ? new Date(order.ordered_date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "Recently Placed";

          return (
            <div
              key={order.id}
              className="bg-white border border-gray-200/90 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition"
            >
              <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-6">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-400">
                      Order Reference
                    </span>
                    <p className="font-mono font-bold text-sm text-gray-900">
                      {order.ref_code || \`#\${order.id}\`}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-400">
                      Date Placed
                    </span>
                    <p className="text-sm font-medium text-gray-700">{dateStr}</p>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-400">
                      Total
                    </span>
                    <p className="text-sm font-bold text-gray-900">
                      \${order.total ? order.total.toFixed(2) : "0.00"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {order.refund_granted ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                      <RotateCcw className="w-3.5 h-3.5" />
                      Refund Granted
                    </span>
                  ) : order.refund_requested ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      <Clock className="w-3.5 h-3.5" />
                      Refund Pending
                    </span>
                  ) : order.received ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Delivered
                    </span>
                  ) : order.being_delivered ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                      <Truck className="w-3.5 h-3.5" />
                      In Transit
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Confirmed
                    </span>
                  )}
                </div>
              </div>

              <div className="p-6 divide-y divide-gray-100">
                {order.items?.map((item) => (
                  <div
                    key={item.id}
                    className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-50 rounded-xl border border-gray-100 p-1 flex items-center justify-center shrink-0">
                        <img
                          src={formatMediaUrl(item.item?.image)}
                          alt={item.item?.title || "Product"}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <Link
                          href={\`/product/\${item.item?.slug}\`}
                          className="font-bold text-gray-900 hover:underline text-sm line-clamp-1"
                        >
                          {item.item?.title}
                        </Link>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Quantity: {item.quantity} × \${item.final_price?.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <span className="font-bold text-sm text-gray-900">
                      \${(item.final_price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50/50 px-6 py-3.5 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs text-gray-500">
                <div>
                  {order.billing_address ? (
                    <span>
                      Shipping to: {order.billing_address.street_address},{" "}
                      {order.billing_address.country} {order.billing_address.zip}
                    </span>
                  ) : (
                    <span>Standard Shipping</span>
                  )}
                </div>

                {!order.refund_requested && !order.refund_granted && (
                  <Link
                    href={\`/refund?ref=\${order.ref_code || ""}\`}
                    className="font-semibold text-gray-700 hover:text-red-600 transition flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Request Refund</span>
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
`;

// 8. RefundView
files['src/components/RefundView.tsx'] = `"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { submitRefundRequest } from "@/lib/api";
import { RotateCcw, CheckCircle2, AlertCircle } from "lucide-react";

export default function RefundView() {
  const searchParams = useSearchParams();
  const initialRef = searchParams.get("ref") || "";
  const { user, token } = useAuth();

  const [refCode, setRefCode] = useState(initialRef);
  const [email, setEmail] = useState(user?.email || "");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ success: boolean; msg: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setStatus({ success: false, msg: "Please sign in to submit a refund request." });
      return;
    }

    if (!refCode || !reason || !email) {
      setStatus({ success: false, msg: "Please fill out all required fields." });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    const res = await submitRefundRequest(token, refCode, reason, email);
    setIsSubmitting(false);

    if (res.success) {
      setStatus({
        success: true,
        msg: "Your refund request has been received. Our team will review your order details and contact you shortly.",
      });
      setReason("");
    } else {
      setStatus({
        success: false,
        msg: res.error || "Failed to submit refund request. Please verify the order reference code.",
      });
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white border border-gray-200/80 rounded-3xl p-8 shadow-sm">
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <RotateCcw className="w-6 h-6 text-gray-700" />
        </div>
        <h1 className="text-2xl font-black text-gray-900">Request a Refund</h1>
        <p className="text-xs text-gray-500 mt-1">
          Enter your order reference code and the reason for the return or refund.
        </p>
      </div>

      {status && (
        <div
          className={\`mb-6 p-4 rounded-2xl flex items-start gap-3 text-sm \${
            status.success
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }\`}
        >
          {status.success ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <span>{status.msg}</span>
        </div>
      )}

      {status?.success ? (
        <div className="text-center pt-2">
          <Link
            href="/orders"
            className="px-6 py-3 bg-black text-white font-bold rounded-full hover:bg-neutral-800 transition text-sm inline-block"
          >
            Back to Orders
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
              Order Reference Code *
            </label>
            <input
              type="text"
              required
              value={refCode}
              onChange={(e) => setRefCode(e.target.value)}
              placeholder="e.g. VIBE-ABC123XYZ"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-black uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
              Contact Email *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
              Reason for Refund *
            </label>
            <textarea
              required
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please explain why you are requesting a refund or replacement..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-black text-white font-bold rounded-xl hover:bg-neutral-800 transition text-sm shadow-md disabled:opacity-50"
          >
            {isSubmitting ? "Submitting Request..." : "Submit Refund Request"}
          </button>
        </form>
      )}
    </div>
  );
}
`;

// 9. LoginView
files['src/components/LoginView.tsx'] = `"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Lock, User as UserIcon, AlertCircle, ArrowRight } from "lucide-react";

export default function LoginView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/shop";
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    const res = await login(username, password);
    if (!res.success) {
      setErrorMsg(res.error || "Invalid username or password");
      setIsSubmitting(false);
      return;
    }

    router.push(redirectUrl);
  };

  return (
    <div className="w-full max-w-md bg-white border border-gray-200/80 rounded-3xl p-8 shadow-xl">
      <div className="text-center mb-8">
        <span className="text-2xl font-black tracking-tight text-black">
          <span className="text-3xl font-extrabold text-indigo-600">T</span>HE VIBE
        </span>
        <h1 className="text-2xl font-black text-gray-900 mt-3">Welcome Back</h1>
        <p className="text-xs text-gray-500 mt-1">
          Sign in to access your orders, saved addresses, and bag.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
            Username
          </label>
          <div className="relative">
            <UserIcon className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. testuser"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-2 py-3.5 bg-black text-white font-bold rounded-xl hover:bg-neutral-800 transition flex items-center justify-center gap-2 text-sm shadow-md disabled:opacity-50"
        >
          {isSubmitting ? (
            <span>Signing in...</span>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 text-center text-xs text-gray-500 border-t border-gray-100 pt-6">
        Don't have an account?{" "}
        <Link
          href={\`/register\${redirectUrl !== "/shop" ? \`?redirect=\${redirectUrl}\` : ""}\`}
          className="font-bold text-black hover:underline"
        >
          Create one now
        </Link>
      </div>
    </div>
  );
}
`;

// 10. RegisterView
files['src/components/RegisterView.tsx'] = `"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Lock, User as UserIcon, Mail, AlertCircle, ArrowRight } from "lucide-react";

export default function RegisterView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/shop";
  const { register } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long");
      return;
    }

    setIsSubmitting(true);

    const res = await register(username, email, password);
    if (!res.success) {
      setErrorMsg(res.error || "Registration failed. Try a different username or email.");
      setIsSubmitting(false);
      return;
    }

    router.push(redirectUrl);
  };

  return (
    <div className="w-full max-w-md bg-white border border-gray-200/80 rounded-3xl p-8 shadow-xl">
      <div className="text-center mb-8">
        <span className="text-2xl font-black tracking-tight text-black">
          <span className="text-3xl font-extrabold text-indigo-600">T</span>HE VIBE
        </span>
        <h1 className="text-2xl font-black text-gray-900 mt-3">Create an Account</h1>
        <p className="text-xs text-gray-500 mt-1">
          Join The Vibe to track orders and enjoy personalized checkout.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
            Username *
          </label>
          <div className="relative">
            <UserIcon className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. johndoe"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
            Email Address *
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. john@example.com"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
            Password *
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
            Confirm Password *
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-2 py-3.5 bg-black text-white font-bold rounded-xl hover:bg-neutral-800 transition flex items-center justify-center gap-2 text-sm shadow-md disabled:opacity-50"
        >
          {isSubmitting ? (
            <span>Creating account...</span>
          ) : (
            <>
              <span>Create Account</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 text-center text-xs text-gray-500 border-t border-gray-100 pt-6">
        Already have an account?{" "}
        <Link
          href={\`/login\${redirectUrl !== "/shop" ? \`?redirect=\${redirectUrl}\` : ""}\`}
          className="font-bold text-black hover:underline"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
`;

// 11. Home page
files['src/app/page.tsx'] = `import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles, ShieldCheck, Truck, RefreshCw, Layers } from "lucide-react";
import { getCategories, getProducts, getSlides, formatMediaUrl } from "@/lib/api";
import ProductCard from "@/components/ProductCard";

export const revalidate = 0;

export default async function HomePage() {
  const [slides, categories, products] = await Promise.all([
    getSlides(),
    getCategories(),
    getProducts(),
  ]);

  const activeSlide = slides.find((s) => s.is_active) || slides[0];
  const featuredProducts = products.slice(0, 8);

  return (
    <div className="flex flex-col min-h-screen">
      <section className="relative bg-gradient-to-br from-neutral-900 via-neutral-950 to-black text-white overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="max-w-xl text-center md:text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-800/80 border border-neutral-700 text-xs font-semibold tracking-wider uppercase text-neutral-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>New Season Arrivals</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
              Wear the statement. <br />
              <span className="bg-gradient-to-r from-white via-neutral-200 to-neutral-500 bg-clip-text text-transparent">
                Feel the vibe.
              </span>
            </h1>

            <p className="text-neutral-400 text-base sm:text-lg leading-relaxed">
              Explore meticulously crafted streetwear, premium hoodies, and essentials tailored for those who make their own rules.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start pt-2">
              <Link
                href="/shop"
                className="w-full sm:w-auto px-8 py-3.5 bg-white text-black font-semibold rounded-full hover:bg-neutral-200 transition shadow-lg shadow-white/10 flex items-center justify-center gap-2 group"
              >
                <span>Shop Collection</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </Link>
              <Link
                href="/shop?category=hoodiessweatshirts"
                className="w-full sm:w-auto px-8 py-3.5 border border-neutral-700 text-white font-semibold rounded-full hover:bg-neutral-900 transition flex items-center justify-center"
              >
                Explore Hoodies
              </Link>
            </div>
          </div>

          <div className="relative w-full max-w-md aspect-square rounded-3xl overflow-hidden border border-neutral-800 shadow-2xl bg-neutral-900/60 backdrop-blur-sm group">
            {activeSlide?.image ? (
              <Image
                src={formatMediaUrl(activeSlide.image)}
                alt={activeSlide.caption1 || "The Vibe Style"}
                fill
                className="object-cover group-hover:scale-105 transition duration-700"
                priority
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-neutral-800 to-neutral-900">
                <span className="text-5xl font-black tracking-widest text-neutral-600 mb-2">THE VIBE</span>
                <p className="text-sm text-neutral-400">Premium Apparel & Streetwear</p>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-6">
              <div>
                <p className="text-xs uppercase tracking-widest text-neutral-400">Featured</p>
                <h3 className="text-lg font-bold text-white">
                  {activeSlide?.caption1 || "Signature Drop 2026"}
                </h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-gray-100 bg-neutral-50/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">Free Shipping</h4>
                <p className="text-xs text-gray-500">On all orders over $100</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">Secure Payments</h4>
                <p className="text-xs text-gray-500">Encrypted checkout</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">Easy Returns</h4>
                <p className="text-xs text-gray-500">30-day money back guarantee</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">Premium Quality</h4>
                <p className="text-xs text-gray-500">High-grade textiles</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10">
              <div>
                <span className="text-xs font-bold tracking-widest text-indigo-600 uppercase">
                  Categories
                </span>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 mt-1">
                  Shop by Department
                </h2>
              </div>
              <Link
                href="/shop"
                className="text-sm font-semibold text-gray-700 hover:text-black mt-2 sm:mt-0 flex items-center gap-1 group"
              >
                <span>Browse All</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={\`/shop?category=\${cat.slug}\`}
                  className="group relative rounded-2xl overflow-hidden bg-gray-100 aspect-square flex flex-col justify-end p-6 border border-gray-100 hover:shadow-xl transition-all duration-300"
                >
                  {cat.image ? (
                    <Image
                      src={formatMediaUrl(cat.image)}
                      alt={cat.title}
                      fill
                      className="object-cover group-hover:scale-105 transition duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-neutral-900 group-hover:bg-neutral-800 transition" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="relative z-10">
                    <h3 className="text-lg font-bold text-white tracking-wide">
                      {cat.title}
                    </h3>
                    {cat.description && (
                      <p className="text-xs text-gray-300 line-clamp-1 mt-0.5">
                        {cat.description}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-16 md:py-24 bg-neutral-50/60 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12">
            <div>
              <span className="text-xs font-bold tracking-widest text-indigo-600 uppercase">
                Trending Now
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 mt-1">
                Featured Products
              </h2>
            </div>
            <Link
              href="/shop"
              className="text-sm font-semibold text-gray-700 hover:text-black mt-2 sm:mt-0 flex items-center gap-1 group"
            >
              <span>View All Products</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
            </Link>
          </div>

          {featuredProducts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
              <p className="text-gray-500 font-medium">No products found in catalog.</p>
              <p className="text-xs text-gray-400 mt-1">
                Make sure products are added and active in Django admin.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-16 bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-neutral-900 border border-neutral-800 p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-xl space-y-4 text-center md:text-left">
              <span className="text-xs uppercase tracking-widest text-neutral-400 font-bold">
                Special Offer
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                Use Code <span className="text-indigo-400 font-mono">SAVE10</span> for $10 Off
              </h2>
              <p className="text-neutral-400 text-sm sm:text-base">
                Apply this promo coupon at checkout on any qualifying order. Hand-stitched essentials made to endure.
              </p>
            </div>

            <div>
              <Link
                href="/shop"
                className="px-8 py-3.5 bg-white text-black font-bold rounded-full hover:bg-neutral-200 transition shadow-lg shrink-0 inline-block text-center"
              >
                Shop The Sale
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
`;

// 12. Pages with dynamic import of views
files['src/app/cart/page.tsx'] = `import CartView from "@/components/CartView";

export const dynamic = "force-dynamic";

export default function CartPage() {
  return <CartView />;
}
`;

files['src/app/checkout/page.tsx'] = `import CheckoutView from "@/components/CheckoutView";

export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  return <CheckoutView />;
}
`;

files['src/app/orders/page.tsx'] = `import OrdersView from "@/components/OrdersView";

export const dynamic = "force-dynamic";

export default function OrdersPage() {
  return <OrdersView />;
}
`;

files['src/app/refund/page.tsx'] = `import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import RefundView from "@/components/RefundView";

export const dynamic = "force-dynamic";

export default function RefundPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link
        href="/orders"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 transition font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Orders</span>
      </Link>
      <Suspense fallback={<div className="text-sm text-gray-500">Loading refund form...</div>}>
        <RefundView />
      </Suspense>
    </div>
  );
}
`;

files['src/app/login/page.tsx'] = `import { Suspense } from "react";
import LoginView from "@/components/LoginView";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12 bg-neutral-50/50">
      <Suspense fallback={<div className="text-sm text-gray-500">Loading sign in...</div>}>
        <LoginView />
      </Suspense>
    </div>
  );
}
`;

files['src/app/register/page.tsx'] = `import { Suspense } from "react";
import RegisterView from "@/components/RegisterView";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12 bg-neutral-50/50">
      <Suspense fallback={<div className="text-sm text-gray-500">Loading registration...</div>}>
        <RegisterView />
      </Suspense>
    </div>
  );
}
`;

// Write all files
for (const [relPath, content] of Object.entries(files)) {
  const fullPath = path.join(root, relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Wrote:', relPath, 'Length:', content.length);
}

// Immediately commit to Git to lock it against IDE overwrites
console.log('Committing to Git...');
execSync('git add -A', { stdio: 'inherit' });
execSync('git commit -m "Complete e-commerce frontend components, pages, and contexts"', { stdio: 'inherit' });
console.log('Successfully written and committed all files!');
