"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCurrency } from "@/context/CurrencyContext";
import { SlidersHorizontal, RotateCcw, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

export interface ScrollablePriceRangeProps {
  minPrice?: number | null;
  maxPrice?: number | null;
  minBoundary?: number;
  maxBoundary?: number;
  step?: number;
  mode?: "url" | "client";
  onChange?: (min: number | null, max: number | null) => void;
  category?: string;
  search?: string;
  sort?: string;
  className?: string;
  compact?: boolean;
}

interface Preset {
  id: string;
  min: number | null;
  max: number | null;
  labelUSD: string;
}

const PRESETS: Preset[] = [
  { id: "all", min: null, max: null, labelUSD: "All Prices" },
  { id: "tier1", min: 0, max: 50, labelUSD: "Under $50" },
  { id: "tier2", min: 50, max: 100, labelUSD: "$50 – $100" },
  { id: "tier3", min: 100, max: 150, labelUSD: "$100 – $150" },
  { id: "tier4", min: 150, max: null, labelUSD: "$150+" },
];

export default function ScrollablePriceRange({
  minPrice = null,
  maxPrice = null,
  minBoundary = 0,
  maxBoundary = 200,
  step = 5,
  mode = "url",
  onChange,
  category,
  search,
  sort,
  className = "",
  compact = false,
}: ScrollablePriceRangeProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { formatPrice, currency } = useCurrency();

  const [localMin, setLocalMin] = useState<number>(minPrice ?? minBoundary);
  const [localMax, setLocalMax] = useState<number>(maxPrice ?? maxBoundary);
  const [activeThumb, setActiveThumb] = useState<"min" | "max">("max");
  const [isApplying, setIsApplying] = useState(false);

  const presetsRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Synchronize local states when incoming props change
  useEffect(() => {
    setLocalMin(minPrice ?? minBoundary);
    setLocalMax(maxPrice ?? maxBoundary);
  }, [minPrice, maxPrice, minBoundary, maxBoundary]);

  // Check scroll buttons on presets
  const updateScrollButtons = useCallback(() => {
    if (!presetsRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = presetsRef.current;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
  }, []);

  useEffect(() => {
    updateScrollButtons();
    window.addEventListener("resize", updateScrollButtons);
    return () => window.removeEventListener("resize", updateScrollButtons);
  }, [updateScrollButtons]);

  const scrollPresets = (direction: "left" | "right") => {
    if (!presetsRef.current) return;
    const offset = direction === "left" ? -140 : 140;
    presetsRef.current.scrollBy({ left: offset, behavior: "smooth" });
    setTimeout(updateScrollButtons, 300);
  };

  // Apply filters via URL or callback
  const applyFilter = useCallback(
    (newMin: number | null, newMax: number | null) => {
      setIsApplying(true);
      if (mode === "client" && onChange) {
        onChange(newMin, newMax);
        setIsApplying(false);
      } else {
        const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
        if (category) params.set("category", category);
        if (search) params.set("search", search);
        if (sort) params.set("sort", sort);

        if (newMin !== null && newMin > minBoundary) {
          params.set("min_price", newMin.toString());
        } else {
          params.delete("min_price");
        }

        if (newMax !== null && newMax < maxBoundary) {
          params.set("max_price", newMax.toString());
        } else {
          params.delete("max_price");
        }

        const query = params.toString();
        router.push(query ? `/shop?${query}` : "/shop", { scroll: false });
        setTimeout(() => setIsApplying(false), 300);
      }
    },
    [mode, onChange, router, searchParams, category, search, sort, minBoundary, maxBoundary]
  );

  // Debounce slider drags in URL mode
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleSliderCommit = useCallback(
    (newMin: number, newMax: number) => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        const effectiveMin = newMin > minBoundary ? newMin : null;
        const effectiveMax = newMax < maxBoundary ? newMax : null;
        applyFilter(effectiveMin, effectiveMax);
      }, 400);
    },
    [applyFilter, minBoundary, maxBoundary]
  );

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.min(Number(e.target.value), localMax - step);
    setLocalMin(val);
    setActiveThumb("min");
    handleSliderCommit(val, localMax);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(Number(e.target.value), localMin + step);
    setLocalMax(val);
    setActiveThumb("max");
    handleSliderCommit(localMin, val);
  };

  // Wheel scroll on slider area to adjust range smoothly
  const handleWheelScroll = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? step : -step;
    if (activeThumb === "min" || e.shiftKey) {
      const nextMin = Math.max(minBoundary, Math.min(localMin + delta, localMax - step));
      setLocalMin(nextMin);
      handleSliderCommit(nextMin, localMax);
    } else {
      const nextMax = Math.max(localMin + step, Math.min(localMax + delta, maxBoundary));
      setLocalMax(nextMax);
      handleSliderCommit(localMin, nextMax);
    }
  };

  // Preset Selection
  const selectPreset = (preset: Preset) => {
    const minVal = preset.min ?? minBoundary;
    const maxVal = preset.max ?? maxBoundary;
    setLocalMin(minVal);
    setLocalMax(maxVal);
    applyFilter(preset.min, preset.max);
  };

  const isPresetActive = (preset: Preset) => {
    const currentMin = minPrice ?? minBoundary;
    const currentMax = maxPrice ?? maxBoundary;
    const targetMin = preset.min ?? minBoundary;
    const targetMax = preset.max ?? maxBoundary;
    return currentMin === targetMin && currentMax === targetMax;
  };

  const handleReset = () => {
    setLocalMin(minBoundary);
    setLocalMax(maxBoundary);
    applyFilter(null, null);
  };

  const hasActivePriceFilter =
    (minPrice !== null && minPrice > minBoundary) ||
    (maxPrice !== null && maxPrice < maxBoundary);

  // Dynamic label for preset based on currency
  const getPresetLabel = (preset: Preset) => {
    if (preset.id === "all") return "All Prices";
    if (currency === "INR") {
      if (preset.min === 0 && preset.max === 50) return "Under ₹4,250";
      if (preset.min === 50 && preset.max === 100) return "₹4,250 – ₹8,500";
      if (preset.min === 100 && preset.max === 150) return "₹8,500 – ₹12,750";
      if (preset.min === 150) return "₹12,750+";
    }
    return preset.labelUSD;
  };

  // Compute percentages for slider highlight bar
  const minPercent = Math.max(0, Math.min(100, ((localMin - minBoundary) / (maxBoundary - minBoundary)) * 100));
  const maxPercent = Math.max(0, Math.min(100, ((localMax - minBoundary) / (maxBoundary - minBoundary)) * 100));

  return (
    <div
      className={`bg-white border border-gray-100 rounded-2xl p-5 shadow-2xs space-y-4 transition-all ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-800">
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
            Price Range
          </h3>
        </div>
        {hasActivePriceFilter && (
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 text-[11px] font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-lg transition"
            title="Reset price range"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Horizontally Scrollable Preset Chips */}
      <div className="relative group">
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollPresets("left")}
            className="absolute -left-2.5 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-50 transition"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        )}

        <div
          ref={presetsRef}
          onScroll={updateScrollButtons}
          className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-1 px-0.5"
        >
          {PRESETS.map((p) => {
            const active = isPresetActive(p);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => selectPreset(p)}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                  active
                    ? "bg-neutral-900 text-white shadow-xs scale-[1.02]"
                    : "bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-100 hover:border-gray-200"
                }`}
              >
                {getPresetLabel(p)}
              </button>
            );
          })}
        </div>

        {canScrollRight && (
          <button
            type="button"
            onClick={() => scrollPresets("right")}
            className="absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-50 transition"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Dual Interactive Range Slider with Wheel Scroll */}
      <div
        className="pt-2 pb-1 space-y-3"
        onWheel={handleWheelScroll}
        title="Scroll mouse wheel over sliders to adjust"
      >
        {/* Live Badge Display */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 uppercase font-semibold">Min</span>
            <span className="font-bold text-gray-900">{formatPrice(localMin)}</span>
          </div>

          <div className="text-center px-2 py-0.5 bg-neutral-50 rounded-full border border-gray-200 text-[10px] font-semibold text-neutral-600 flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-amber-500" />
            <span>
              {localMin <= minBoundary && localMax >= maxBoundary
                ? "Full Catalog"
                : `${formatPrice(localMin)} – ${formatPrice(localMax)}`}
            </span>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[10px] text-gray-400 uppercase font-semibold">Max</span>
            <span className="font-bold text-gray-900">
              {localMax >= maxBoundary ? `${formatPrice(maxBoundary)}+` : formatPrice(localMax)}
            </span>
          </div>
        </div>

        {/* Dual Slider Bar Container */}
        <div className="relative w-full h-7 flex items-center">
          {/* Base Track */}
          <div className="absolute w-full h-2 bg-gray-100 rounded-full border border-gray-200/80 pointer-events-none" />

          {/* Highlighted Selected Range */}
          <div
            className="absolute h-2 bg-neutral-900 rounded-full pointer-events-none transition-all duration-75"
            style={{
              left: `${minPercent}%`,
              width: `${Math.max(0, maxPercent - minPercent)}%`,
            }}
          />

          {/* Min Range Input */}
          <input
            type="range"
            min={minBoundary}
            max={maxBoundary}
            step={step}
            value={localMin}
            onChange={handleMinChange}
            onFocus={() => setActiveThumb("min")}
            className={`absolute w-full appearance-none bg-transparent pointer-events-none focus:outline-none ${
              activeThumb === "min" ? "z-30" : "z-20"
            } [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-neutral-900 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-neutral-900 [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:active:cursor-grabbing`}
          />

          {/* Max Range Input */}
          <input
            type="range"
            min={minBoundary}
            max={maxBoundary}
            step={step}
            value={localMax}
            onChange={handleMaxChange}
            onFocus={() => setActiveThumb("max")}
            className={`absolute w-full appearance-none bg-transparent pointer-events-none focus:outline-none ${
              activeThumb === "max" ? "z-30" : "z-20"
            } [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-neutral-900 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-neutral-900 [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:active:cursor-grabbing`}
          />
        </div>

        {/* Scroll Helper Hint */}
        <p className="text-[10px] text-gray-400 text-center flex items-center justify-center gap-1">
          <span>💡</span>
          <span>Drag thumb or scroll mouse wheel to adjust price</span>
        </p>
      </div>
    </div>
  );
}
