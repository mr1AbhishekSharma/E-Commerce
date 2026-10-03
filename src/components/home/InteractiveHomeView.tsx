"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Truck,
  RefreshCw,
  Layers,
  Copy,
  Check,
  Eye,
  Heart,
  Star,
  X,
  Plus,
  Minus,
  Search,
  ArrowUp,
  ShoppingBag,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Category, Product, Slide } from "@/types";
import { formatMediaUrl } from "@/lib/api";
import { useCurrency } from "@/context/CurrencyContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import ProductCard from "@/components/ProductCard";

interface InteractiveHomeViewProps {
  slides: Slide[];
  categories: Category[];
  products: Product[];
}

export default function InteractiveHomeView({
  slides: initialSlides,
  categories,
  products,
}: InteractiveHomeViewProps) {
  const { formatPrice } = useCurrency();
  const { addToCart, isLoading: isCartLoading } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  // 1. Hero Carousel State
  const defaultSlides: Slide[] = [
    {
      id: 1,
      caption1: "NEW SEASON DROPS 2026",
      caption2: "Heavyweight Streetwear & Hoodies Tailored For Statement Looks",
      link: "/shop",
      image: "add_slide_1.jpg",
      button_text: "Shop New Arrivals",
      order: 1,
      is_active: true,
    },
    {
      id: 2,
      caption1: "PREMIUM OVERSIZED HOODIES",
      caption2: "Ultra-soft 450 GSM French Terry Cotton For Ultimate Comfort",
      link: "/shop?category=hoodiessweatshirts",
      image: "banner-02.webp",
      button_text: "Explore Hoodies",
      order: 2,
      is_active: true,
    },
    {
      id: 3,
      caption1: "URBAN MINIMALIST ESSENTIALS",
      caption2: "Redefining Everyday Luxury With Clean Fits And Earth Tones",
      link: "/shop?category=t-shirts",
      image: "banner-04.webp",
      button_text: "Discover Collection",
      order: 3,
      is_active: true,
    },
    {
      id: 4,
      caption1: "TACTICAL UTILITY DROP",
      caption2: "Technical Weatherproof Outerwear & Modular Crossbody Gear",
      link: "/shop?category=outerwear",
      image: "banner-07.webp",
      button_text: "Shop Outerwear",
      order: 4,
      is_active: true,
    },
  ];

  const slides = initialSlides.length > 0 ? initialSlides : defaultSlides;
  const [currentSlide, setCurrentSlide] = useState(0);

  // Drag and touch swipe state
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isSwiping, setIsSwiping] = useState(false);

  // Auto-swiping timer (swipes every 3.5 seconds)
  useEffect(() => {
    if (slides.length <= 1 || isSwiping) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [slides.length, currentSlide, isSwiping]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsSwiping(true);
    setDragStartX(e.touches[0].clientX);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStartX === null) return;
    const diff = e.touches[0].clientX - dragStartX;
    setDragOffset(diff);
  };
  const handleTouchEnd = () => {
    if (dragOffset < -40) {
      nextSlide();
    } else if (dragOffset > 40) {
      prevSlide();
    }
    setDragStartX(null);
    setDragOffset(0);
    setIsSwiping(false);
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsSwiping(true);
    setDragStartX(e.clientX);
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragStartX === null) return;
    const diff = e.clientX - dragStartX;
    setDragOffset(diff);
  };
  const handleMouseUp = () => {
    if (dragStartX !== null) {
      if (dragOffset < -40) {
        nextSlide();
      } else if (dragOffset > 40) {
        prevSlide();
      }
    }
    setDragStartX(null);
    setDragOffset(0);
    setIsSwiping(false);
  };

  // 2. Coupon Copy State
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const handleCopyCoupon = (code: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCoupon(true);
      setTimeout(() => setCopiedCoupon(false), 2500);
    }
  };

  // 3. Category & Tag Filters for Products
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [searchFilter, setSearchFilter] = useState<string>("");

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category / Tag filter
      if (activeFilter === "bestseller" && !p.is_bestseller) return false;
      if (activeFilter === "new" && p.label !== "N") return false;
      if (activeFilter === "sale" && p.label !== "S") return false;
      if (
        activeFilter !== "all" &&
        activeFilter !== "bestseller" &&
        activeFilter !== "new" &&
        activeFilter !== "sale"
      ) {
        if (p.category_slug !== activeFilter && p.category_title?.toLowerCase() !== activeFilter.toLowerCase()) {
          return false;
        }
      }

      // Live search filter
      if (searchFilter.trim()) {
        const query = searchFilter.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(query);
        const matchesDesc = (p.description_short || "").toLowerCase().includes(query);
        const matchesCategory = (p.category_title || "").toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesCategory) return false;
      }

      return true;
    });
  }, [products, activeFilter, searchFilter]);

  // 4. Quick View Modal State
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [quickQuantity, setQuickQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string>("M");
  const [quickAdded, setQuickAdded] = useState(false);

  const openQuickView = (prod: Product) => {
    setQuickViewProduct(prod);
    setQuickQuantity(1);
    setSelectedSize("M");
    setQuickAdded(false);
  };

  const closeQuickView = () => {
    setQuickViewProduct(null);
  };

  const handleQuickAddToCart = async () => {
    if (!quickViewProduct) return;
    await addToCart(quickViewProduct, quickQuantity);
    setQuickAdded(true);
    setTimeout(() => setQuickAdded(false), 2200);
  };

  // 5. Testimonials Slider State
  const testimonials = [
    {
      id: 1,
      name: "Marcus Vance",
      role: "Verified Buyer",
      avatar: "MV",
      rating: 5,
      comment:
        "The 450 GSM French Terry on the pullover hoodie is phenomenal. It holds structured shape even after multiple washes. Hands down my favorite streetwear brand right now.",
      item: "Midnight Heavyweight Pullover Hoodie",
    },
    {
      id: 2,
      name: "Elena Rostova",
      role: "Verified Buyer",
      avatar: "ER",
      rating: 5,
      comment:
        "Arrived in 2 days. The vintage acid wash look is stunning and the fit is tailored yet perfectly relaxed. Customer support was also super fast when I had a sizing question.",
      item: "Acid Wash Vintage Zip Hoodie",
    },
    {
      id: 3,
      name: "Devon Walker",
      role: "Verified Buyer",
      avatar: "DW",
      rating: 5,
      comment:
        "Top-tier fabrics and subtle, minimal branding. The boxy fit tee drapes exactly the way high-end streetwear should. Highly recommend grabbing a few staples.",
      item: "Vibe Signature Boxy Graphic Tee",
    },
  ];

  // 6. Interactive FAQ Accordion State
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const faqs = [
    {
      id: 1,
      q: "How fast is shipping and order processing?",
      a: "All orders placed before 3 PM EST are processed on the same day. Standard domestic shipping arrives in 2–4 business days with end-to-end real-time tracking.",
    },
    {
      id: 2,
      q: "How do I choose the right fit for hoodies & tees?",
      a: "Our streetwear garments are engineered with a contemporary relaxed/boxy silhouette. If you prefer a regular tailored fit, order true to size; for an exaggerated oversized drop, size up.",
    },
    {
      id: 3,
      q: "What is your return & exchange guarantee?",
      a: "We offer an effortless 30-day money-back guarantee. You can initiate a refund or exchange directly from your customer account dashboard with zero restocking fees.",
    },
    {
      id: 4,
      q: "How can I apply promo coupons like SAVE10?",
      a: "Simply copy promo code SAVE10 using the button on this page and enter it into the coupon input during checkout. The $10 discount will be deducted automatically from qualifying totals.",
    },
  ];

  // 7. Interactive Newsletter State
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes("@")) return;
    setNewsletterSubscribed(true);
    setNewsletterEmail("");
  };

  // 8. Back to Top Button
  const [showBackToTop, setShowBackToTop] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const activeSlide = slides[currentSlide];

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* ─── LIVE ANNOUNCEMENT & PROMO TICKER ───────────────────────────────── */}
      <div className="bg-neutral-900 text-neutral-200 text-xs py-2 px-4 border-b border-neutral-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-semibold text-white">Spring Drop 2026 Live:</span>
            <span className="text-neutral-400 hidden sm:inline">
              Free Express Shipping on orders over $100
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-neutral-400">Promo Code:</span>
            <button
              onClick={() => handleCopyCoupon("SAVE10")}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-white font-mono font-bold text-[11px] border border-neutral-700 transition"
              title="Click to copy promo code"
            >
              <span>SAVE10</span>
              {copiedCoupon ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3 text-neutral-400" />
              )}
            </button>
            {copiedCoupon && (
              <span className="text-[11px] text-emerald-400 font-bold animate-pulse">
                Copied $10 off!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ─── INTERACTIVE HERO CAROUSEL (AUTO-SWIPING) ───────────────────────── */}
      <section className="relative bg-gradient-to-br from-neutral-900 via-neutral-950 to-black text-white overflow-hidden py-16 md:py-24">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10 lg:gap-14">
            {/* Left Content */}
            <div className="max-w-xl text-center md:text-left space-y-6">
              <div
                key={`badge-${currentSlide}`}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-800/80 border border-neutral-700 text-xs font-semibold tracking-wider uppercase text-neutral-300 transition-all duration-300 animate-in fade-in"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>{activeSlide?.caption1 || "Exclusive Drop"}</span>
              </div>

              <div
                key={`title-${currentSlide}`}
                className="transition-all duration-500 animate-in fade-in slide-in-from-bottom-2"
              >
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                  {activeSlide?.caption2?.split("&")[0] || "Wear the statement."}{" "}
                  <br className="hidden sm:inline" />
                  <span className="bg-gradient-to-r from-white via-neutral-200 to-indigo-300 bg-clip-text text-transparent">
                    {activeSlide?.caption2?.includes("&")
                      ? `& ${activeSlide.caption2.split("&")[1]}`
                      : "Feel the vibe."}
                  </span>
                </h1>
              </div>

              <p className="text-neutral-400 text-sm sm:text-base leading-relaxed">
                Meticulously crafted streetwear, heavyweight French terry hoodies, and daily essentials engineered for those who write their own rules.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start pt-2">
                <Link
                  href={activeSlide?.link || "/shop"}
                  className="w-full sm:w-auto px-8 py-3.5 bg-white text-black font-bold rounded-full hover:bg-neutral-200 transition shadow-xl flex items-center justify-center gap-2 group"
                >
                  <span>{activeSlide?.button_text || "Shop Collection"}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </Link>
                <Link
                  href="/shop?category=hoodiessweatshirts"
                  className="w-full sm:w-auto px-8 py-3.5 border border-neutral-700 text-white font-semibold rounded-full hover:bg-neutral-900 transition flex items-center justify-center"
                >
                  Explore Hoodies
                </Link>
              </div>

              {/* Slide Selector Indicators */}
              <div className="flex items-center gap-3 pt-4 justify-center md:justify-start">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-2 transition-all duration-300 rounded-full overflow-hidden relative ${
                      currentSlide === idx ? "w-10 bg-indigo-500 shadow-sm" : "w-2.5 bg-neutral-700 hover:bg-neutral-500"
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
                <span className="text-[11px] font-mono text-neutral-500 ml-2">
                  0{currentSlide + 1} / 0{slides.length}
                </span>
                <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider bg-neutral-800/60 px-2 py-0.5 rounded-full border border-neutral-700">
                  Auto-Swiping
                </span>
              </div>
            </div>

            {/* Right Interactive Image Presentation - Horizontal Sliding Track */}
            <div
              className="relative w-full max-w-md lg:max-w-lg aspect-square rounded-3xl overflow-hidden border border-neutral-800 shadow-2xl bg-neutral-900/80 backdrop-blur-sm group select-none cursor-grab active:cursor-grabbing"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* Sliding Strip */}
              <div
                className={`flex w-full h-full ${
                  isSwiping ? "" : "transition-transform duration-700 ease-out"
                }`}
                style={{
                  transform: `translateX(calc(-${currentSlide * 100}% + ${dragOffset}px))`,
                }}
              >
                {slides.map((slide, idx) => (
                  <div key={slide.id || idx} className="w-full h-full shrink-0 relative overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formatMediaUrl(slide.image)}
                      alt={slide.caption1 || `Slide ${idx + 1}`}
                      className="w-full h-full object-cover select-none pointer-events-none"
                      draggable={false}
                    />

                    {/* Gradient Overlay & Badge */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-end p-6">
                      <span className="text-[10px] uppercase tracking-widest text-indigo-400 font-extrabold mb-1">
                        Featured Drop • 0{idx + 1}
                      </span>
                      <h3 className="text-lg font-bold text-white line-clamp-2">
                        {slide.caption1 || "Signature Drop 2026"}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>

              {/* Prev / Next Chevrons */}
              {slides.length > 1 && (
                <div className="absolute top-4 right-4 flex items-center gap-1.5 z-20">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      prevSlide();
                    }}
                    className="p-2 rounded-full bg-black/60 hover:bg-black text-white backdrop-blur-md border border-neutral-700 transition shadow-sm"
                    aria-label="Previous slide"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      nextSlide();
                    }}
                    className="p-2 rounded-full bg-black/60 hover:bg-black text-white backdrop-blur-md border border-neutral-700 transition shadow-sm"
                    aria-label="Next slide"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── VALUE PROPOSITION PERKS ───────────────────────────────────────── */}
      <section className="border-b border-gray-100 bg-neutral-50/70 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0 shadow-sm">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">Free Shipping</h4>
                <p className="text-xs text-gray-500">On all orders over $100</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0 shadow-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">Secure Payments</h4>
                <p className="text-xs text-gray-500">Encrypted checkout</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0 shadow-sm">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">Easy Returns</h4>
                <p className="text-xs text-gray-500">30-day money back guarantee</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0 shadow-sm">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">100% Cotton</h4>
                <p className="text-xs text-gray-500">High-grade 450 GSM textiles</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SHOP BY DEPARTMENT (CATEGORIES) ───────────────────────────────── */}
      {categories.length > 0 && (
        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10">
              <div>
                <span className="text-xs font-bold tracking-widest text-indigo-600 uppercase">
                  Departments
                </span>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 mt-1">
                  Shop by Department
                </h2>
              </div>
              <Link
                href="/shop"
                className="text-sm font-semibold text-gray-700 hover:text-black mt-2 sm:mt-0 flex items-center gap-1 group"
              >
                <span>Browse All Departments</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/shop?category=${cat.slug}`}
                  className="group relative rounded-2xl overflow-hidden bg-gray-100 aspect-square flex flex-col justify-end p-6 border border-gray-100 hover:shadow-xl transition-all duration-300"
                >
                  {cat.image ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={formatMediaUrl(cat.image)}
                      alt={cat.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-neutral-900 group-hover:bg-neutral-800 transition" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
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

      {/* ─── INTERACTIVE PRODUCTS EXPLORER WITH LIVE FILTERS ───────────────── */}
      <section className="py-16 md:py-24 bg-neutral-50/70 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header & Live Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <span className="text-xs font-bold tracking-widest text-indigo-600 uppercase">
                Trending Apparel
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 mt-1">
                Featured Collection
              </h2>
            </div>

            {/* Quick Live Search on Home Page */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search styles, hoodies, tees..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black"
              />
              {searchFilter && (
                <button
                  onClick={() => setSearchFilter("")}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Interactive Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-4 py-2 rounded-full text-xs font-bold transition shrink-0 ${
                activeFilter === "all"
                  ? "bg-black text-white shadow-sm"
                  : "bg-white text-gray-600 hover:text-black border border-gray-200"
              }`}
            >
              All Drops ({products.length})
            </button>
            <button
              onClick={() => setActiveFilter("bestseller")}
              className={`px-4 py-2 rounded-full text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                activeFilter === "bestseller"
                  ? "bg-black text-white shadow-sm"
                  : "bg-white text-gray-600 hover:text-black border border-gray-200"
              }`}
            >
              <span>🔥 Best Sellers</span>
            </button>
            <button
              onClick={() => setActiveFilter("new")}
              className={`px-4 py-2 rounded-full text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                activeFilter === "new"
                  ? "bg-black text-white shadow-sm"
                  : "bg-white text-gray-600 hover:text-black border border-gray-200"
              }`}
            >
              <span>✨ New Drops</span>
            </button>
            <button
              onClick={() => setActiveFilter("sale")}
              className={`px-4 py-2 rounded-full text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                activeFilter === "sale"
                  ? "bg-black text-white shadow-sm"
                  : "bg-white text-gray-600 hover:text-black border border-gray-200"
              }`}
            >
              <span>🏷️ On Sale</span>
            </button>

            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveFilter(c.slug)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition shrink-0 ${
                  activeFilter === c.slug
                    ? "bg-black text-white shadow-sm"
                    : "bg-white text-gray-600 hover:text-black border border-gray-200"
                }`}
              >
                {c.title}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 p-8">
              <p className="text-gray-800 font-bold text-base">No products match your filter.</p>
              <p className="text-xs text-gray-400 mt-1">
                Try selecting &ldquo;All Drops&rdquo; or clearing your search query.
              </p>
              <button
                onClick={() => {
                  setActiveFilter("all");
                  setSearchFilter("");
                }}
                className="mt-4 px-5 py-2 bg-black text-white text-xs font-bold rounded-full hover:bg-neutral-800 transition"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickView={openQuickView}
                />
              ))}
            </div>
          )}

          {/* Bottom Catalog Jump */}
          <div className="mt-12 text-center">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-neutral-900 hover:bg-black text-white font-bold text-sm rounded-full transition shadow-md group"
            >
              <span>Explore Complete Catalog</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── INTERACTIVE PROMO VOUCHER BANNER ──────────────────────────────── */}
      <section className="py-16 bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-neutral-900 border border-neutral-800 p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-xl space-y-4 text-center md:text-left z-10">
              <span className="text-xs uppercase tracking-widest text-indigo-400 font-extrabold">
                Instant Savings
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                Get $10 Off Your Order With Code{" "}
                <span className="text-indigo-400 font-mono">SAVE10</span>
              </h2>
              <p className="text-neutral-400 text-sm sm:text-base leading-relaxed">
                Copy and apply code at checkout. Valid on heavyweight hoodies, boxy tees, and limited outerwear drops.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 z-10">
              <button
                onClick={() => handleCopyCoupon("SAVE10")}
                className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-neutral-800 hover:bg-neutral-750 text-white font-mono font-bold text-sm border border-neutral-700 transition flex items-center justify-center gap-2 shadow-sm"
              >
                {copiedCoupon ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 font-sans">Coupon Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-neutral-400" />
                    <span>Copy SAVE10</span>
                  </>
                )}
              </button>

              <Link
                href="/shop"
                className="w-full sm:w-auto px-8 py-3.5 bg-white text-black font-bold rounded-full hover:bg-neutral-200 transition shadow-lg text-center"
              >
                Shop The Sale
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── INTERACTIVE TESTIMONIALS & REVIEWS ────────────────────────────── */}
      <section className="py-16 md:py-24 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-bold tracking-widest text-indigo-600 uppercase">
              Community Voices
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">
              Loved by Streetwear Enthusiasts
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-2">
              Over 5,000+ satisfied customers rating The Vibe 4.9/5 stars.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.id}
                className="bg-neutral-50/80 border border-gray-200/80 rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(t.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {t.role}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-gray-700 italic leading-relaxed">
                    &ldquo;{t.comment}&rdquo;
                  </p>
                </div>

                <div className="pt-6 border-t border-gray-200/60 mt-6 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-neutral-900 text-white font-bold text-xs flex items-center justify-center">
                    {t.avatar}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">{t.name}</h4>
                    <p className="text-[11px] text-gray-400 truncate max-w-[180px]">{t.item}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── INTERACTIVE FAQ ACCORDION ─────────────────────────────────────── */}
      <section className="py-16 md:py-20 bg-neutral-50/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-xs font-bold tracking-widest text-indigo-600 uppercase">
              Got Questions?
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq) => {
              const isOpen = expandedFaq === faq.id;
              return (
                <div
                  key={faq.id}
                  className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs transition"
                >
                  <button
                    onClick={() => setExpandedFaq(isOpen ? null : faq.id)}
                    className="w-full text-left p-5 flex items-center justify-between gap-4 font-bold text-sm text-gray-900 hover:text-indigo-600 transition"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-gray-100">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── INTERACTIVE VIP NEWSLETTER ───────────────────────────────────── */}
      <section className="py-16 bg-neutral-900 text-white border-t border-neutral-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <span className="text-xs uppercase tracking-widest text-indigo-400 font-extrabold">
            VIP Early Access
          </span>
          <h2 className="text-2xl sm:text-3xl font-black">
            Never Miss a Limited Drop
          </h2>
          <p className="text-neutral-400 text-xs sm:text-sm max-w-md mx-auto">
            Subscribe to get instant notifications on midnight seasonal drops, private promo codes, and secret restocks.
          </p>

          {newsletterSubscribed ? (
            <div className="p-4 bg-emerald-950/80 border border-emerald-700 text-emerald-300 rounded-2xl text-xs sm:text-sm font-semibold max-w-md mx-auto flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>You&apos;re subscribed! Welcome to The Vibe VIP list.</span>
            </div>
          ) : (
            <form
              onSubmit={handleNewsletterSubmit}
              className="flex flex-col sm:flex-row items-center justify-center gap-2 max-w-md mx-auto"
            >
              <input
                type="email"
                required
                placeholder="Enter your email..."
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-full bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-white hover:bg-neutral-200 text-black font-bold text-xs sm:text-sm transition shrink-0"
              >
                Join VIP
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ─── QUICK VIEW MODAL ──────────────────────────────────────────────── */}
      {quickViewProduct && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
          onClick={closeQuickView}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-gray-100 flex flex-col md:flex-row relative animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeQuickView}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
              aria-label="Close Quick View"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Left Image */}
            <div className="relative w-full md:w-1/2 aspect-square bg-gray-50 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={formatMediaUrl(quickViewProduct.image)}
                alt={quickViewProduct.title}
                className="w-full h-full object-cover object-center"
              />
              {quickViewProduct.label && (
                <div className="absolute top-3 left-3">
                  <span className="bg-black text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {quickViewProduct.label === "S" ? "Sale" : quickViewProduct.label === "N" ? "New" : "Promo"}
                  </span>
                </div>
              )}
            </div>

            {/* Right Product Form */}
            <div className="p-6 md:p-8 flex flex-col justify-between w-full md:w-1/2">
              <div className="space-y-4">
                <div>
                  {quickViewProduct.category_title && (
                    <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 block">
                      {quickViewProduct.category_title}
                    </span>
                  )}
                  <h3 className="text-lg sm:text-xl font-black text-gray-900 mt-0.5 leading-snug">
                    {quickViewProduct.title}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1 text-xs">
                    <div className="flex items-center text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-current" />
                    </div>
                    <span className="font-bold text-gray-800">
                      {quickViewProduct.average_rating ? Number(quickViewProduct.average_rating).toFixed(1) : "5.0"}
                    </span>
                    <span className="text-gray-400 text-[11px]">
                      ({quickViewProduct.review_count || 12} reviews)
                    </span>
                  </div>
                </div>

                {/* Price Display */}
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-gray-900">
                    {formatPrice(quickViewProduct.discount_price || quickViewProduct.price)}
                  </span>
                  {quickViewProduct.discount_price && (
                    <span className="text-sm text-gray-400 line-through">
                      {formatPrice(quickViewProduct.price)}
                    </span>
                  )}
                </div>

                {quickViewProduct.description_short && (
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
                    {quickViewProduct.description_short}
                  </p>
                )}

                {/* Size Selector */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Select Size
                  </label>
                  <div className="flex items-center gap-2">
                    {["S", "M", "L", "XL"].map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setSelectedSize(sz)}
                        className={`w-9 h-9 rounded-lg text-xs font-bold transition flex items-center justify-center ${
                          selectedSize === sz
                            ? "bg-black text-white shadow-xs"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity Stepper */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Quantity
                  </label>
                  <div className="inline-flex items-center border border-gray-200 rounded-xl bg-gray-50 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setQuickQuantity((q) => Math.max(1, q - 1))}
                      disabled={quickQuantity <= 1}
                      className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 transition disabled:opacity-40"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 text-center text-xs font-bold text-gray-900">
                      {quickQuantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuickQuantity((q) => q + 1)}
                      className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 space-y-2">
                <button
                  type="button"
                  onClick={handleQuickAddToCart}
                  disabled={isCartLoading}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-md ${
                    quickAdded
                      ? "bg-emerald-600 text-white"
                      : "bg-black text-white hover:bg-neutral-800 disabled:opacity-50"
                  }`}
                >
                  {quickAdded ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Added to Bag!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Add to Bag ({formatPrice((quickViewProduct.discount_price || quickViewProduct.price) * quickQuantity)})</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between pt-1">
                  <Link
                    href={`/product/${quickViewProduct.slug}`}
                    onClick={closeQuickView}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
                  >
                    <span>View Full Product Page</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => toggleWishlist(quickViewProduct)}
                    className="text-xs font-semibold text-gray-500 hover:text-red-500 flex items-center gap-1"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        isInWishlist(quickViewProduct.slug) ? "fill-red-500 stroke-red-500 text-red-500" : ""
                      }`}
                    />
                    <span>{isInWishlist(quickViewProduct.slug) ? "In Wishlist" : "Wishlist"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── FLOATING BACK TO TOP BUTTON ───────────────────────────────────── */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 p-3 rounded-full bg-black text-white shadow-xl hover:bg-neutral-800 hover:scale-105 transition-all"
          title="Scroll to Top"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
