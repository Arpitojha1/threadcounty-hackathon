"use client";
import Link from "next/link";

import { useReducer, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CutCornerPanel } from "@/components/ui/cut-corner-panel";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { setRememberMeCookie, clearRememberMeCookie } from "@/app/auth/cookie-actions";
import { PageLoader } from "@/components/ui/PageLoader";

type FormState = {
  email: string;
  password: string;
  rememberMe: boolean;
  loading: boolean;
  error: string | null;
};

type FormAction =
  | { type: 'fieldChanged'; name: keyof Pick<FormState, 'email' | 'password' | 'rememberMe'>; value: any }
  | { type: 'submitStarted' }
  | { type: 'submitFailed'; error: string }
  | { type: 'submitSucceeded' }
  | { type: 'setError'; error: string };

const initialState: FormState = {
  email: '',
  password: '',
  rememberMe: true,
  loading: false,
  error: null,
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'fieldChanged':
      return { ...state, [action.name]: action.value };
    case 'submitStarted':
      return { ...state, loading: true, error: null };
    case 'submitFailed':
      return { ...state, loading: false, error: action.error };
    case 'submitSucceeded':
      return { ...state, loading: false };
    case 'setError':
      return { ...state, error: action.error };
    default:
      return state;
  }
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [state, dispatch] = useReducer(formReducer, initialState);
  const { email, password, rememberMe, loading, error } = state;

  // Read URL params for messages
  const urlError = searchParams.get("error");
  const urlMessage = searchParams.get("message");

  useEffect(() => {
    if (urlError === "verification_failed") {
      dispatch({ type: 'setError', error: "Email verification failed or link expired. Please try signing up again." });
    }
  }, [urlError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: 'submitStarted' });

    let hasError = false;
    try {
      const supabase = createClient();
      await setRememberMeCookie(rememberMe);

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        hasError = true;
        await clearRememberMeCookie();
        const msg = signInError.message.toLowerCase();
        if (msg.includes("invalid login credentials")) {
          dispatch({ type: 'submitFailed', error: "Wrong email or password. Please try again." });
        } else if (msg.includes("not confirmed") || msg.includes("email")) {
          dispatch({ type: 'submitFailed', error: "Your email has not been verified yet. Please check your inbox for the verification link." });
        } else {
          dispatch({ type: 'submitFailed', error: signInError.message });
        }
      } else {
        router.push("/dashboard");
        router.refresh(); // Ensure server components update with the new session
      }
    } catch (err: any) {
      hasError = true;
      dispatch({ type: 'submitFailed', error: err.message || "An unexpected error occurred." });
    } finally {
      if (!hasError) {
        dispatch({ type: 'submitSucceeded' });
      }
    }
  };

  return (
    <>
      <PageLoader isVisible={loading} />
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
            onChange={(e) => dispatch({ type: 'fieldChanged', name: 'email', value: e.target.value })}
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
            <Link
              href="/forgot-password"
              className="font-sans text-xs text-shuttle-red hover:underline"
            >
              Forgot your password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => dispatch({ type: 'fieldChanged', name: 'password', value: e.target.value })}
            className="bg-white/80 border border-loom-iron/15 px-4 py-3 font-sans text-sm w-full focus:outline-none focus:border-shuttle-red transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 pt-1 pb-3">
          <input
            id="remember-me"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => dispatch({ type: 'fieldChanged', name: 'rememberMe', value: e.target.checked })}
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
        <Link href="/signup" className="text-shuttle-red hover:underline">
          Create one
        </Link>
      </div>
    </CutCornerPanel>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
