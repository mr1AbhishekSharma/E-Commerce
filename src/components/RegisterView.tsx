"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { resendVerification } from "@/lib/api";
import { Lock, User as UserIcon, Mail, AlertCircle, ArrowRight, CheckCircle2, RefreshCw } from "lucide-react";

export default function RegisterView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/shop";
  const { register } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Email verification prompt state
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long");
      return;
    }

    setIsSubmitting(true);

    const res = await register(username, email, password);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMsg(res.error || "Registration failed. Try a different username or email.");
      return;
    }

    if (res.requiresVerification) {
      setRegisteredEmail(email);
      return;
    }

    router.push(redirectUrl);
  };

  const handleResend = async () => {
    if (!registeredEmail) return;
    setIsResending(true);
    setResendStatus(null);
    const res = await resendVerification(registeredEmail);
    setIsResending(false);
    if (res.success) {
      setResendStatus({ type: "success", text: res.message || "Verification link sent! Check your inbox." });
    } else {
      setResendStatus({ type: "error", text: res.error || "Could not resend verification email." });
    }
  };

  if (registeredEmail) {
    return (
      <div className="w-full max-w-md bg-white border border-gray-200/80 rounded-3xl p-8 shadow-xl text-center space-y-6">
        <div>
          <span className="text-2xl font-black tracking-tight text-black">
            <span className="text-3xl font-extrabold text-indigo-600">T</span>HE VIBE
          </span>
        </div>

        <div className="w-16 h-16 mx-auto bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
          <Mail className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-gray-900">Check Your Inbox</h1>
          <p className="text-sm text-gray-600 leading-relaxed">
            We sent an account verification link to <br />
            <strong className="text-gray-900 font-semibold">{registeredEmail}</strong>
          </p>
          <p className="text-xs text-gray-400">
            Click the link in the email to activate your account. Once verified, you can sign in.
          </p>
        </div>

        {resendStatus && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center justify-center gap-2 ${
              resendStatus.type === "success"
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}
          >
            {resendStatus.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{resendStatus.text}</span>
          </div>
        )}

        <div className="space-y-3 pt-2">
          <Link
            href="/login"
            className="w-full py-3.5 bg-black text-white font-bold rounded-xl hover:bg-neutral-800 transition flex items-center justify-center gap-2 text-sm shadow-md"
          >
            <span>Proceed to Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-xl border border-gray-200 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isResending ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Resending Email...</span>
              </>
            ) : (
              <>
                <Mail className="w-3.5 h-3.5" />
                <span>Didn't receive email? Resend</span>
              </>
            )}
          </button>
        </div>

        <div className="border-t border-gray-100 pt-4 text-xs text-gray-500">
          Entered the wrong address?{" "}
          <button
            type="button"
            onClick={() => setRegisteredEmail(null)}
            className="font-bold text-black hover:underline"
          >
            Change email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-white border border-gray-200/80 rounded-3xl p-8 shadow-xl">
      <div className="text-center mb-8">
        <span className="text-2xl font-black tracking-tight text-black">
          <span className="text-3xl font-extrabold text-indigo-600">T</span>HE VIBE
        </span>
        <h1 className="text-2xl font-black text-gray-900 mt-3">Create an Account</h1>
        <p className="text-xs text-gray-500 mt-1">
          Join The Vibe to track orders and enjoy personalized checkout.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
            Username *
          </label>
          <div className="relative">
            <UserIcon className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. johndoe"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
            Email Address *
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. john@example.com"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
            Password *
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

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
            Confirm Password *
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            <span>Creating account...</span>
          ) : (
            <>
              <span>Create Account</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 text-center text-xs text-gray-500 border-t border-gray-100 pt-6">
        Already have an account?{" "}
        <Link
          href={`/login${redirectUrl !== "/shop" ? `?redirect=${redirectUrl}` : ""}`}
          className="font-bold text-black hover:underline"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
