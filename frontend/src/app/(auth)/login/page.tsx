"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CutCornerPanel } from "@/components/ui/cut-corner-panel";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Read URL params for messages
  const urlError = searchParams.get("error");
  const urlMessage = searchParams.get("message");

  useEffect(() => {
    if (urlError === "verification_failed") {
      setError("Email verification failed or link expired. Please try signing up again.");
    }
  }, [urlError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();

    // Set cookie BEFORE sign-in so that the Supabase client catches it
    // during the internal set() call for the auth token.
    if (rememberMe) {
      document.cookie = "threadcounty_session_only=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    } else {
      document.cookie = "threadcounty_session_only=true; path=/;";
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setLoading(false);
      // Clean up the cookie if sign-in failed just in case
      document.cookie = "threadcounty_session_only=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      const msg = signInError.message.toLowerCase();
      if (msg.includes("invalid login credentials")) {
        setError("Wrong email or password. Please try again.");
      } else if (msg.includes("not confirmed") || msg.includes("email")) {
        setError("Your email has not been verified yet. Please check your inbox for the verification link.");
      } else {
        setError(signInError.message);
      }
      return;
    }

    router.push("/dashboard");
    router.refresh(); // Ensure server components update with the new session
  };

  return (
    <CutCornerPanel variant="muslin" size="lg" className="w-full p-8 md:p-10">
      <h1 className="font-display text-2xl uppercase text-loom-iron mb-2">
        SIGN IN
      </h1>
      <p className="font-sans text-sm text-concrete-grey mb-8">
        Access your fabric analysis dashboard
      </p>

      {error && (
        <div className="mb-6 bg-madder/10 border border-madder/30 text-madder text-sm p-3 font-sans">
          {error}
        </div>
      )}

      {urlMessage === "password_reset" && !error && (
        <div className="mb-6 bg-dye-indigo/10 border border-dye-indigo/30 text-dye-indigo text-sm p-3 font-sans">
          Password reset successful. Sign in with your new password.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
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

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="password"
              className="block font-sans text-sm font-medium text-loom-iron"
            >
              Password
            </label>
            <a
              href="/forgot-password"
              className="font-sans text-xs text-shuttle-red hover:underline"
            >
              Forgot your password?
            </a>
          </div>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-white/80 border border-loom-iron/15 px-4 py-3 font-sans text-sm w-full focus:outline-none focus:border-shuttle-red transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 pt-1 pb-3">
          <input
            id="remember-me"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 accent-shuttle-red"
          />
          <label
            htmlFor="remember-me"
            className="font-sans text-sm text-loom-iron/70 select-none cursor-pointer"
          >
            Remember me
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={cn(
            "w-full clip-cut-btn bg-shuttle-red text-muslin font-sans font-semibold py-3 transition-opacity",
            loading ? "opacity-60 cursor-not-allowed" : "hover:opacity-90"
          )}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <div className="mt-8 text-center font-sans text-sm text-loom-iron/70">
        Don&apos;t have an account?{" "}
        <a href="/signup" className="text-shuttle-red hover:underline">
          Create one
        </a>
      </div>
    </CutCornerPanel>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
