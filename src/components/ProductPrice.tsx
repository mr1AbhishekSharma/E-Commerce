"use client";

import { useCurrency } from "@/context/CurrencyContext";

interface ProductPriceProps {
  price: number;
  discountPrice?: number | null;
}

export default function ProductPrice({ price, discountPrice }: ProductPriceProps) {
  const { formatPrice } = useCurrency();

  return (
    <div className="flex items-baseline gap-3 pt-1">
      {discountPrice ? (
        <>
          <span className="text-3xl font-black text-red-600">
            {formatPrice(discountPrice)}
          </span>
          <span className="text-xl text-gray-400 line-through">
            {formatPrice(price)}
          </span>
          <span className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
            Save {formatPrice(price - discountPrice)}
          </span>
        </>
      ) : (
        <span className="text-3xl font-black text-gray-900">
          {formatPrice(price)}
        </span>
      )}
    </div>
  );
}
