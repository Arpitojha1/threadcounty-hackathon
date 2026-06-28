"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CutCornerPanel } from "@/components/ui/cut-corner-panel";

type User = {
  id: string;
  full_name: string | null;
  created_at: string;
  tier: string;
};

export function UsersTableClient({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
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
        <div className="text-center py-12 bg-muslin/5 border border-muslin/10">
          <p className="font-sans text-concrete-grey">No users found.</p>
        </div>
      ) : (
        <div className="bg-muslin/5 border border-muslin/10 overflow-hidden overflow-x-auto">
          <table className="w-full text-left font-sans text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-muslin/10 bg-muslin/5">
                <th className="py-3 px-4 text-concrete-grey font-semibold uppercase tracking-wider text-xs">Name</th>
                <th className="py-3 px-4 text-concrete-grey font-semibold uppercase tracking-wider text-xs">Plan Tier</th>
                <th className="py-3 px-4 text-concrete-grey font-semibold uppercase tracking-wider text-xs">Joined Date</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-muslin/5 hover:bg-muslin/10 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-medium text-muslin">{u.full_name || 'Unknown User'}</div>
                    <div className="text-concrete-grey text-xs mt-0.5 font-mono">{u.id}</div>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={u.tier}
                      onChange={(e) => handleTierChange(u.id, e.target.value)}
                      disabled={updatingId === u.id}
                      className="bg-loom-iron border border-muslin/20 text-muslin text-xs px-2 py-1 font-mono uppercase focus:outline-none focus:border-shuttle-red disabled:opacity-50 appearance-none"
                    >
                      <option value="free">FREE</option>
                      <option value="student">STUDENT</option>
                      <option value="professional">PROFESSIONAL</option>
                      <option value="enterprise">ENTERPRISE</option>
                    </select>
                  </td>
                  <td className="py-3 px-4 text-concrete-grey font-mono text-xs">
                    {/* Using basic JS date instead of date-fns to avoid dependency issues if it's not installed */}
                    {new Date(u.created_at).toLocaleDateString('en-US')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
