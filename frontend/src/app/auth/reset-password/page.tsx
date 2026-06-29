"use client";

import { useReducer, Suspense } from "react";
import { useRouter } from "next/navigation";
import { CutCornerPanel } from "@/components/ui/cut-corner-panel";
import { WeaveGrid } from "@/components/ui/weave-grid";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type FormState = {
  password: string;
  confirmPassword: string;
  loading: boolean;
  error: string | null;
  passwordError: string;
  confirmError: string;
};

type FormAction =
  | { type: 'fieldChanged'; name: keyof Pick<FormState, 'password' | 'confirmPassword'>; value: string }
  | { type: 'submitStarted' }
  | { type: 'submitFailed'; error: string }
  | { type: 'submitSucceeded' }
  | { type: 'setErrors'; payload: Partial<FormState> };

const initialState: FormState = {
  password: '',
  confirmPassword: '',
  loading: false,
  error: null,
  passwordError: '',
  confirmError: '',
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'fieldChanged':
      return { ...state, [action.name]: action.value };
    case 'submitStarted':
      return { ...state, loading: true, error: null, passwordError: '', confirmError: '' };
    case 'submitFailed':
      return { ...state, loading: false, error: action.error };
    case 'submitSucceeded':
      return { ...state, loading: false };
    case 'setErrors':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

export default function ResetPasswordPage() {
  const router = useRouter();
  
  const [state, dispatch] = useReducer(formReducer, initialState);
  const { password, confirmPassword, loading, error, passwordError, confirmError } = state;

  const validate = () => {
    let isValid = true;
    let errorsToSet: Partial<FormState> = { passwordError: "", confirmError: "" };

    if (password.length < 6) {
      errorsToSet.passwordError = "Password must be at least 6 characters.";
      isValid = false;
    }
    if (password !== confirmPassword) {
      errorsToSet.confirmError = "Passwords do not match.";
      isValid = false;
    }
    
    dispatch({ type: 'setErrors', payload: errorsToSet });
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    dispatch({ type: 'submitStarted' });

    const supabase = createClient();

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      dispatch({ type: 'submitFailed', error: updateError.message });
      return;
    }

    dispatch({ type: 'submitSucceeded' });

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
                onChange={(e) => dispatch({ type: 'fieldChanged', name: 'password', value: e.target.value })}
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
                onChange={(e) => dispatch({ type: 'fieldChanged', name: 'confirmPassword', value: e.target.value })}
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
