"use client";

import Link from "next/link";
import { Product } from "@/types";
import { formatMediaUrl } from "@/lib/api";
import { useCurrency } from "@/context/CurrencyContext";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const imageUrl = formatMediaUrl(product.image);
  const { formatPrice } = useCurrency();

  return (
    <div className="group relative bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
      {/* Product Image & Badges */}
      <div className="relative aspect-square w-full bg-gray-50 overflow-hidden">
        {/* Badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
          {product.label === "S" && (
            <span className="bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Sale
            </span>
          )}
          {product.label === "N" && (
            <span className="bg-blue-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              New
            </span>
          )}
          {product.label === "P" && (
            <span className="bg-amber-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Promo
            </span>
          )}
        </div>

        {/* Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={product.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Hover Quick Action */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
          <Link
            href={`/product/${product.slug}`}
            className="w-full bg-white text-black text-center py-2.5 rounded-lg text-sm font-semibold shadow hover:bg-black hover:text-white transition"
          >
            View Details
          </Link>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4 flex flex-col flex-grow justify-between">
        <div>
          {product.category_title && (
            <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1">
              {product.category_title}
            </p>
          )}
          <h3 className="text-sm font-semibold text-gray-900 group-hover:text-black line-clamp-1">
            <Link href={`/product/${product.slug}`}>{product.title}</Link>
          </h3>
          {product.description_short && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              {product.description_short}
            </p>
          )}
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          {product.discount_price ? (
            <>
              <span className="text-base font-bold text-red-600">
                {formatPrice(product.discount_price)}
              </span>
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(product.price)}
              </span>
            </>
          ) : (
            <span className="text-base font-bold text-gray-900">
              {formatPrice(product.price)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
