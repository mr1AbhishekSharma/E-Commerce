"use client";

import { useState, useEffect } from "react";

export default function Preloader() {
  const [mounted, setMounted] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Lock body scroll while preloader is active
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    let current = 0;
    const interval = setInterval(() => {
      // Smooth dynamic increments
      if (current < 25) {
        current += Math.floor(Math.random() * 7) + 5;
      } else if (current < 65) {
        current += Math.floor(Math.random() * 5) + 3;
      } else if (current < 90) {
        current += Math.floor(Math.random() * 6) + 3;
      } else {
        current += 2;
      }

      if (current >= 100) {
        current = 100;
        setProgress(100);
        clearInterval(interval);

        // Micro-hold at 100% for user satisfaction before curtain wipe
        setTimeout(() => {
          setIsExiting(true);
          setTimeout(() => {
            setMounted(false);
            document.body.style.overflow = originalOverflow || "";
          }, 700);
        }, 180);
      } else {
        setProgress(current);
      }
    }, 30);

    // Guaranteed failsafe release (2.2s max)
    const failsafe = setTimeout(() => {
      setProgress(100);
      setIsExiting(true);
      setTimeout(() => {
        setMounted(false);
        document.body.style.overflow = originalOverflow || "";
      }, 700);
    }, 2200);

    return () => {
      clearInterval(interval);
      clearTimeout(failsafe);
      document.body.style.overflow = originalOverflow || "";
    };
  }, []);

  if (!mounted) return null;

  const getStatusText = (val: number) => {
    if (val < 25) return "INITIALIZING EXPERIENCE...";
    if (val < 60) return "CURATING BESPOKE DROPS...";
    if (val < 90) return "OPTIMIZING ASSETS...";
    if (val < 100) return "FINALIZING THE VIBE...";
    return "WELCOME TO THE VIBE";
  };

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading The Vibe"
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#070709] text-white select-none transition-all duration-700 ease-[cubic-bezier(0.77,0,0.175,1)] ${
        isExiting
          ? "-translate-y-full opacity-95 pointer-events-none"
          : "translate-y-0 opacity-100"
      }`}
    >
      {/* Ambient Lighting Orbs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-indigo-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full bg-purple-600/15 blur-[120px] pointer-events-none" />

      {/* Centerpiece Content */}
      <div className="relative flex flex-col items-center z-10 px-6 max-w-sm w-full text-center">
        {/* Monogram Badge */}
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-2xl bg-indigo-500/25 blur-xl animate-pulse" />
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-2xl flex items-center justify-center backdrop-blur-md">
            <span className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 via-indigo-500 to-purple-400">
              T
            </span>
          </div>
        </div>

        {/* Brand Headline */}
        <h1 className="text-2xl sm:text-3xl font-black tracking-[0.3em] uppercase text-white mb-2">
          <span className="text-indigo-500">T</span>HE VIBE
        </h1>
        <p className="text-[10px] sm:text-xs tracking-[0.35em] text-neutral-400 uppercase font-medium mb-8">
          Apparel &amp; Lifestyle
        </p>

        {/* Dynamic Progress Indicator */}
        <div className="w-full max-w-[260px] space-y-2.5">
          {/* Glowing Track */}
          <div className="h-[2px] w-full bg-neutral-800/90 rounded-full overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-purple-400 rounded-full transition-all duration-100 ease-out shadow-[0_0_12px_rgba(99,102,241,0.9)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Subtitle & Numeric Ticker */}
          <div className="flex items-center justify-between text-[11px] font-mono tracking-wider">
            <span className="text-[9px] sm:text-[10px] font-sans text-neutral-400 tracking-wider text-left truncate mr-2">
              {getStatusText(progress)}
            </span>
            <span className="text-neutral-200 font-semibold tabular-nums shrink-0">
              {progress}%
            </span>
          </div>
        </div>
      </div>

      {/* Minimal Footer Tag */}
      <div className="absolute bottom-8 text-[9px] sm:text-[10px] tracking-[0.3em] uppercase text-neutral-400 pointer-events-none">
        Autumn / Winter &apos;26 Edition
      </div>
    </div>
  );
}
