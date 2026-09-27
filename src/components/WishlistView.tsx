"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Heart, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import { formatMediaUrl } from "@/lib/api";
import { Product } from "@/types";

export default function WishlistView() {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { formatPrice } = useCurrency();
  const [movingSlug, setMovingSlug] = useState<string | null>(null);

  const handleMoveToCart = async (product: Product) => {
    setMovingSlug(product.slug);
    await addToCart(product, 1);
    await removeFromWishlist(product.slug);
    setMovingSlug(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
      {/* Header */}
      <div className="border-b border-gray-100 pb-6 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
              <Heart className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
                My Wishlist
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {wishlist.length} {wishlist.length === 1 ? "item" : "items"} saved for later
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/shop"
          className="text-xs font-semibold text-gray-600 hover:text-black flex items-center gap-1.5 transition"
        >
          <span>Continue Shopping</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {wishlist.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-12 md:p-16 text-center max-w-lg mx-auto shadow-2xs">
          <div className="w-16 h-16 bg-red-50 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Your wishlist is empty</h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Explore our collections and tap the heart icon on any product to save your favorites here.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-neutral-800 transition shadow-xs"
          >
            <span>Browse Products</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.map((item) => {
            const imgUrl = formatMediaUrl(item.image);
            const isMoving = movingSlug === item.slug;

            return (
              <div
                key={item.id || item.slug}
                className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-all flex flex-col justify-between group"
              >
                {/* Image & Remove */}
                <div className="relative aspect-square bg-gray-50 overflow-hidden">
                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromWishlist(item.slug)}
                    title="Remove from wishlist"
                    className="absolute top-3 right-3 z-10 p-2 bg-white/90 backdrop-blur-xs text-gray-400 hover:text-red-500 rounded-full transition shadow-xs"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imgUrl}
                    alt={item.title}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>

                {/* Details */}
                <div className="p-5 flex flex-col flex-grow justify-between">
                  <div>
                    {item.category_title && (
                      <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1">
                        {item.category_title}
                      </p>
                    )}
                    <h3 className="font-semibold text-gray-900 line-clamp-1 hover:text-black">
                      <Link href={`/product/${item.slug}`}>{item.title}</Link>
                    </h3>

                    {/* Price */}
                    <div className="mt-2 flex items-baseline gap-2">
                      {item.discount_price ? (
                        <>
                          <span className="text-lg font-bold text-red-600">
                            {formatPrice(item.discount_price)}
                          </span>
                          <span className="text-xs text-gray-400 line-through">
                            {formatPrice(item.price)}
                          </span>
                        </>
                      ) : (
                        <span className="text-lg font-bold text-gray-900">
                          {formatPrice(item.price)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 pt-4 border-t border-gray-100 flex gap-2">
                    <button
                      onClick={() => handleMoveToCart(item)}
                      disabled={isMoving}
                      className="flex-1 bg-black hover:bg-neutral-800 text-white font-semibold text-xs py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{isMoving ? "Moving..." : "Move to Cart"}</span>
                    </button>
                    <Link
                      href={`/product/${item.slug}`}
                      className="px-3 py-2.5 border border-gray-200 hover:border-black text-gray-700 hover:text-black text-xs font-semibold rounded-xl transition"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
