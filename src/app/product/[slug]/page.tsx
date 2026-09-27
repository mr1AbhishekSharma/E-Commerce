import { getProduct, formatMediaUrl } from "@/lib/api";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ShoppingBag, ArrowLeft, ShieldCheck, Truck, RotateCcw } from "lucide-react";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 0;

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  const imageUrl = formatMediaUrl(product.image);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back button */}
      <Link
        href="/shop"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black mb-8 transition font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Shop</span>
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
        {/* Product Image */}
        <div className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 aspect-square flex items-center justify-center p-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={product.title}
            className="w-full h-full object-contain rounded-xl"
          />
        </div>

        {/* Product Info */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {product.category_title && (
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                {product.category_title}
              </span>
            )}
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900">
              {product.title}
            </h1>

            {/* Price */}
            <div className="flex items-baseline gap-3 pt-1">
              {product.discount_price ? (
                <>
                  <span className="text-2xl font-bold text-red-600">
                    ${product.discount_price.toFixed(2)}
                  </span>
                  <span className="text-lg text-gray-400 line-through">
                    ${product.price.toFixed(2)}
                  </span>
                </>
              ) : (
                <span className="text-2xl font-bold text-gray-900">
                  ${product.price.toFixed(2)}
                </span>
              )}
            </div>

            {/* Description */}
            <div className="border-t border-b border-gray-100 py-6 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                Description
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {product.description_long || product.description_short || "No description provided."}
              </p>
            </div>

            {/* Stock / Details */}
            {product.stock_no && (
              <p className="text-xs text-gray-500">
                <span className="font-semibold text-gray-700">SKU / Item No:</span> {product.stock_no}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="space-y-4 pt-4">
            <Link
              href="/cart"
              className="w-full bg-black text-white py-4 rounded-xl font-bold text-sm hover:bg-neutral-800 transition flex items-center justify-center gap-2 shadow-lg"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Add to Cart</span>
            </Link>

            {/* Trust icons */}
            <div className="grid grid-cols-3 gap-2 pt-4 text-center border-t border-gray-100">
              <div className="flex flex-col items-center gap-1 p-2">
                <Truck className="w-5 h-5 text-gray-600" />
                <span className="text-[11px] text-gray-500 font-medium">Free Delivery</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-2">
                <ShieldCheck className="w-5 h-5 text-gray-600" />
                <span className="text-[11px] text-gray-500 font-medium">Stripe Protected</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-2">
                <RotateCcw className="w-5 h-5 text-gray-600" />
                <span className="text-[11px] text-gray-500 font-medium">Easy Returns</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
