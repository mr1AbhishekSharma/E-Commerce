"use client";

interface VibeLoaderProps {
  size?: "sm" | "md" | "lg" | "xl";
  fullscreen?: boolean;
  theme?: "light" | "dark";
  className?: string;
  label?: string;
}

export default function VibeLoader({
  size = "lg",
  fullscreen = false,
  theme = "light",
  className = "",
  label,
}: VibeLoaderProps) {
  const isDark = theme === "dark";

  // Responsive font sizes matching the design specs
  const sizeClasses = {
    sm: "text-2xl sm:text-3xl",
    md: "text-3xl sm:text-4xl md:text-5xl",
    lg: "text-[2rem] sm:text-[3rem] md:text-[5rem]", // Exact match to user spec: 5rem desktop, 3rem tablet, 2rem mobile
    xl: "text-[2.5rem] sm:text-[4rem] md:text-[6rem]",
  }[size];

  const content = (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      {/* THE VIBE Logo Container */}
      <div
        className={`flex items-end font-black leading-none tracking-[-0.02em] font-sans ${sizeClasses}`}
        style={{
          fontFamily: "var(--font-inter), 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          fontWeight: 900,
          lineHeight: 1,
          letterSpacing: "-0.02em",
        }}
      >
        {/* The static 'T' */}
        <span
          className="relative z-[2] shrink-0"
          style={{ color: "#5346FF" }}
        >
          T
        </span>

        {/* The mask that conceals the sliding text */}
        <span
          className="overflow-hidden inline-flex"
          style={{ marginLeft: "0.02em" }}
        >
          {/* The animated sliding text */}
          <span
            className="whitespace-pre animate-vibe-slide"
            style={{
              color: isDark ? "#ffffff" : "#222222",
              whiteSpace: "pre",
            }}
          >
            HE VIBE
          </span>
        </span>
      </div>

      {/* Optional helper caption */}
      {label && (
        <p
          className={`mt-4 text-xs font-semibold tracking-widest uppercase transition-opacity ${
            isDark ? "text-neutral-400" : "text-neutral-500"
          }`}
        >
          {label}
        </p>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label="Loading The Vibe"
        className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all ${
          isDark ? "bg-[#0a0a0a]" : "bg-[#ffffff]"
        }`}
      >
        {content}
      </div>
    );
  }

  return content;
}
