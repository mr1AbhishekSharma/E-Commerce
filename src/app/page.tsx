import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles, ShieldCheck, Truck, RefreshCw, Layers } from "lucide-react";
import { getCategories, getProducts, getSlides, formatMediaUrl } from "@/lib/api";
import ProductCard from "@/components/ProductCard";

export const revalidate = 0;

export default async function HomePage() {
  const [slides, categories, products] = await Promise.all([
    getSlides(),
    getCategories(),
    getProducts(),
  ]);

  const activeSlide = slides.find((s) => s.is_active) || slides[0];
  const featuredProducts = products.slice(0, 8);

  return (
    <div className="flex flex-col min-h-screen">
      <section className="relative bg-gradient-to-br from-neutral-900 via-neutral-950 to-black text-white overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="max-w-xl text-center md:text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-800/80 border border-neutral-700 text-xs font-semibold tracking-wider uppercase text-neutral-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>New Season Arrivals</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
              Wear the statement. <br />
              <span className="bg-gradient-to-r from-white via-neutral-200 to-neutral-500 bg-clip-text text-transparent">
                Feel the vibe.
              </span>
            </h1>

            <p className="text-neutral-400 text-base sm:text-lg leading-relaxed">
              Explore meticulously crafted streetwear, premium hoodies, and essentials tailored for those who make their own rules.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start pt-2">
              <Link
                href="/shop"
                className="w-full sm:w-auto px-8 py-3.5 bg-white text-black font-semibold rounded-full hover:bg-neutral-200 transition shadow-lg shadow-white/10 flex items-center justify-center gap-2 group"
              >
                <span>Shop Collection</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </Link>
              <Link
                href="/shop?category=hoodiessweatshirts"
                className="w-full sm:w-auto px-8 py-3.5 border border-neutral-700 text-white font-semibold rounded-full hover:bg-neutral-900 transition flex items-center justify-center"
              >
                Explore Hoodies
              </Link>
            </div>
          </div>

          <div className="relative w-full max-w-md aspect-square rounded-3xl overflow-hidden border border-neutral-800 shadow-2xl bg-neutral-900/60 backdrop-blur-sm group">
            {activeSlide?.image ? (
              <Image
                src={formatMediaUrl(activeSlide.image)}
                alt={activeSlide.caption1 || "The Vibe Style"}
                fill
                className="object-cover group-hover:scale-105 transition duration-700"
                priority
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-neutral-800 to-neutral-900">
                <span className="text-5xl font-black tracking-widest text-neutral-600 mb-2">THE VIBE</span>
                <p className="text-sm text-neutral-400">Premium Apparel & Streetwear</p>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-6">
              <div>
                <p className="text-xs uppercase tracking-widest text-neutral-400">Featured</p>
                <h3 className="text-lg font-bold text-white">
                  {activeSlide?.caption1 || "Signature Drop 2026"}
                </h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-gray-100 bg-neutral-50/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">Free Shipping</h4>
                <p className="text-xs text-gray-500">On all orders over $100</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">Secure Payments</h4>
                <p className="text-xs text-gray-500">Encrypted checkout</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">Easy Returns</h4>
                <p className="text-xs text-gray-500">30-day money back guarantee</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">Premium Quality</h4>
                <p className="text-xs text-gray-500">High-grade textiles</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10">
              <div>
                <span className="text-xs font-bold tracking-widest text-indigo-600 uppercase">
                  Categories
                </span>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 mt-1">
                  Shop by Department
                </h2>
              </div>
              <Link
                href="/shop"
                className="text-sm font-semibold text-gray-700 hover:text-black mt-2 sm:mt-0 flex items-center gap-1 group"
              >
                <span>Browse All</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/shop?category=${cat.slug}`}
                  className="group relative rounded-2xl overflow-hidden bg-gray-100 aspect-square flex flex-col justify-end p-6 border border-gray-100 hover:shadow-xl transition-all duration-300"
                >
                  {cat.image ? (
                    <Image
                      src={formatMediaUrl(cat.image)}
                      alt={cat.title}
                      fill
                      className="object-cover group-hover:scale-105 transition duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-neutral-900 group-hover:bg-neutral-800 transition" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="relative z-10">
                    <h3 className="text-lg font-bold text-white tracking-wide">
                      {cat.title}
                    </h3>
                    {cat.description && (
                      <p className="text-xs text-gray-300 line-clamp-1 mt-0.5">
                        {cat.description}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-16 md:py-24 bg-neutral-50/60 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12">
            <div>
              <span className="text-xs font-bold tracking-widest text-indigo-600 uppercase">
                Trending Now
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 mt-1">
                Featured Products
              </h2>
            </div>
            <Link
              href="/shop"
              className="text-sm font-semibold text-gray-700 hover:text-black mt-2 sm:mt-0 flex items-center gap-1 group"
            >
              <span>View All Products</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
            </Link>
          </div>

          {featuredProducts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
              <p className="text-gray-500 font-medium">No products found in catalog.</p>
              <p className="text-xs text-gray-400 mt-1">
                Make sure products are added and active in Django admin.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-16 bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-neutral-900 border border-neutral-800 p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-xl space-y-4 text-center md:text-left">
              <span className="text-xs uppercase tracking-widest text-neutral-400 font-bold">
                Special Offer
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                Use Code <span className="text-indigo-400 font-mono">SAVE10</span> for $10 Off
              </h2>
              <p className="text-neutral-400 text-sm sm:text-base">
                Apply this promo coupon at checkout on any qualifying order. Hand-stitched essentials made to endure.
              </p>
            </div>

            <div>
              <Link
                href="/shop"
                className="px-8 py-3.5 bg-white text-black font-bold rounded-full hover:bg-neutral-200 transition shadow-lg shrink-0 inline-block text-center"
              >
                Shop The Sale
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
