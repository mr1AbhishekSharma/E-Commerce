"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";
import { getUserOrders, formatMediaUrl } from "@/lib/api";
import { CartOrder } from "@/types";
import { Package, Truck, CheckCircle2, RotateCcw, ArrowRight, Clock } from "lucide-react";

export default function OrdersView() {
  const { user, token, isLoading: authLoading } = useAuth();
  const { formatPrice } = useCurrency();
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
          You haven&apos;t placed any orders with this account yet. Discover our latest collection and make your first order today!
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
              {/* Order Card Header */}
              <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-6">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-400">
                      Order Reference
                    </span>
                    <p className="font-mono font-bold text-sm text-gray-900">
                      {order.ref_code || `#${order.id}`}
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
                      {formatPrice(order.total || 0)}
                    </p>
                  </div>
                </div>

                {/* Status Badges */}
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

              {/* Order Items List */}
              <div className="p-6 divide-y divide-gray-100">
                {order.items?.map((item) => (
                  <div
                    key={item.id}
                    className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-50 rounded-xl border border-gray-100 p-1 flex items-center justify-center shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={formatMediaUrl(item.item?.image)}
                          alt={item.item?.title || "Product"}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <Link
                          href={`/product/${item.item?.slug}`}
                          className="font-bold text-gray-900 hover:underline text-sm line-clamp-1"
                        >
                          {item.item?.title}
                        </Link>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Quantity: {item.quantity} × {formatPrice(item.final_price)}
                        </p>
                      </div>
                    </div>

                    <span className="font-bold text-sm text-gray-900">
                      {formatPrice(item.final_price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Card Footer: Shipping address info and refund action */}
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
                    href={`/refund?ref=${order.ref_code || ""}`}
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
