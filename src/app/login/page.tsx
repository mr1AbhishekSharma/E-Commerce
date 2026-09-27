import { Suspense } from "react";
import LoginView from "@/components/LoginView";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12 bg-neutral-50/50">
      <Suspense fallback={<div className="text-sm text-gray-500">Loading sign in...</div>}>
        <LoginView />
      </Suspense>
    </div>
  );
}
