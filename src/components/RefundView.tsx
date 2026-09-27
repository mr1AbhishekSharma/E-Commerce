"use client";

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
          className={`mb-6 p-4 rounded-2xl flex items-start gap-3 text-sm ${
            status.success
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
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
