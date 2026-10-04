"use client";

import { useState, useEffect } from "react";

export default function Preloader() {
  const [mounted, setMounted] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Lock body scroll while initial preloader is active
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Allow full brand entrance reveal (~1.8s) before smooth fade-out
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        setMounted(false);
        document.body.style.overflow = originalOverflow || "";
      }, 600);
    }, 1800);

    // Guaranteed failsafe release
    const failsafe = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        setMounted(false);
        document.body.style.overflow = originalOverflow || "";
      }, 600);
    }, 2800);

    return () => {
      clearTimeout(timer);
      clearTimeout(failsafe);
      document.body.style.overflow = originalOverflow || "";
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading THE VIBE"
      className={`fixed inset-0 z-[99999] flex items-center justify-center bg-white transition-opacity duration-600 ease-out ${
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{
        backgroundColor: "#ffffff",
        fontFamily: "var(--font-inter), 'Inter', sans-serif",
      }}
    >
      <div className="preloader">
        <div
          className="logo-container flex items-end font-black leading-none tracking-[-0.02em] select-none text-[2rem] sm:text-[3rem] md:text-[5rem]"
          style={{
            fontFamily: "var(--font-inter), 'Inter', sans-serif",
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: "-0.02em",
          }}
        >
          {/* The static 'T' */}
          <div
            className="letter-t relative z-[2] shrink-0"
            style={{ color: "#5346FF" }}
          >
            T
          </div>

          {/* The mask that conceals the sliding text */}
          <div
            className="text-mask overflow-hidden inline-flex"
            style={{ marginLeft: "0.02em" }}
          >
            {/* The animated sliding text */}
            <div
              className="sliding-text whitespace-pre animate-vibe-slide"
              style={{
                color: "#222222",
                whiteSpace: "pre",
              }}
            >
              HE VIBE
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
