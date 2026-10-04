import VibeLoader from "@/components/VibeLoader";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-40 bg-white/70 backdrop-blur-md flex items-center justify-center pointer-events-none transition-all">
      <VibeLoader size="lg" />
    </div>
  );
}
