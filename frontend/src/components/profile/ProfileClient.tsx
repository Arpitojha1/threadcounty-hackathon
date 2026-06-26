"use client";

import { useState, useEffect } from "react";
import { CutCornerPanel } from "@/components/ui/cut-corner-panel";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function ProfileClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [passMessage, setPassMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || "");
      }
    }
    loadUser();
  }, [supabase.auth]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    
    setPassLoading(true);
    setPassMessage(null);

    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      // Handle the stale-session / AuthSessionMissingError gracefully
      if (error.message.toLowerCase().includes("session") || error.status === 401) {
        setPassMessage({
          type: "error",
          text: "Your session has expired. Please log out and back in to change your password."
        });
      } else {
        setPassMessage({
          type: "error",
          text: error.message
        });
      }
    } else {
      setPassMessage({
        type: "success",
        text: "Password updated successfully."
      });
      setPassword("");
    }
    setPassLoading(false);
  };

  const handleRequestDeletion = async () => {
    if (!window.confirm("Are you sure you want to request account deletion? This action will mark your account for deletion and log you out immediately.")) {
      return;
    }

    setDeleteLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Soft delete: mark profile with deleted_at
      await supabase
        .from("profiles")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", user.id);
    }

    // Sign out to enforce the soft delete immediately
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  // Extract initials for the avatar placeholder
  const initials = email ? email.substring(0, 2).toUpperCase() : "??";

  return (
    <div className="w-full max-w-4xl space-y-12 pb-24">
      <div className="mb-8">
        <h1 className="font-display text-4xl uppercase text-loom-iron dark:text-muslin mb-2">
          Your Profile
        </h1>
        <p className="font-sans text-concrete-grey">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Avatar & Basic Info */}
        <div className="md:col-span-1 space-y-6">
          <CutCornerPanel variant="muslin" bordered size="sm" className="p-8 flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-loom-iron dark:bg-muslin clip-cut-btn flex items-center justify-center mb-6">
              <span className="font-display text-3xl text-muslin dark:text-loom-iron">{initials}</span>
            </div>
            <h3 className="font-sans font-medium text-loom-iron dark:text-muslin mb-1 truncate w-full">{email}</h3>
            <p className="font-mono text-xs text-concrete-grey">Standard Plan</p>
          </CutCornerPanel>
        </div>

        {/* Right Column: Forms */}
        <div className="md:col-span-2 space-y-8">
          
          {/* Security Panel */}
          <CutCornerPanel variant="muslin" bordered size="sm" className="p-8">
            <h2 className="font-display text-2xl uppercase text-loom-iron dark:text-muslin mb-6">Security</h2>
            
            <form onSubmit={handleUpdatePassword} className="space-y-6">
              {passMessage && (
                <div className={cn(
                  "p-4 font-sans text-sm",
                  passMessage.type === "error" ? "bg-madder/10 border border-madder/30 text-madder" : "bg-dye-indigo/10 border border-dye-indigo/30 text-dye-indigo"
                )}>
                  {passMessage.text}
                </div>
              )}

              <div>
                <label htmlFor="new-password" className="block font-sans text-sm font-medium text-loom-iron dark:text-muslin/80 mb-1.5">
                  New Password
                </label>
                <input
                  id="new-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-muslin/50 dark:bg-black/20 border border-loom-iron/15 dark:border-muslin/15 px-4 py-3 font-sans text-sm w-full focus:outline-none focus:border-shuttle-red transition-colors text-loom-iron dark:text-muslin"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={passLoading || !password}
                className={cn(
                  "clip-cut-btn bg-loom-iron dark:bg-muslin text-muslin dark:text-loom-iron px-6 py-3 font-sans font-semibold transition-opacity",
                  (passLoading || !password) ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"
                )}
              >
                {passLoading ? "Updating..." : "Update Password"}
              </button>
            </form>
          </CutCornerPanel>

          {/* Danger Zone */}
          <CutCornerPanel variant="transparent" bordered size="sm" className="p-8 border-madder/30 bg-madder/5">
            <h2 className="font-display text-2xl uppercase text-madder mb-2">Danger Zone</h2>
            <p className="font-sans text-sm text-loom-iron/70 dark:text-muslin/70 mb-6 max-w-md">
              Requesting account deletion will mark your profile for removal and log you out immediately. Your authentication record will remain until manually purged by support.
            </p>
            
            <button
              onClick={handleRequestDeletion}
              disabled={deleteLoading}
              className={cn(
                "clip-cut-btn bg-madder text-muslin px-6 py-3 font-sans font-semibold transition-opacity",
                deleteLoading ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"
              )}
            >
              {deleteLoading ? "Processing..." : "Request Account Deletion"}
            </button>
          </CutCornerPanel>

        </div>
      </div>
    </div>
  );
}
