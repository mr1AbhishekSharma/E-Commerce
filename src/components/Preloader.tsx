"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import VibeLoader from "./VibeLoader";

function PreloaderInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initial visit entrance loader state
  const [initialLoading, setInitialLoading] = useState(true);
  // Route navigation loader state
  const [navLoading, setNavLoading] = useState(false);
  // Fade-out animation state
  const [fadingOut, setFadingOut] = useState(false);

  // Track full URL string to detect completed navigation
  const currentUrl = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
  const prevUrlRef = useRef(currentUrl);
  const navStartTimeRef = useRef<number>(0);

  // 1. Initial page load reveal: blurred background, visible Navbar, smooth slide
  useEffect(() => {
    const timer = setTimeout(() => {
      setFadingOut(true);
      setTimeout(() => {
        setInitialLoading(false);
        setFadingOut(false);
      }, 400);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  // 2. Route change detection: when navigation completes, hold long enough to show animation once
  useEffect(() => {
    if (currentUrl !== prevUrlRef.current) {
      prevUrlRef.current = currentUrl;

      if (navLoading) {
        const elapsed = Date.now() - navStartTimeRef.current;
        // Ensure the loader is visible for at least 800ms so the user sees the slide animation at least once
        const remaining = Math.max(0, 800 - elapsed);

        const timer = setTimeout(() => {
          setFadingOut(true);
          setTimeout(() => {
            setNavLoading(false);
            setFadingOut(false);
          }, 350);
        }, remaining);

        return () => clearTimeout(timer);
      }
    }
  }, [currentUrl, navLoading]);

  // 3. Listen to clicks on internal navigation links (products, categories, shop, etc.)
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Ignore external, hash links, mailto, tel, target _blank, modifier clicks
      if (
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("#") ||
        href.startsWith("javascript:") ||
        anchor.target === "_blank" ||
        e.defaultPrevented ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      // If clicking the current path/page, don't trigger
      const currentFull = window.location.pathname + window.location.search;
      if (href === currentFull || href === window.location.pathname) {
        return;
      }

      // Trigger navigation loader!
      navStartTimeRef.current = Date.now();
      setNavLoading(true);
      setFadingOut(false);
    };

    document.addEventListener("click", handleAnchorClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleAnchorClick, { capture: true });
    };
  }, []);

  const isActive = initialLoading || navLoading;

  if (!isActive) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading THE VIBE"
      className={`fixed inset-0 z-40 flex items-center justify-center bg-white/70 backdrop-blur-md transition-opacity duration-350 ease-out pointer-events-none select-none ${
        fadingOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center justify-center transform scale-95 sm:scale-100">
        <VibeLoader size="lg" />
      </div>
    </div>
  );
}

export default function Preloader() {
  return (
    <Suspense fallback={null}>
      <PreloaderInner />
    </Suspense>
  );
}
