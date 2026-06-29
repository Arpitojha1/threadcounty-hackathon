"use client";

import { useReducer } from "react";
import { CutCornerPanel } from "@/components/ui/cut-corner-panel";
import { cn } from "@/lib/utils";

type FormState = {
  name: string;
  email: string;
  message: string;
  status: "idle" | "submitting" | "success" | "error";
  errorMessage: string;
};

type FormAction =
  | { type: 'fieldChanged'; name: keyof Pick<FormState, 'name' | 'email' | 'message'>; value: string }
  | { type: 'submitStarted' }
  | { type: 'submitFailed'; error: string }
  | { type: 'submitSucceeded' }
  | { type: 'reset' };

const initialState: FormState = {
  name: '',
  email: '',
  message: '',
  status: "idle",
  errorMessage: '',
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'fieldChanged':
      return { ...state, [action.name]: action.value };
    case 'submitStarted':
      return { ...state, status: "submitting", errorMessage: '' };
    case 'submitFailed':
      return { ...state, status: "error", errorMessage: action.error };
    case 'submitSucceeded':
      return { ...state, status: "success", name: '', email: '', message: '' };
    case 'reset':
      return { ...state, status: "idle" };
    default:
      return state;
  }
}

export function ContactClient() {
  const [state, dispatch] = useReducer(formReducer, initialState);
  const { name, email, message, status, errorMessage } = state;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: 'submitStarted' });

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send message");
      }

      dispatch({ type: 'submitSucceeded' });

      // Reset after 5 seconds
      setTimeout(() => {
        dispatch({ type: 'reset' });
      }, 5000);
    } catch (err: any) {
      dispatch({ type: 'submitFailed', error: err.message || "An unexpected error occurred." });
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-24 sm:py-32 grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
      
      {/* Left Column: Info */}
      <div>
        <h1 className="font-display text-5xl sm:text-6xl uppercase text-loom-iron mb-6">
          Get in <span className="text-shuttle-red">Touch</span>
        </h1>
        <p className="font-sans text-lg text-concrete-grey mb-12 max-w-md">
          Have questions about Enterprise deployment, custom AI models, or just want to say hi? We'd love to hear from you.
        </p>

        <div className="space-y-8">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-loom-iron mb-2">Support</div>
            <a href="mailto:support@threadcounty.com" className="font-display text-2xl uppercase text-shuttle-red hover:underline">
              support@threadcounty.com
            </a>
          </div>
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-loom-iron mb-2">Enterprise Sales</div>
            <a href="mailto:sales@threadcounty.com" className="font-display text-2xl uppercase text-shuttle-red hover:underline">
              sales@threadcounty.com
            </a>
          </div>
          <div className="pt-8 border-t border-loom-iron/10">
            <div className="font-mono text-xs uppercase tracking-widest text-loom-iron mb-2">HQ</div>
            <div className="font-sans text-concrete-grey">
              123 Innovation Drive<br />
              Suite 400<br />
              San Francisco, CA 94103
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Form */}
      <CutCornerPanel variant="muslin" size="lg" className="p-8 sm:p-10 border border-loom-iron/10 bg-white">
        <h2 className="font-display text-2xl uppercase text-loom-iron mb-8">Send a Message</h2>
        
        {status === "success" ? (
          <div className="bg-dye-indigo/10 border border-dye-indigo/30 p-6 text-center">
            <svg className="w-8 h-8 text-dye-indigo mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="square" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <h3 className="font-display text-xl uppercase text-dye-indigo mb-2">Message Sent</h3>
            <p className="font-sans text-sm text-dye-indigo/80">We'll get back to you as soon as possible.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {status === "error" && (
              <div className="bg-madder/10 border border-madder/30 p-4 font-sans text-sm text-madder">
                {errorMessage}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block font-sans text-sm font-medium text-loom-iron mb-1.5">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => dispatch({ type: 'fieldChanged', name: 'name', value: e.target.value })}
                className="bg-muslin/50 border border-loom-iron/15 px-4 py-3 font-sans text-sm w-full focus:outline-none focus:border-shuttle-red transition-colors"
                placeholder="Jane Doe"
              />
            </div>

            <div>
              <label htmlFor="email" className="block font-sans text-sm font-medium text-loom-iron mb-1.5">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => dispatch({ type: 'fieldChanged', name: 'email', value: e.target.value })}
                className="bg-muslin/50 border border-loom-iron/15 px-4 py-3 font-sans text-sm w-full focus:outline-none focus:border-shuttle-red transition-colors"
                placeholder="jane@example.com"
              />
            </div>

            <div>
              <label htmlFor="message" className="block font-sans text-sm font-medium text-loom-iron mb-1.5">
                Message
              </label>
              <textarea
                id="message"
                required
                rows={5}
                value={message}
                onChange={(e) => dispatch({ type: 'fieldChanged', name: 'message', value: e.target.value })}
                className="bg-muslin/50 border border-loom-iron/15 px-4 py-3 font-sans text-sm w-full focus:outline-none focus:border-shuttle-red transition-colors resize-none"
                placeholder="How can we help?"
              />
            </div>

            <button
              type="submit"
              disabled={status === "submitting"}
              className={cn(
                "w-full clip-cut-btn bg-shuttle-red text-muslin font-sans font-semibold py-4 transition-opacity",
                status === "submitting" ? "opacity-60 cursor-not-allowed" : "hover:opacity-90"
              )}
            >
              {status === "submitting" ? "Sending..." : "Send Message"}
            </button>
          </form>
        )}
      </CutCornerPanel>

    </div>
  );
}
