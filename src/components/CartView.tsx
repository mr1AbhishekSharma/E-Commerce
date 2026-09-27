"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
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

  const { formatPrice } = useCurrency();

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
      setCouponMsg({ text: `Coupon "${inputCoupon.toUpperCase()}" applied successfully!`, error: false });
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
          Looks like you haven&apos;t added any items yet. Explore our latest arrivals and elevate your wardrobe.
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
        {/* Cart Items List */}
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
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={formatMediaUrl(product.image)}
                        alt={product.title}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div className="space-y-1">
                      <Link
                        href={`/product/${product.slug}`}
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
                        {formatPrice(unitPrice)}
                        {product.discount_price && (
                          <span className="text-xs text-gray-400 line-through ml-2">
                            {formatPrice(product.price)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quantity & Actions */}
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
                        {formatPrice(lineTotal)}
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

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 rounded-3xl p-6 sm:p-8 border border-gray-200/80 space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Order Summary</h2>

            {/* Coupon Code Input */}
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
                  className={`flex items-center gap-1.5 text-xs p-2 rounded-lg mt-1 ${
                    couponMsg.error
                      ? "bg-red-50 text-red-700 border border-red-200"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }`}
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
                  <span className="font-bold">-{formatPrice(discount)}</span>
                </div>
              )}
            </form>

            {/* Calculations Breakdown */}
            <div className="space-y-3 pt-4 border-t border-gray-200 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-900">{formatPrice(subtotal)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Coupon Discount</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-600">
                <span>Estimated Shipping</span>
                <span className="text-emerald-600 font-semibold">FREE</span>
              </div>

              <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-black text-gray-900">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            {/* Checkout CTA */}
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
