import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import RefundView from "@/components/RefundView";

export const dynamic = "force-dynamic";

export default function RefundPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link
        href="/orders"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 transition font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Orders</span>
      </Link>
      <Suspense fallback={<div className="text-sm text-gray-500">Loading refund form...</div>}>
        <RefundView />
      </Suspense>
    </div>
  );
}
