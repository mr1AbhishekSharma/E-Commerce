"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { resendVerification } from "@/lib/api";
import { Lock, User as UserIcon, AlertCircle, ArrowRight, CheckCircle2, AlertTriangle, RefreshCw, Mail } from "lucide-react";

export default function LoginView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";
  const verifiedParam = searchParams.get("verified") === "true";
  const { login } = useAuth();

  const [username, setUsername] = useState("");
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

    const res = await login(username, password);
    setIsSubmitting(false);

    if (!res.success) {
      if (res.isVerified === false) {
        setIsUnverified(true);
        setUnverifiedEmail(res.email || username);
        setErrorMsg(res.error || "Account is not verified. Please check your email.");
      } else {
        setErrorMsg(res.error || "Invalid username or password");
      }
      return;
    }

    router.push(redirectUrl);
  };

  const handleResend = async () => {
    const targetEmail = unverifiedEmail || username;
    if (!targetEmail) return;

    setIsResending(true);
    setResendStatus(null);
    const res = await resendVerification(targetEmail);
    setIsResending(false);

    if (res.success) {
      setResendStatus({ type: "success", text: res.message || "Verification link resent! Check your inbox." });
    } else {
      setResendStatus({ type: "error", text: res.error || "Could not resend email. Please verify username/email." });
    }
  };

  return (
    <div className="w-full max-w-md bg-white border border-gray-200/80 rounded-3xl p-8 shadow-xl">
      <div className="text-center mb-8">
        <span className="text-2xl font-black tracking-tight text-black">
          <span className="text-3xl font-extrabold text-indigo-600">T</span>HE VIBE
        </span>
        <h1 className="text-2xl font-black text-gray-900 mt-3">Welcome Back</h1>
        <p className="text-xs text-gray-500 mt-1">
          Sign in to access your orders, saved addresses, and bag.
        </p>
      </div>

      {verifiedParam && !isUnverified && !errorMsg && (
        <div className="mb-6 p-3.5 bg-green-50 border border-green-200 text-green-800 text-xs rounded-xl flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          <div>
            <span className="font-semibold block">Account Verified!</span>
            <span>You can now sign in with your username and password.</span>
          </div>
        </div>
      )}

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
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
            Username
          </label>
          <div className="relative">
            <UserIcon className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. testuser"
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
          className="w-full mt-2 py-3.5 bg-black text-white font-bold rounded-xl hover:bg-neutral-800 transition flex items-center justify-center gap-2 text-sm shadow-md disabled:opacity-50"
        >
          {isSubmitting ? (
            <span>Signing in...</span>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 text-center text-xs text-gray-500 border-t border-gray-100 pt-6">
        Don't have an account?{" "}
        <Link
          href={`/register${redirectUrl !== "/" ? `?redirect=${redirectUrl}` : ""}`}
          className="font-bold text-black hover:underline"
        >
          Create one now
        </Link>
      </div>
    </div>
  );
}
