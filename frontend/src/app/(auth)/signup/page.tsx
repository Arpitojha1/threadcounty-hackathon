"use client";

import { useState } from "react";
import { CutCornerPanel } from "@/components/ui/cut-corner-panel";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Inline errors
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");

  const validate = () => {
    let isValid = true;
    setEmailError("");
    setPasswordError("");
    setConfirmError("");

    if (!email.includes("@") || !email.includes(".")) {
      setEmailError("Please enter a valid email address.");
      isValid = false;
    }
    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      isValid = false;
    }
    if (password !== confirmPassword) {
      setConfirmError("Passwords do not match.");
      isValid = false;
    }
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError(null);

    const supabase = createClient();

    // Grab 'data' alongside 'error'
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=/dashboard`,
      },
    });

    setLoading(false);

    // 1. Catch standard errors (like weak passwords)
    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    // 2. Catch the hidden "Email already exists" security feature
    if (data?.user && data.user.identities && data.user.identities.length === 0) {
      setError("This email is already registered. Please log in.");
      return;
    }

    // 3. If we pass both checks, it was a true success!
    setSuccess(true);
  };

  if (success) {
    return (
      <CutCornerPanel variant="muslin" size="lg" className="w-full p-8 md:p-10 text-center">
        <div className="flex justify-center mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="square"
            strokeLinejoin="miter"
            className="text-shuttle-red"
          >
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>
        <h1 className="font-display text-xl uppercase text-loom-iron mb-4">
          CHECK YOUR EMAIL
        </h1>
        <p className="font-sans text-sm text-loom-iron/70 mb-4">
          We&apos;ve sent a verification link to <span className="font-medium text-loom-iron">{email}</span>. Click the link to activate your account.
        </p>
        <p className="font-mono text-xs text-concrete-grey mb-8">
          Didn&apos;t receive it? Check your spam folder.
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
        CREATE ACCOUNT
      </h1>
      <p className="font-sans text-sm text-concrete-grey mb-8">
        Start analyzing fabric in under a minute
      </p>

      {error && (
        <div className="mb-6 bg-madder/10 border border-madder/30 text-madder text-sm p-3 font-sans">
          {error}
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
          {emailError && (
            <p className="text-madder text-xs font-sans mt-1">{emailError}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="block font-sans text-sm font-medium text-loom-iron mb-1.5"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-white/80 border border-loom-iron/15 px-4 py-3 font-sans text-sm w-full focus:outline-none focus:border-shuttle-red transition-colors"
          />
          {passwordError && (
            <p className="text-madder text-xs font-sans mt-1">{passwordError}</p>
          )}
        </div>

        <div className="pb-2">
          <label
            htmlFor="confirmPassword"
            className="block font-sans text-sm font-medium text-loom-iron mb-1.5"
          >
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="bg-white/80 border border-loom-iron/15 px-4 py-3 font-sans text-sm w-full focus:outline-none focus:border-shuttle-red transition-colors"
          />
          {confirmError && (
            <p className="text-madder text-xs font-sans mt-1">{confirmError}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className={cn(
            "w-full clip-cut-btn bg-shuttle-red text-muslin font-sans font-semibold py-3 transition-opacity",
            loading ? "opacity-60 cursor-not-allowed" : "hover:opacity-90"
          )}
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <div className="mt-8 text-center font-sans text-sm text-loom-iron/70">
        Already have an account?{" "}
        <a href="/login" className="text-shuttle-red hover:underline">
          Sign in
        </a>
      </div>
    </CutCornerPanel>
  );
}
