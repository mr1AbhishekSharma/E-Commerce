"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { verifyEmail, resendVerification } from "@/lib/api";
import { CheckCircle2, XCircle, Mail, Loader2, ArrowRight, RefreshCw, AlertCircle } from "lucide-react";

export default function VerifyEmailView() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const urlStatus = searchParams.get("status");
  const urlMessage = searchParams.get("message");
  const urlEmail = searchParams.get("email");

  const [state, setState] = useState<"loading" | "success" | "error" | "idle">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [emailForResend, setEmailForResend] = useState<string>(urlEmail || "");
  const [isResending, setIsResending] = useState<boolean>(false);
  const [resendStatus, setResendStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const verifiedRef = useRef(false);

  useEffect(() => {
    // If backend already redirected here with status parameter
    if (urlStatus === "success") {
      setState("success");
      setSuccessMessage(urlMessage || "Your email has been verified successfully!");
      return;
    }

    if (urlStatus === "error") {
      setState("error");
      setErrorMessage(urlMessage || "The verification link is invalid or has expired.");
      return;
    }

    // If token is present, call verifyEmail API
    if (token) {
      if (verifiedRef.current) return;
      verifiedRef.current = true;

      setState("loading");
      verifyEmail(token)
        .then((res) => {
          if (res.success) {
            setState("success");
            setSuccessMessage(res.message || "Your email has been verified successfully!");
          } else {
            setState("error");
            setErrorMessage(res.error || "The verification link is invalid or has expired.");
          }
        })
        .catch(() => {
          setState("error");
          setErrorMessage("Failed to verify email. Please try again.");
        });
      return;
    }

    // No token and no status
    setState("idle");
  }, [token, urlStatus, urlMessage]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailForResend.trim()) {
      setResendStatus({ type: "error", text: "Please enter your email address." });
      return;
    }

    setIsResending(true);
    setResendStatus(null);

    const res = await resendVerification(emailForResend.trim());
    setIsResending(false);

    if (res.success) {
      setResendStatus({
        type: "success",
        text: res.message || "A new verification link has been sent to your email.",
      });
    } else {
      setResendStatus({
        type: "error",
        text: res.error || "Failed to resend verification email. Check if the email is correct.",
      });
    }
  };

  return (
    <div className="w-full max-w-md bg-white border border-gray-200/80 rounded-3xl p-8 shadow-xl">
      <div className="text-center mb-6">
        <span className="text-2xl font-black tracking-tight text-black">
          <span className="text-3xl font-extrabold text-indigo-600">T</span>HE VIBE
        </span>
      </div>

      {/* Loading state */}
      {state === "loading" && (
        <div className="text-center py-8 space-y-4">
          <div className="w-16 h-16 mx-auto bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center animate-spin">
            <Loader2 className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Verifying Your Email</h1>
          <p className="text-xs text-gray-500 max-w-xs mx-auto">
            Please wait while we verify your account credentials...
          </p>
        </div>
      )}

      {/* Success state */}
      {state === "success" && (
        <div className="text-center py-6 space-y-5">
          <div className="w-16 h-16 mx-auto bg-green-50 text-green-600 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Account Verified!</h1>
            <p className="text-sm text-gray-600 mt-2">
              {successMessage || "Your email has been verified. You can now log into your account and start shopping."}
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/login?verified=true"
              className="w-full py-3.5 bg-black text-white font-bold rounded-xl hover:bg-neutral-800 transition flex items-center justify-center gap-2 text-sm shadow-md"
            >
              <span>Continue to Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Error state */}
      {state === "error" && (
        <div className="text-center py-4 space-y-5">
          <div className="w-16 h-16 mx-auto bg-red-50 text-red-600 rounded-full flex items-center justify-center">
            <XCircle className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900">Verification Link Invalid</h1>
            <p className="text-xs text-red-600 mt-1.5 font-medium">{errorMessage}</p>
            <p className="text-xs text-gray-500 mt-1">
              Links expire after 24 hours or after single use. Request a new link below.
            </p>
          </div>

          <form onSubmit={handleResend} className="space-y-3 text-left pt-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600">
              Your Account Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
              <input
                type="email"
                required
                value={emailForResend}
                onChange={(e) => setEmailForResend(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            {resendStatus && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
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

            <button
              type="submit"
              disabled={isResending}
              className="w-full py-3 bg-black text-white font-bold rounded-xl hover:bg-neutral-800 transition flex items-center justify-center gap-2 text-sm shadow-md disabled:opacity-50"
            >
              {isResending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sending Link...</span>
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  <span>Resend Verification Link</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-xs text-gray-500">
            <Link href="/login" className="font-bold text-black hover:underline">
              Return to Sign In
            </Link>
          </div>
        </div>
      )}

      {/* Idle state (manual link request) */}
      {state === "idle" && (
        <div className="text-center py-4 space-y-5">
          <div className="w-16 h-16 mx-auto bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900">Email Verification</h1>
            <p className="text-xs text-gray-500 mt-1">
              Enter your registered email address to receive an account activation link.
            </p>
          </div>

          <form onSubmit={handleResend} className="space-y-3 text-left pt-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600">
              Account Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
              <input
                type="email"
                required
                value={emailForResend}
                onChange={(e) => setEmailForResend(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            {resendStatus && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
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

            <button
              type="submit"
              disabled={isResending}
              className="w-full py-3 bg-black text-white font-bold rounded-xl hover:bg-neutral-800 transition flex items-center justify-center gap-2 text-sm shadow-md disabled:opacity-50"
            >
              {isResending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sending Link...</span>
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  <span>Send Verification Link</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-xs text-gray-500">
            <Link href="/login" className="font-bold text-black hover:underline">
              Return to Sign In
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
