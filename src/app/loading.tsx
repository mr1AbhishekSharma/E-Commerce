import VibeLoader from "@/components/VibeLoader";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-40 bg-white flex items-center justify-center pointer-events-none">
      <VibeLoader size="lg" />
    </div>
  );
}
