"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CutCornerPanel } from "@/components/ui/cut-corner-panel";
import { WeaveGrid } from "@/components/ui/weave-grid";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function ResetPasswordPage() {
  const router = useRouter();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inline validation errors
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");

  const validate = () => {
    let isValid = true;
    setPasswordError("");
    setConfirmError("");

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

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    // Success - redirect to login
    router.push("/login?message=password_reset");
  };

  return (
    <div className="relative min-h-screen bg-loom-iron flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <WeaveGrid opacity={0.03} color="muslin" density="sparse" />

      {/* Top Logo */}
      <div className="absolute top-8 left-0 right-0 flex justify-center z-10">
        <a
          href="/"
          className="flex items-baseline gap-0 font-display text-2xl uppercase tracking-wide"
        >
          <span className="text-muslin">THREAD</span>
          <span className="text-shuttle-red">COUNTY</span>
        </a>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <CutCornerPanel variant="muslin" size="lg" className="w-full p-8 md:p-10">
          <h1 className="font-display text-2xl uppercase text-loom-iron mb-2">
            SET NEW PASSWORD
          </h1>
          <p className="font-sans text-sm text-concrete-grey mb-8">
            Choose a strong password for your account
          </p>

          {error && (
            <div className="mb-6 bg-madder/10 border border-madder/30 text-madder text-sm p-3 font-sans">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="password"
                className="block font-sans text-sm font-medium text-loom-iron mb-1.5"
              >
                New Password
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
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </CutCornerPanel>
      </div>
    </div>
  );
}
