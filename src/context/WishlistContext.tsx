"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Product } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { getWishlist, toggleWishlistApi, removeFromWishlistApi } from "@/lib/api";

interface WishlistContextType {
  wishlist: Product[];
  wishlistCount: number;
  isInWishlist: (slug: string) => boolean;
  toggleWishlist: (product: Product) => Promise<void>;
  removeFromWishlist: (slug: string) => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  const [wishlist, setWishlist] = useState<Product[]>([]);

  // Load wishlist on startup or auth change
  useEffect(() => {
    async function load() {
      if (token) {
        try {
          const items = await getWishlist(token);
          setWishlist(items.map((wi) => wi.item));
        } catch (e) {
          console.error("Failed to load wishlist from server", e);
        }
      } else {
        // Fallback to local storage for guests
        try {
          const localData = localStorage.getItem("vibe_wishlist");
          if (localData) {
            setWishlist(JSON.parse(localData));
          }
        } catch (e) {
          console.error("Failed to parse local wishlist", e);
        }
      }
    }
    load();
  }, [token]);

  // Sync to local storage whenever wishlist changes (for guests or offline cache)
  const saveLocalWishlist = (items: Product[]) => {
    try {
      localStorage.setItem("vibe_wishlist", JSON.stringify(items));
    } catch (e) {
      console.error("Local storage error:", e);
    }
  };

  const isInWishlist = (slug: string) => {
    return wishlist.some((item) => item.slug === slug);
  };

  const toggleWishlist = async (product: Product) => {
    const exists = isInWishlist(product.slug);

    if (exists) {
      await removeFromWishlist(product.slug);
    } else {
      const updated = [...wishlist, product];
      setWishlist(updated);
      saveLocalWishlist(updated);

      if (token) {
        try {
          await toggleWishlistApi(token, product.slug);
        } catch (e) {
          console.error("Server wishlist toggle error:", e);
        }
      }
    }
  };

  const removeFromWishlist = async (slug: string) => {
    const updated = wishlist.filter((item) => item.slug !== slug);
    setWishlist(updated);
    saveLocalWishlist(updated);

    if (token) {
      try {
        await removeFromWishlistApi(token, slug);
      } catch (e) {
        console.error("Server wishlist remove error:", e);
      }
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistCount: wishlist.length,
        isInWishlist,
        toggleWishlist,
        removeFromWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
