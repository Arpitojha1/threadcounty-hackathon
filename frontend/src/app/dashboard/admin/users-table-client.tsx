"use client";

import { useState, Fragment } from "react";
import { createClient } from "@/lib/supabase/client";
import { CutCornerPanel } from "@/components/ui/cut-corner-panel";
import { cn } from "@/lib/utils";

type User = {
  id: string;
  full_name: string | null;
  username: string | null;
  created_at: string;
  tier: string;
};

export function UsersTableClient({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  
  const supabase = createClient();

  const handleTierChange = async (userId: string, newTier: string) => {
    // Find the original user to enable rollback
    const originalUser = users.find(u => u.id === userId);
    if (!originalUser || originalUser.tier === newTier) return;

    // Optimistic UI Update
    setUpdatingId(userId);
    setErrorMsg(null);
    setUsers(prev => prev.map(u => (u.id === userId ? { ...u, tier: newTier } : u)));

    try {
      // Call the RPC that securely resets the billing cycle and updates the tier server-side
      const { error } = await supabase.rpc('admin_update_tier', {
        target_user_id: userId,
        new_tier: newTier
      });

      if (error) {
        throw error;
      }
    } catch (err: any) {
      // Rollback on failure
      setUsers(prev => prev.map(u => (u.id === userId ? { ...u, tier: originalUser.tier } : u)));
      
      // Clean sanitized error message for invalid tier cast or RLS rejections
      let sanitized = "Failed to update tier due to a network or server error.";
      if (err?.message?.includes("invalid input value for enum")) {
        sanitized = `Invalid tier selected. The database rejected '${newTier}'.`;
      } else if (err?.message?.includes("Unauthorized") || err?.code === '42501') {
        sanitized = "You do not have permission to change tiers.";
      }
      
      setErrorMsg(sanitized);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {errorMsg && (
        <CutCornerPanel variant="shuttle-red" size="sm" bordered className="p-4 mb-4">
          <p className="font-sans text-sm text-muslin font-medium">{errorMsg}</p>
        </CutCornerPanel>
      )}
      
      {(!users || users.length === 0) ? (
        <div className="text-center py-12 bg-loom-iron/5 dark:bg-muslin/5 border border-loom-iron/10 dark:border-muslin/10">
          <p className="font-sans text-concrete-grey">No users found.</p>
        </div>
      ) : (
        <div className="bg-loom-iron/5 dark:bg-muslin/5 border border-loom-iron/10 dark:border-muslin/10 overflow-hidden overflow-x-auto">
          <table className="w-full text-left font-sans text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-loom-iron/10 dark:border-muslin/10 bg-loom-iron/5 dark:bg-muslin/5">
                <th className="py-3 px-4 text-concrete-grey font-semibold uppercase tracking-wider text-xs">Name</th>
                <th className="py-3 px-4 text-concrete-grey font-semibold uppercase tracking-wider text-xs">Plan Tier</th>
                <th className="py-3 px-4 text-concrete-grey font-semibold uppercase tracking-wider text-xs">Joined Date</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                let badgeClasses = "";
                if (u.tier === "free") {
                  badgeClasses = "text-concrete-grey bg-transparent";
                } else if (u.tier === "student") {
                  badgeClasses = "text-loom-iron dark:text-muslin border border-loom-iron/30 dark:border-muslin/30 bg-transparent";
                } else if (u.tier === "professional") {
                  badgeClasses = "text-loom-iron dark:text-muslin bg-loom-iron/10 dark:bg-muslin/20 border border-transparent";
                } else if (u.tier === "enterprise") {
                  badgeClasses = "text-muslin dark:text-loom-iron bg-loom-iron dark:bg-muslin border border-transparent";
                }

                return (
                  <Fragment key={u.id}>
                    <tr className="border-b border-loom-iron/5 dark:border-muslin/5 hover:bg-loom-iron/10 dark:hover:bg-muslin/10 transition-colors cursor-pointer" onClick={() => toggleExpand(u.id)}>
                      <td className="py-3 px-4">
                        <div className="font-medium text-loom-iron dark:text-muslin flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" className={cn("transition-transform text-concrete-grey", expandedIds.has(u.id) ? "rotate-90" : "")}><polyline points="9 18 15 12 9 6"></polyline></svg>
                          {u.full_name || 'Unknown User'}
                        </div>
                        {u.username && (
                          <div className="text-xs text-concrete-grey font-mono mt-0.5 ml-6">
                            @{u.username}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={u.tier}
                          onChange={(e) => handleTierChange(u.id, e.target.value)}
                          disabled={updatingId === u.id}
                          className={cn("text-xs px-2 py-1 font-mono uppercase focus:outline-none focus:ring-1 focus:ring-shuttle-red disabled:opacity-50 appearance-none cursor-pointer transition-colors", badgeClasses)}
                        >
                          <option value="free" className="bg-white dark:bg-loom-iron text-loom-iron dark:text-muslin">FREE</option>
                          <option value="student" className="bg-white dark:bg-loom-iron text-loom-iron dark:text-muslin">STUDENT</option>
                          <option value="professional" className="bg-white dark:bg-loom-iron text-loom-iron dark:text-muslin">PROFESSIONAL</option>
                          <option value="enterprise" className="bg-white dark:bg-loom-iron text-loom-iron dark:text-muslin">ENTERPRISE</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-concrete-grey font-mono text-xs">
                        {/* Using basic JS date instead of date-fns to avoid dependency issues if it's not installed */}
                        {new Date(u.created_at).toLocaleDateString('en-US')}
                      </td>
                    </tr>
                    {expandedIds.has(u.id) && (
                      <tr className="bg-loom-iron/5 dark:bg-muslin/5 border-b border-loom-iron/5 dark:border-muslin/5">
                        <td colSpan={3} className="py-2 px-4 pl-10 text-xs font-mono text-concrete-grey">
                          <span className="font-sans uppercase tracking-widest text-[10px] mr-2">UUID:</span>
                          {u.id}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
