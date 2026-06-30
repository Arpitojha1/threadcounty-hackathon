"use client";

import { useReducer } from "react";
import { useRouter } from "next/navigation";
import { CutCornerPanel } from "@/components/ui/cut-corner-panel";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { PageLoader } from "@/components/ui/PageLoader";

type FormState = {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  loading: boolean;
  error: string | null;
  success: boolean;
  emailError: string;
  usernameError: string;
  passwordError: string;
  confirmError: string;
};

type FormAction =
  | { type: 'fieldChanged'; name: keyof Pick<FormState, 'email' | 'username' | 'password' | 'confirmPassword'>; value: string }
  | { type: 'submitStarted' }
  | { type: 'submitFailed'; error: string }
  | { type: 'submitSucceeded' }
  | { type: 'setErrors'; payload: Partial<FormState> };

const initialState: FormState = {
  email: '',
  username: '',
  password: '',
  confirmPassword: '',
  loading: false,
  error: null,
  success: false,
  emailError: '',
  usernameError: '',
  passwordError: '',
  confirmError: '',
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'fieldChanged':
      return { ...state, [action.name]: action.value };
    case 'submitStarted':
      return { ...state, loading: true, error: null, emailError: '', usernameError: '', passwordError: '', confirmError: '' };
    case 'submitFailed':
      return { ...state, loading: false, error: action.error };
    case 'submitSucceeded':
      return { ...state, loading: false, success: true };
    case 'setErrors':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}


export default function SignupPage() {
  const router = useRouter();
  const [state, dispatch] = useReducer(formReducer, initialState);
  const { email, username, password, confirmPassword, loading, error, success, emailError, usernameError, passwordError, confirmError } = state;

  const validate = () => {
    let isValid = true;
    let errorsToSet: Partial<FormState> = { emailError: '', usernameError: '', passwordError: '', confirmError: '' };

    if (!email.includes("@") || !email.includes(".")) {
      errorsToSet.emailError = "Please enter a valid email address.";
      isValid = false;
    }
    if (username.length < 3) {
      errorsToSet.usernameError = "Username must be at least 3 characters.";
      isValid = false;
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errorsToSet.usernameError = "Username can only contain letters, numbers, and underscores.";
      isValid = false;
    }
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

    let hasError = false;
    try {
      const supabase = createClient();

      // Grab 'data' alongside 'error'
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
          emailRedirectTo: `${window.location.origin}/auth/confirm?next=/dashboard`,
        },
      });

      if (signUpError) {
        hasError = true;
        let friendlyMsg = signUpError.message;
        if (!friendlyMsg || friendlyMsg === "{}" || friendlyMsg.trim() === "") {
          friendlyMsg = "Something went wrong creating your account — please try again.";
        } else if (friendlyMsg.includes("Password should be at least")) {
          friendlyMsg = "Your password is too weak. Please use at least 6 characters.";
        }
        dispatch({ type: 'submitFailed', error: friendlyMsg });
      } else if (data?.user && data.user.identities && data.user.identities.length === 0) {
        // 2. Catch the hidden "Email already exists" security feature
        hasError = true;
        dispatch({ type: 'submitFailed', error: "This email is already registered. Please log in." });
      } else {
        // 3. If we pass both checks, it was a true success!
        router.push("/dashboard");
        router.refresh();
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
            onChange={(e) => dispatch({ type: 'fieldChanged', name: 'email', value: e.target.value })}
            className="bg-white/80 border border-loom-iron/15 px-4 py-3 font-sans text-sm w-full focus:outline-none focus:border-shuttle-red transition-colors"
          />
          {emailError && (
            <p className="text-madder text-xs font-sans mt-1">{emailError}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="username"
            className="block font-sans text-sm font-medium text-loom-iron mb-1.5"
          >
            Username
          </label>
          <input
            id="username"
            type="text"
            required
            value={username}
            onChange={(e) => dispatch({ type: 'fieldChanged', name: 'username', value: e.target.value })}
            className="bg-white/80 border border-loom-iron/15 px-4 py-3 font-sans text-sm w-full focus:outline-none focus:border-shuttle-red transition-colors"
          />
          {usernameError && (
            <p className="text-madder text-xs font-sans mt-1">{usernameError}</p>
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
    </>
  );
}
