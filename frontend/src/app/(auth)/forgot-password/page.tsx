"use client";

import { useState } from "react";
import { CutCornerPanel } from "@/components/ui/cut-corner-panel";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?next=/auth/reset-password`,
    });

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSent(true);
  };

  if (sent) {
    return (
      <CutCornerPanel variant="muslin" size="lg" className="w-full p-8 md:p-10 text-center">
        <h1 className="font-display text-xl uppercase text-loom-iron mb-4">
          CHECK YOUR EMAIL
        </h1>
        <p className="font-sans text-sm text-loom-iron/70">
          If an account exists for that email, a password reset link has been sent.
        </p>
        <p className="font-mono text-xs text-concrete-grey mt-4 mb-8">
          The link will expire in 24 hours.
        </p>
        <a
          href="/login"
          className="font-sans text-sm font-semibold text-shuttle-red hover:underline"
        >
          Back to sign in
        </a>
      </CutCornerPanel>
    );
  }

  return (
    <CutCornerPanel variant="muslin" size="lg" className="w-full p-8 md:p-10">
      <h1 className="font-display text-2xl uppercase text-loom-iron mb-2">
        RESET PASSWORD
      </h1>
      <p className="font-sans text-sm text-concrete-grey mb-8">
        Enter your email and we&apos;ll send a reset link
      </p>

      {error && (
        <div className="mb-6 bg-madder/10 border border-madder/30 text-madder text-sm p-3 font-sans">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="pb-2">
          <label
            htmlFor="email"
            className="block font-sans text-sm font-medium text-loom-iron mb-1.5"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-white/80 border border-loom-iron/15 px-4 py-3 font-sans text-sm w-full focus:outline-none focus:border-shuttle-red transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={cn(
            "w-full clip-cut-btn bg-shuttle-red text-muslin font-sans font-semibold py-3 transition-opacity",
            loading ? "opacity-60 cursor-not-allowed" : "hover:opacity-90"
          )}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>

      <div className="mt-8 text-center font-sans text-sm text-loom-iron/70">
        Remember your password?{" "}
        <a href="/login" className="text-shuttle-red hover:underline">
          Sign in
        </a>
      </div>
    </CutCornerPanel>
  );
}
