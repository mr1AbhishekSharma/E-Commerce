import { getProduct, formatMediaUrl } from "@/lib/api";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Truck, RotateCcw } from "lucide-react";
import AddToCartButton from "@/components/AddToCartButton";
import ProductPrice from "@/components/ProductPrice";
import ProductReviewsSection from "@/components/ProductReviewsSection";

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
        <div className="bg-gray-50 rounded-3xl overflow-hidden border border-gray-100 aspect-square flex items-center justify-center p-8 relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={product.title}
            className="w-full h-full object-contain rounded-2xl"
          />
          {product.label && (
            <span className="absolute top-6 left-6 px-3 py-1 bg-black text-white text-xs font-black uppercase tracking-wider rounded-full shadow-md">
              {product.label === "S" ? "Sale" : product.label === "N" ? "New" : "Bestseller"}
            </span>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {product.category_title && (
              <Link
                href={`/shop?category=${product.category_slug}`}
                className="text-xs font-bold uppercase tracking-wider text-indigo-600 hover:underline"
              >
                {product.category_title}
              </Link>
            )}
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900">
              {product.title}
            </h1>

            {/* Currency-aware Price */}
            <ProductPrice price={product.price} discountPrice={product.discount_price} />

            {/* Description */}
            <div className="border-t border-b border-gray-100 py-6 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                Description
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
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

          {/* Interactive Add to Cart & Trust Badges */}
          <div className="space-y-6 pt-4">
            <AddToCartButton product={product} />

            <div className="grid grid-cols-3 gap-2 pt-4 text-center border-t border-gray-100">
              <div className="flex flex-col items-center gap-1.5 p-2">
                <Truck className="w-5 h-5 text-gray-700" />
                <span className="text-[11px] text-gray-600 font-medium">Free Delivery</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-2">
                <ShieldCheck className="w-5 h-5 text-gray-700" />
                <span className="text-[11px] text-gray-600 font-medium">Verified Payment</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-2">
                <RotateCcw className="w-5 h-5 text-gray-700" />
                <span className="text-[11px] text-gray-600 font-medium">30-Day Returns</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews & Ratings */}
      <ProductReviewsSection slug={slug} />
    </div>
  );
}
