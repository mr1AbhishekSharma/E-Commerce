"use client";

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
          className={`flex-1 py-3.5 px-6 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-md ${
            added
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "bg-black text-white hover:bg-neutral-800 disabled:opacity-60"
          }`}
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
