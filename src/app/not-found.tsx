"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, ShoppingBag, Sparkles, Home } from "lucide-react";

export default function NotFound() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 sm:py-24 relative overflow-hidden bg-white">
      {/* Ambient background glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] bg-indigo-50/70 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-72 h-72 bg-purple-50/60 rounded-full blur-2xl pointer-events-none -z-10" />

      <div className="w-full max-w-xl text-center space-y-6">
        {/* Status Chip */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-100 border border-neutral-200 text-xs font-semibold text-neutral-700 tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Error 404 • Page Not Found</span>
        </div>

        {/* Large Aesthetic 404 Number */}
        <div className="relative select-none">
          <h1
            className="text-8xl sm:text-9xl font-black tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-b from-neutral-900 via-neutral-800 to-indigo-950 font-sans"
            style={{
              fontFamily:
                "var(--font-inter), 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            }}
          >
            404
          </h1>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full" />
        </div>

        {/* Headline & Description */}
        <div className="space-y-2 pt-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
            Lost in the Collection?
          </h2>
          <p className="text-sm sm:text-base text-neutral-500 max-w-md mx-auto leading-relaxed">
            The page or fashion drop you are looking for doesn&apos;t exist, was archived, or has moved to a new destination.
          </p>
        </div>

        {/* Quick Search Form */}
        <form
          onSubmit={handleSearchSubmit}
          className="max-w-md mx-auto pt-2"
        >
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, hoodies, bags..."
              className="w-full pl-11 pr-24 py-3 text-sm rounded-full border border-neutral-200 bg-neutral-50/80 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-black focus:border-transparent transition shadow-xs"
            />
            <Search className="w-4 h-4 text-neutral-400 absolute left-4 top-3.5" />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-black hover:bg-neutral-800 text-white text-xs font-bold rounded-full transition shadow-xs flex items-center gap-1 cursor-pointer"
            >
              Search
            </button>
          </div>
        </form>

        {/* Popular Categories Shortcut */}
        <div className="pt-2">
          <p className="text-xs uppercase tracking-widest text-neutral-400 font-semibold mb-3">
            Popular Categories
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/shop?category=hoodiessweatshirts"
              className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-neutral-100 hover:bg-black hover:text-white transition duration-200 text-neutral-700"
            >
              Hoodies &amp; Sweatshirts
            </Link>
            <Link
              href="/shop?category=t-shirts"
              className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-neutral-100 hover:bg-black hover:text-white transition duration-200 text-neutral-700"
            >
              T-Shirts
            </Link>
            <Link
              href="/shop?category=bags"
              className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-neutral-100 hover:bg-black hover:text-white transition duration-200 text-neutral-700"
            >
              Bags &amp; Packs
            </Link>
            <Link
              href="/shop"
              className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-neutral-100 hover:bg-black hover:text-white transition duration-200 text-neutral-700"
            >
              Shop All
            </Link>
          </div>
        </div>

        {/* Primary CTA Buttons */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 bg-black hover:bg-neutral-800 text-white rounded-full text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 shadow-sm"
          >
            <Home className="w-4 h-4" />
            <span>Return to Storefront</span>
          </Link>
          <Link
            href="/shop"
            className="w-full sm:w-auto px-6 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 rounded-full text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 border border-neutral-200"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Explore Catalog</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
