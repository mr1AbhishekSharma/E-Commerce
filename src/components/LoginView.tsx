"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { resendVerification } from "@/lib/api";
import {
  Lock,
  User as UserIcon,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Mail,
  Shield,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";

export default function LoginView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";
  const verifiedParam = searchParams.get("verified") === "true";
  const { login } = useAuth();

  // Mode: Customer login vs Admin Portal login
  const [isAdminMode, setIsAdminMode] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Unverified account state
  const [isUnverified, setIsUnverified] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string>("");
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsUnverified(false);
    setResendStatus(null);
    setIsSubmitting(true);

    const res = await login(email, password, isAdminMode);
    setIsSubmitting(false);

    if (!res.success) {
      if (res.isVerified === false) {
        setIsUnverified(true);
        setUnverifiedEmail(res.email || email);
        setErrorMsg(res.error || "Account is not verified. Please check your email.");
      } else {
        setErrorMsg(res.error || "Invalid email or password");
      }
      return;
    }

    // When logging in as admin, navigate directly to admin dashboard
    if (isAdminMode || res.isAdmin) {
      router.push("/admin-panel");
    } else {
      router.push(redirectUrl);
    }
  };

  const handleResend = async () => {
    const targetEmail = unverifiedEmail || email;
    if (!targetEmail) return;

    setIsResending(true);
    setResendStatus(null);
    const res = await resendVerification(targetEmail);
    setIsResending(false);

    if (res.success) {
      setResendStatus({ type: "success", text: res.message || "Verification link resent! Check your inbox." });
    } else {
      setResendStatus({ type: "error", text: res.error || "Could not resend email. Please verify your email address." });
    }
  };

  const toggleAdminMode = (admin: boolean) => {
    setIsAdminMode(admin);
    setErrorMsg(null);
    setIsUnverified(false);
    setResendStatus(null);
  };

  return (
    <div className={`w-full max-w-md bg-white border rounded-3xl p-8 shadow-xl transition-all duration-200 ${
      isAdminMode ? "border-indigo-300 ring-2 ring-indigo-500/20" : "border-gray-200/80"
    }`}>
      {/* Brand & Mode Switcher */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl font-black tracking-tight text-black">
            <span className="text-3xl font-extrabold text-indigo-600">T</span>HE VIBE
          </span>
          {isAdminMode && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black text-white shadow-sm">
              <ShieldCheck className="w-3 h-3 text-indigo-400" />
              Admin
            </span>
          )}
        </div>

        <h1 className="text-2xl font-black text-gray-900 mt-3">
          {isAdminMode ? "Admin Sign In" : "Welcome Back"}
        </h1>
        <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
          {isAdminMode
            ? "Sign in with your administrator credentials to access the management panel."
            : "Sign in with your email and password to access your bag, orders, and wishlist."}
        </p>
      </div>

      {/* Mode Toggle Tabs */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 rounded-2xl mb-6">
        <button
          type="button"
          onClick={() => toggleAdminMode(false)}
          className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
            !isAdminMode
              ? "bg-white text-black shadow-sm"
              : "text-gray-500 hover:text-black"
          }`}
        >
          <UserIcon className="w-3.5 h-3.5" />
          <span>Customer</span>
        </button>
        <button
          type="button"
          onClick={() => toggleAdminMode(true)}
          className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
            isAdminMode
              ? "bg-black text-white shadow-sm"
              : "text-gray-500 hover:text-black"
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-indigo-400" />
          <span>Admin Portal</span>
        </button>
      </div>

      {/* Verified Notice */}
      {verifiedParam && !isUnverified && !errorMsg && (
        <div className="mb-6 p-3.5 bg-green-50 border border-green-200 text-green-800 text-xs rounded-xl flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          <div>
            <span className="font-semibold block">Account Verified!</span>
            <span>You can now sign in with your email address and password.</span>
          </div>
        </div>
      )}

      {/* Unverified Warning */}
      {isUnverified ? (
        <div className="mb-6 p-4 bg-amber-50/80 border border-amber-200 text-amber-900 text-xs rounded-2xl space-y-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-amber-950 block">Account Not Verified</span>
              <span>{errorMsg || "Your account must be verified before signing in."}</span>
            </div>
          </div>

          {resendStatus && (
            <div
              className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                resendStatus.type === "success"
                  ? "bg-green-100/70 border border-green-200 text-green-800"
                  : "bg-red-100/70 border border-red-200 text-red-800"
              }`}
            >
              {resendStatus.type === "success" ? (
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>{resendStatus.text}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-sm disabled:opacity-50"
          >
            {isResending ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Sending link...</span>
              </>
            ) : (
              <>
                <Mail className="w-3.5 h-3.5" />
                <span>Resend Verification Email</span>
              </>
            )}
          </button>
        </div>
      ) : (
        errorMsg && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            {/* Quick Switch Button if error suggests wrong portal */}
            {errorMsg.includes("Admin Login portal") && !isAdminMode && (
              <button
                type="button"
                onClick={() => toggleAdminMode(true)}
                className="text-xs font-bold text-indigo-700 hover:underline shrink-0"
              >
                Switch &rarr;
              </button>
            )}
            {errorMsg.includes("administrator privileges") && isAdminMode && (
              <button
                type="button"
                onClick={() => toggleAdminMode(false)}
                className="text-xs font-bold text-indigo-700 hover:underline shrink-0"
              >
                Switch &rarr;
              </button>
            )}
          </div>
        )
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
            {isAdminMode ? "Admin Email or Username" : "Email Address"}
          </label>
          <div className="relative">
            {isAdminMode ? (
              <Shield className="w-4 h-4 absolute left-3.5 top-3.5 text-indigo-500" />
            ) : (
              <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
            )}
            <input
              type={isAdminMode ? "text" : "email"}
              required
              autoComplete={isAdminMode ? "username" : "email"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isAdminMode ? "admin@thevibe.com or admin" : "name@example.com"}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full mt-2 py-3.5 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-md disabled:opacity-50 ${
            isAdminMode
              ? "bg-indigo-600 hover:bg-indigo-700 ring-2 ring-indigo-500/20"
              : "bg-black hover:bg-neutral-800"
          }`}
        >
          {isSubmitting ? (
            <span>Signing in...</span>
          ) : (
            <>
              <span>{isAdminMode ? "Access Admin Dashboard" : "Sign In"}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Bottom Switcher / Registration Links */}
      <div className="mt-8 text-center text-xs text-gray-500 border-t border-gray-100 pt-6 space-y-3">
        {isAdminMode ? (
          <div>
            <p className="text-[11px] text-gray-400 mb-2">
              Admin accounts are system-managed. Self-registration is disabled.
            </p>
            <button
              type="button"
              onClick={() => toggleAdminMode(false)}
              className="font-bold text-black hover:underline inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Back to Customer Sign In</span>
            </button>
          </div>
        ) : (
          <>
            <div>
              Don't have an account?{" "}
              <Link
                href={`/register${redirectUrl !== "/" ? `?redirect=${redirectUrl}` : ""}`}
                className="font-bold text-black hover:underline"
              >
                Create one now
              </Link>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => toggleAdminMode(true)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Sign in as Administrator &rarr;</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
