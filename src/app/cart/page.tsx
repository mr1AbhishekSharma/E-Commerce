"use client";

import Link from "next/link";
import { ArrowLeft, ShoppingBag } from "lucide-react";

export default function CartPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="border-b border-gray-100 pb-6 mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
          Shopping Cart
        </h1>
        <Link
          href="/shop"
          className="text-sm font-semibold text-gray-600 hover:text-black flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Continue Shopping</span>
        </Link>
      </div>

      <div className="text-center py-16 bg-neutral-50 rounded-2xl border border-gray-100 space-y-4">
        <div className="w-16 h-16 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">Your cart is ready</h3>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          Browse our collections and add your favorite items to begin checkout.
        </p>
        <div className="pt-2">
          <Link
            href="/shop"
            className="inline-block bg-black text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-neutral-800 transition shadow"
          >
            Explore Catalog
          </Link>
        </div>
      </div>
    </div>
  );
}
