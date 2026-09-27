"use client";

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
            <span className="font-bold text-gray-900">${orderSuccess.total.toFixed(2)}</span>
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
            href={`/login?redirect=/checkout`}
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
                    $
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
                <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Coupon Discount</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="text-emerald-600 font-semibold">FREE</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between text-xl font-black text-gray-900">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
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
                  <span>Place Order • ${total.toFixed(2)}</span>
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
